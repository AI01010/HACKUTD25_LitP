from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import urllib.parse

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
        # Support two upload styles:
        # 1) Multipart form upload (FormData) with field name 'file' -- common
        #    from browser clients. Use request.files['file'].
        # 2) Raw bytes POST with an 'x-filename' header (legacy behavior).

        if "file" in request.files:
            f = request.files["file"]
            if f.filename == "":
                return jsonify({"error": "empty filename"}), 400
            filename = secure_filename(f.filename)
            save_path = os.path.join(UPLOAD_FOLDER, filename)
            f.save(save_path)
            return jsonify({"ok": True, "message": f"File '{filename}' uploaded successfully!", "path": f"/uploads/{filename}"}), 200

        # Fallback: raw bytes with x-filename header
        encoded_filename = request.headers.get("x-filename")
        if not encoded_filename:
            return jsonify({"error": "Filename header missing and no form file provided"}), 400

        # Decode URL-encoded filename
        filename = urllib.parse.unquote(encoded_filename)
        filename = secure_filename(filename)
        # Define save path
        save_path = os.path.join(UPLOAD_FOLDER, filename)

        # Get raw binary data (since file is not sent as form-data)
        file_data = request.data
        if not file_data:
            return jsonify({"error": "No file data received"}), 400

        # Save the file
        with open(save_path, "wb") as f:
            f.write(file_data)

        return jsonify({"ok": True, "message": f"File '{filename}' uploaded successfully!", "path": f"/uploads/{filename}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)