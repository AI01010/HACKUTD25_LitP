from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from catboost import CatBoostRegressor
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel
import pandas as pd


systemPrompt1 = '''
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

systemPrompt2 = '''
You are a real estate data extraction assistant. Your task is to extract structured information from text about buildings/properties.

EXTRACTION RULES:
- Extract all required features: buildingStatus, price, numBedrooms, numBathrooms, acre_lot, city, state, zip_code, house_size
- Return features in the format: "feature: value, feature: value, ..."
- If information is not available for a feature, omit that feature from the output

SPECIFIC FIELD REQUIREMENTS:
- buildingStatus: Must be exactly "for_sale" or "sold" (no other values)
- price: The price of the building (numeric value, may include currency symbol or commas)
- numBedrooms: Number of bedrooms (numeric)
- numBathrooms: Number of bathrooms (numeric)
- acre_lot: Total land size / lot size in acres (numeric)
- city: City name
- state: State name or abbreviation
- zip_code: ZIP code
- house_size: House size / living space in square feet (numeric value)

OUTPUT FORMAT:
- For a single property: "buildingStatus: value, price: value, numBedrooms: value, ..."
- For multiple properties: Separate each property with a newline, each on its own line with the same format

EXAMPLE OUTPUT (single property):
buildingStatus: for_sale, price: 450000, numBedrooms: 3, numBathrooms: 2, acre_lot: 0.25, city: Austin, state: TX, zip_code: 78701, house_size: 2500

EXAMPLE OUTPUT (multiple properties):
buildingStatus: for_sale, price: 450000, numBedrooms: 3, numBathrooms: 2, acre_lot: 0.25, city: Austin, state: TX, zip_code: 78701, house_size: 2500
buildingStatus: sold, price: 350000, numBedrooms: 2, numBathrooms: 1.5, acre_lot: 0.15, city: Dallas, state: TX, zip_code: 75201, house_size: 180.

