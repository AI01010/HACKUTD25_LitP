from flask import Flask
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)
    CORS(app)

    CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

    UPLOAD_FOLDER = "uploads"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)


    from routes import register_routes
    register_routes(app)
    

    return app
