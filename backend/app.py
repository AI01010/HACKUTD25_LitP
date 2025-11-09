from flask import Flask, request, jsonify
from flask_cors import CORS
import os

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

        reply = "The multitude tightens its hold."

        return jsonify({"ok": True, "reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


## Remove combine_texts and any PDF extraction logic, since all text is now extracted client-side

if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)