Make sure don't use columns for numbers
'''


loaded_model = CatBoostRegressor()
loaded_model.load_model("backend/models/catboost_price_model.cbm")

# ==============================
# Flask app setup
# ==============================
app = Flask(__name__)

# Enable CORS for React frontend (localhost:3000)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


# Create uploads directory
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Training / model config
TRAIN_MIN_ROWS = 2  # minimum number of parsed rows to trigger a training run
MODEL_PATH = "backend/models/catboost_price_model.cbm"

# ==============================
# Routes
# ==============================

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the HackUTD Backend!"})

apiKey = os.getenv("OPENROUTER_KEY")

# print(f"Api key is this: {apiKey}")

url = "https://openrouter.ai/api/v1/chat/completions"

modelData1 = {
  "model": "openai/gpt-oss-20b:free",    # or whichever free model
  "temperature": 0.3,        # Lower = more deterministic, higher = more creative
  "max_tokens": 16000,        # Limit size of model’s response
  "messages": [
    {"role": "system", "content": systemPrompt1},
  ]
}

modelData2 = {
  "model": "openai/gpt-oss-20b:free",    # or whichever free model
  "temperature": 0.3,        # Lower = more deterministic, higher = more creative
  "max_tokens": 16000,        # Limit size of model’s response
  "messages": [
    {"role": "system", "content": systemPrompt2},
  ]
}

headers = {
  "Authorization": f"Bearer {apiKey}",
  "Content-Type": "application/json"
}

def getResponse1(message):
    global modelData1
    try:
        modelData1["messages"].append({"role": "user", "content": message})
        resp = requests.post(url, json=modelData1, headers=headers)
        resp.raise_for_status()  # raises an HTTPError if status >= 400
        response = resp.json()
        botMessage = response["choices"][0]["message"]["content"]
    except requests.HTTPError as e:
        print("HTTP error:", e, resp.text)
        botMessage = "Upstream error."
        return botMessage
    except Exception as e:
        print("Unexpected error:", e)
        botMessage = "Server error."
        return botMessage
    
    modelData1["messages"].append({"role": "assistant", "content": botMessage})
    # Keep last 10 messages
    if len(modelData1["messages"]) > 11:
        modelData1["messages"] = [modelData1["messages"][0]] + modelData1["messages"][-10:]
    return botMessage

def getResponse2(message):
    global modelData2
    try:
        modelData2["messages"].append({"role": "user", "content": message})
        resp = requests.post(url, json=modelData2, headers=headers)
        resp.raise_for_status()  # raises an HTTPError if status >= 400
        response = resp.json()
        botMessage = response["choices"][0]["message"]["content"]
    except requests.HTTPError as e:
        print("HTTP error:", e, resp.text)
        botMessage = "Upstream error."
        return botMessage
    except Exception as e:
        print("Unexpected error:", e)
        botMessage = "Server error."
        return botMessage
    
    modelData2["messages"].append({"role": "assistant", "content": botMessage})
    # Keep last 10 messages
    if len(modelData2["messages"]) > 11:
        modelData2["messages"] = [modelData2["messages"][0]] + modelData2["messages"][-10:]
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
model = PeftModel.from_pretrained(base_model, "backend/models/flan-t5-lora-finetuned")
# Load the tokenizer
tokenizer = AutoTokenizer.from_pretrained("backend/models/flan-t5-lora-finetuned")

def useWithModel(evaluatingString, isPredicting):
    global loaded_model
    print(f"String is {evaluatingString}")
    try:
        rows = evaluatingString.strip().split("\n")
        
        if not rows or not rows[0].strip():
            print("Empty input for parsing")
            return "FAILURE"

        data_list = []
        for line in rows:
            if not line.strip():
                continue
            row_dict = {}
            try:
                for pair in line.split(","):
                    if ":" not in pair:
                        continue
                    key, value = pair.split(":", 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == "buildingStatus":
                        key = "status"

                    if key == "numBedrooms":
                        key = "bed"

                    if key == "numBathrooms":
                        key = "bath"
                    
                    row_dict[key] = value
            except ValueError:
                print(f"Skipping malformed line: {line}")
                continue
            
            if row_dict:
                data_list.append(row_dict)

        if not data_list:
            print("No valid rows parsed")
            return "FAILURE"

        df = pd.DataFrame(data_list)

        # Convert numeric columns
        numeric_cols = ['price', 'numBedrooms', 'numBathrooms', 'acre_lot', 'house_size']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Keep categorical columns as strings
        categorical_cols = ['status', 'city', 'state']
        for col in categorical_cols:
            if col in df.columns:
                df[col] = df[col].astype(str)

        if 'price' not in df.columns and not isPredicting:
            print("Price column missing from extracted data")
            return "FAILURE"

        X = df
        if not isPredicting:
            X = df.drop(columns=['price'])

        # Get indices of categorical columns for CatBoost
        existing_cat_cols = [col for col in categorical_cols if col in X.columns]
        cat_indices = [X.columns.get_loc(col) for col in existing_cat_cols]

        if not isPredicting:
            y = df["price"]
            # Training mode: MUST pass cat_features
            model2 = CatBoostRegressor(
                iterations=50,
                learning_rate=0.1,
                nan_mode='Min',
                verbose=0
            )
            model2.fit(X, y, cat_features=cat_indices, init_model=loaded_model)
            loaded_model = model2
            return None
        else:
            # Prediction mode: MUST pass cat_features
            pred = loaded_model.predict(X)
            return pred

    except Exception as e:
        print(f"Error trying to parse; result was {evaluatingString}, exception was {e}")
        import traceback
        traceback.print_exc()
        return "FAILURE"
    
def getFeatures(string, isPredicting):
    summary = getResponse2(string)
    
    return useWithModel(summary, isPredicting)


def addFeatures(textFile, isPredicting):
    finalList = [textFile]
    numTokens = len(textFile) / 4
    if(numTokens > 900):
        numChunks = int(len(textFile) / (4 * 900))
        createdChunks = split_string_n_ways(textFile, numChunks)
        if(len(createdChunks[-1]) < (4 * 900) / 5):
            createdChunks[-2] += createdChunks[-1]
            createdChunks.pop()
        for i in range(0, len(createdChunks), 1):
            createdChunks[i] = chunkSummarize(createdChunks[i])
        pooledChunk = [createdChunks[i] + createdChunks[i+1] for i in range(0, len(createdChunks)-1, 2)]

        finalList = pooledChunk

        # if it was greater than another split, we must split it again
        if(numTokens > 1800):
            for i in range(0, len(createdChunks), 1):
                createdChunks[i] = chunkSummarize(createdChunks[i])
            pooledChunk = [createdChunks[i] + createdChunks[i+1] for i in range(0, len(createdChunks)-1, 2)]
            finalList = pooledChunk

    predictedArr = []
    results = []
    numPoints = 0
    for i, string in enumerate(finalList):
        results.append(getFeatures(string, isPredicting))
        if results[i] is not None and results[i] != "FAILURE":
            predictedArr.append(results[i])
    return predictedArr            
@app.route("/send_message", methods=["POST"])
def send_message():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        message = (data.get("message", "") or "").strip()
        reply = getResponse1(message)
        if "|PREDICTING|" in reply:
            # print("We...predicting???")
            predictions = addFeatures(message, True)
            message = f"\nSYSTEM: The predictions for what was passed in was {[float(p) if hasattr(p, '__len__') else p for pred_array in predictions for p in (pred_array if hasattr(pred_array, '__iter__') else [pred_array])]}"
            reply = getResponse1(message)

        files = data.get("files", []) or []

        # Combine message and file texts for simple reply heuristics.
        # Instead of training per-file, collect LLM-extracted feature rows for
        # all files and call `useWithModel(..., isPredicting=False)` once so the
        # CatBoost training run uses the full batch.
        training_rows = []
        for f in files:
            fname = f.get("filename") or "(unknown)"
            ftext = (f.get("text") or "").strip()
            if not ftext:
                continue
            try:
                # Ask the extraction LLM to output the feature: value line(s)
                summary = getResponse2(ftext)
                if not summary:
                    continue
                # The LLM may return multiple lines (one property per line).
                for line in summary.split("\n"):
                    ln = line.strip()
                    if not ln:
                        continue
                    # Only keep lines that look like key:value pairs
                    if ":" in ln:
                        training_rows.append(ln)
            except Exception as e:
                print(f"Failed to extract features for file {fname}: {e}")

        # If we have enough rows, run a single training call that continues the
        # existing model (warm-start) by using init_model inside useWithModel.
        if len(training_rows) >= TRAIN_MIN_ROWS:
            train_input = "\n".join(training_rows)
            print(f"Training on {len(training_rows)} new rows")
            train_res = useWithModel(train_input, False)
            if train_res == "FAILURE":
                print("Training failed for the provided rows")
            else:
                # Persist updated model to disk so future predictions use it
                try:
                    loaded_model.save_model(MODEL_PATH)
                    print(f"Saved updated model to {MODEL_PATH}")
                except Exception as e:
                    print(f"Failed to save updated model: {e}")
        else:
            print(f"Collected {len(training_rows)} training rows - need at least {TRAIN_MIN_ROWS} to run training. Skipping training.")


        return jsonify({"ok": True, "reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

## Remove combine_texts and any PDF extraction logic, since all text is now extracted client-side

if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)
