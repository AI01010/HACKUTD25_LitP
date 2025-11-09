from flask import Flask, request, jsonify
from flask_cors import CORS
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
        # Get the encoded filename from the request headers
        encoded_filename = request.headers.get("x-filename")
        if not encoded_filename:
            return jsonify({"error": "Filename header missing"}), 400

        # Decode URL-encoded filename
        filename = urllib.parse.unquote(encoded_filename)

        # Define save path
        save_path = os.path.join(UPLOAD_FOLDER, filename)

        # Get raw binary data (since file is not sent as form-data)
        file_data = request.data
        if not file_data:
            return jsonify({"error": "No file data received"}), 400

        # Save the file
        with open(save_path, "wb") as f:
            f.write(file_data)

        return jsonify({"message": f"File '{filename}' uploaded successfully!"}),
    except Exception as e:
        return jsonify({"error": str(e)}), 500