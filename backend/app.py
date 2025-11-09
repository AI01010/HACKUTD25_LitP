from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import urllib.parse
from PyPDF2 import PdfReader

# ==============================
# Flask app setup
# ==============================
app = Flask(__name__)

# Enable CORS for React frontend (localhost:3000)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Create uploads directory
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==============================
# Routes
# ==============================

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the HackUTD Backend!"})


@app.route("/upload", methods=["POST"])
def upload():
    try:
        # 1. Get and decode filename
        encoded_filename = request.headers.get("x-filename")
        if not encoded_filename:
            return jsonify({"error": "Filename header missing"}), 400
        filename = urllib.parse.unquote(encoded_filename)

        # 2. Get file bytes
        file_data = request.data
        if not file_data:
            return jsonify({"error": "No file data received"}), 400

        # 3. Save file locally (optional but useful)
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        with open(save_path, "wb") as f:
            f.write(file_data)

        # 4. Extract text from the saved PDF
        pdf_text = ""
        with open(save_path, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pdf_text += text + "\n"

        # 5. Return the extracted text as JSON
        return jsonify({
            "message": f"File '{filename}' uploaded and processed successfully!",
            "text": pdf_text.strip()
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)
