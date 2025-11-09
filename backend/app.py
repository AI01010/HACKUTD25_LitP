from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from catboost import CatBoostRegressor, Pool
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel
import pandas as pd

systemPrompt = '''
You are a real estate data extraction specialist. You take input from users and determine what metrics or features they are looking for in a given data set and prompt them for the data if there is none provided.

Your task is to provide a user friendly experience for the user and secure their data.

## Input Format
You may receive multiple building documents. Each document starts with a header:
```
--- FILE: {filename} ---
{document_text}
```

## Output Format
If documents are provided:
    send it to the backend for processing.
    send extracted features from user input to backend for processing as a list.
If no documents are provided:
    1st ask the user what building attributes they are interested in analyzing.
    Then, Prompt the user to upload building documents for analysis.


## Instructions
1. Extract ALL relevant building attributes you can identify from user input (e.g., square footage, lot size, year built, bedrooms, bathrooms, stories, property type, condition, roof type, HVAC system, garage spaces, amenities, location details, nearby schools/stores, building_value, etc.).
2. Create columns dynamically based on what information is present across input. If a feature appears, include it as a column.
3. For missing values within a column, use empty strings or -1 or NaN if appropriate for numeric fields.
4. Treat each user input as one building (one CSV row).
5. Ensure all values are properly escaped and formatted for CSV parsing.
6. Do not include commas in field values unless they are properly quoted.

## Prediction Feature
If the user seems to want to predict features or generate predictions based on the data, the message should include the line "|PREDICTING|", preferably at the start.
'''

loaded_model = CatBoostRegressor()
loaded_model.load_model("catboost_model.cbm")

# ==============================
# Flask app setup
# ==============================
app = Flask(__name__)

# Enable CORS for React frontend (localhost:3000)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


# Create uploads directory
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# Routes
# ==============================

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the HackUTD Backend!"})

apiKey = os.getenv("OPENROUTER_KEY")

# print(f"Api key is this: {apiKey}")

url = "https://openrouter.ai/api/v1/chat/completions"

modelData = {
  "model": "openai/gpt-oss-20b:free",    # or whichever free model
  "temperature": 0.3,        # Lower = more deterministic, higher = more creative
  "max_tokens": 16000,        # Limit size of model’s response
  "messages": [
    {"role": "system", "content": systemPrompt},
  ]
}

headers = {
  "Authorization": f"Bearer {apiKey}",
  "Content-Type": "application/json"
}

def getResponse(message):
    global modelData
    try:
        modelData["messages"].append({"role": "user", "content": message})
        resp = requests.post(url, json=modelData, headers=headers)
        resp.raise_for_status()  # raises an HTTPError if status >= 400
        response = resp.json()
        botMessage = response["choices"][0]["message"]["content"]
    except requests.HTTPError as e:
        print("HTTP error:", e, resp.text)
        botMessage = "Upstream error."
    except Exception as e:
        print("Unexpected error:", e)
        botMessage = "Server error."
    
    modelData["messages"].append({"role": "assistant", "content": botMessage})
    # Keep last 10 messages
    if len(modelData["messages"]) > 11:
        modelData["messages"] = [modelData["messages"][0]] + modelData["messages"][-10:]
    return botMessage

def split_string_n_ways(string, numDivisions):
    length = len(string)
    chunk_size = length // numDivisions
    chunks = []

    for i in range(numDivisions):
        start = i * chunk_size
        # Last chunk takes the remainder
        end = None if i == numDivisions-1 else (i+1) * chunk_size
        chunks.append(string[start:end])
    return chunks

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

def chunkSummarize(textChunk):
    summary = summarizer(textChunk, max_length=len(textChunk) * 0.6, min_length=len(textChunk) * 0.4, do_sample=False)
    return summary[0]["summary_text"]

# Load the base model
base_model_name = "google/flan-t5-base"  # or the model you used for LoRA fine-tuning
base_model = AutoModelForSeq2SeqLM.from_pretrained(base_model_name)

# Load the LoRA adapters
model = PeftModel.from_pretrained(base_model, "./flan-t5-lora-finetuned")
# Load the tokenizer
tokenizer = AutoTokenizer.from_pretrained("./flan-t5-lora-finetuned")

def useWithModel(evaluatingString, isPredicting):
    try:
        # Split into rows
        rows = evaluatingString.strip().split("\n")

        data_list = []
        for line in rows:
            row_dict = {}
            for pair in line.split(","):
                key, value = pair.split(":", 1)
                if(key == "buildingStatus"):
                    key = "status"
                row_dict[key.strip()] = value.strip()
            data_list.append(row_dict)

        # Convert to DataFrame
        df = pd.DataFrame(data_list)

        numeric_cols = ['price', 'numBedrooms', 'numBathrooms', 'acre_lot', 'house_size']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        categorical_cols = ['status', 'city', 'state']
        for col in categorical_cols:
            df[col] = df[col].astype(str)

        # Prepare features (drop target column if present)
        y = df["price"]
        X = df.drop(columns=['price'])  # if price is the target

        if(not isPredicting):
            model2 = CatBoostRegressor(iterations=50, learning_rate=0.1)
            model2.fit(X, y, init_model=loaded_model)
            loaded_model = model2


        
        pred = loaded_model.predict(X)

        MSE = (y - pred) ** 2

        print(f"MSE was {MSE}")

        return MSE



    except Exception as e:
        print(f"Error tring to parse; result was {evaluatingString}, exception was {e}")
        return "FAILURE"

    
def getFeatures(string, isPredicting):
    # Encode input
    inputs = tokenizer(string, return_tensors="pt", truncation=True)

    # Generate output
    outputs = model.generate(**inputs, max_length=1000, min_length=10, do_sample=False)

    # Decode
    summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return useWithModel(summary, isPredicting)


def addFeatures(textFile, isPredicting):
    finalList = [textFile]
    numTokens = len(textFile) / 4
    if(numTokens > 900):
        numChunks = len(textFile) / (4 * 900)
        createdChunks = split_string_n_ways(textFile, numChunks)
        if(len(createdChunks[-1]) < (4 * 900) / 5):
            createdChunks[-2] += createdChunks[-1]
            createdChunks.pop()
        for i in range(0, len(createdChunks), 1):
            createdChunks[i] = chunkSummarize(createdChunks[i])
        pooledChunk = [createdChunks[i] + createdChunks[i+1] for i in range(0, len(createdChunks), 2)] 

        finalList = pooledChunk

        # if it was greater than another split, we must split it again
        if(numTokens > 1800):
            for i in range(0, len(createdChunks), 1):
                createdChunks[i] = chunkSummarize(createdChunks[i])
            pooledChunk = [createdChunks[i] + createdChunks[i+1] for i in range(0, len(createdChunks), 2)] 
            finalList = pooledChunk

    for string in finalList:
        return getFeatures(string, isPredicting)
            
@app.route("/send_message", methods=["POST"])
def send_message():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        message = (data.get("message", "") or "").strip()
        reply = getResponse(message)
        if "|PREDICTING|" in reply:
            MSE = addFeatures(message, True)
            message = f"\nSYSTEM: MSE of the prediction was {MSE}"
            reply = getResponse(message)

        files = data.get("files", []) or []

        # Combine message and file texts for simple reply heuristics
        fileText = ""
        for f in files:
            fname = f.get("filename") or "(unknown)"
            ftext = f.get("text") or ""
            if(ftext != ""):
                addFeatures(ftext, False)

        print(f"combined file text is is: {fileText}")


        return jsonify({"ok": True, "reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

## Remove combine_texts and any PDF extraction logic, since all text is now extracted client-side

if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)
