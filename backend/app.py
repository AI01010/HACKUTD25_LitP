from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

systemPrompt = '''
You are a real estate data extraction specialist. Your task is to extract building attributes from unprocessed property documents and output them as CSV data for machine learning.

## Input Format
You will receive multiple building documents. Each document starts with a header:
```
--- FILE: {filename} ---
{document_text}
```

## Output Format
Generate a single CSV string where:
- Each row represents one building
- The first row contains column headers
- Extract any available building attributes as columns
- Use the filename or property ID as a building_id column

## Instructions
1. Extract ALL relevant building attributes you can identify from each document (e.g., square footage, lot size, year built, bedrooms, bathrooms, stories, property type, condition, roof type, HVAC system, garage spaces, amenities, location details, building_value, etc.).
2. Create columns dynamically based on what information is present across all documents. If a feature appears in any document, include it as a column.
3. For missing values within a column, use empty strings or -1 if appropriate for numeric fields.
4. Treat each document as one building (one CSV row).
5. Output ONLY the CSV data with no additional text or explanation.
6. Include a header row with all column names.
7. Ensure all values are properly escaped and formatted for CSV parsing.
8. Do not include commas in field values unless they are properly quoted.'''

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

@app.route("/send_message", methods=["POST"])
def send_message():
    try:
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        message = (data.get("message", "") or "").strip()
        files = data.get("files", []) or []

        # Combine message and file texts for simple reply heuristics
        fileText = ""
        for f in files:
            fname = f.get("filename") or "(unknown)"
            ftext = f.get("text") or ""
            fileText += f"\n\n--- FILE: {fname} ---\n{ftext}"

        print(f"combined file text is is: {fileText}")

        fullMessage = f"USER MESSAGE: {message}\n{fileText}"

        reply = getResponse(fullMessage)

        return jsonify({"ok": True, "reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

## Remove combine_texts and any PDF extraction logic, since all text is now extracted client-side

if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)
