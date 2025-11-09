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
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


# Create uploads directory
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==============================
# Routes
# ==============================


uploaded_texts = []

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the HackUTD Backend!"})


@app.route("/upload", methods=["POST"])
def upload():
    try:
        # 1. Get the uploaded file from FormData
        if "file" not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
        
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # 2. Save file
        save_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(save_path)

        # 3. Extract text
        pdf_text = ""
        with open(save_path, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pdf_text += text + "\n"

        # 4. Return extracted text
        return jsonify({
            "message": f"File '{file.filename}' uploaded and processed successfully!",
            "text": pdf_text.strip()
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@app.route("/combine_texts", methods=["GET"])
def combine_texts():
    if not uploaded_texts:
        return jsonify({"error": "No uploaded files found."}), 400

    # Combine all texts with a delimiter
    delimiter = "\n\n--- END OF FILE ---\n\n"
    combined = delimiter.join(
        [f"### {entry['filename']} ###\n{entry['text']}" for entry in uploaded_texts]
    )

    return jsonify({
        "message": "Combined all uploaded PDF texts.",
        "combined_text": combined
    }), 200

if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)
