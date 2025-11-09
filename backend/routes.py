from flask import request, render_template, jsonify
import urllib.parse
import os

def register_routes(app):
    @app.route("/")
    def home():
        return jsonify({"message": "Welcome to the HackUTD Backend!"})
    

    @app.route("/upload", methods=["POST"])
    def upload():
        try:
            encoded_filename = request.headers.get("x-filename")
            if not encoded_filename:
                return jsonify({"error": "Filename header missing"}), 400
            

            UPLOAD_FOLDER = "uploads"

            # Decode the URL-encoded filename
            filename = urllib.parse.unquote(encoded_filename)

            # 2. Define the full save path
            save_path = os.path.join(UPLOAD_FOLDER, filename)

            # 3. Get the raw binary data from the request body
            # We use request.data because the file is NOT sent as form-data
            file_data = request.data

            if not file_data:
                return jsonify({"error": "No file data received"}), 400