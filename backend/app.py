from flask import Flask, request, jsonify
from flask_cors import CORS
import os
try:
    import requests
except Exception:
    requests = None
import io
import csv
import urllib.request
import json
import ssl


def _post_json(url, headers, payload, timeout=30):
    """POST JSON and return parsed JSON. Uses requests if available, otherwise urllib."""
    if requests:
        r = requests.post(url, headers=headers, json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json()
    # fallback to urllib
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))

# ==============================
# Flask app setup
# ==============================
app = Flask(__name__)

# Enable CORS for React frontend (localhost:3000)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


# Create uploads directory
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def generate_csv_from_file_text(
    file_text,
    system_prompt=None,
    model="gpt-4o-mini",
    max_tokens=1024,
    context_size=2048,
    temperature=0.0,
):
    """
    Generate a CSV from raw `file_text` using OpenRouter + Deepseek.

    - `system_prompt`: optional system prompt to guide the LLM.
    - `openrouter_api_key`: bearer key for OpenRouter (falls back to env OPENROUTER_API_KEY).
    - `deepseek_api_key`: bearer key for Deepseek (falls back to env DEEPSEEK_API_KEY).
    - `model`, `max_tokens`, `context_size`, `temperature`: tunable parameters.

    This function will:
    1. If no OpenRouter key is provided, return a small heuristic CSV fallback.
    2. Otherwise call OpenRouter chat completions to request a CSV extraction.
    3. Optionally call Deepseek for validation/enrichment (placeholder: implement details later).

    Returns: CSV as a string. If the LLM returns non-CSV text the raw text is returned (caller may inspect/parse).
    """

    openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")
    deepseek_api_key = os.environ.get("DEEPSEEK_API_KEY")

    # Basic system prompt placeholder
    if system_prompt is None:
        system_prompt = (
            "You are a data extraction assistant. Extract structured rows from the provided document text "
            "and output a CSV. The CSV should be plain text, with a header row. Keep values short."
        )

    # Fallback if no OpenRouter key: build a lightweight CSV from paragraphs
    if not openrouter_api_key:
        sio = io.StringIO()
        writer = csv.writer(sio)
        writer.writerow(["row_id", "snippet", "length"])
        paragraphs = [p.strip() for p in file_text.split("\n\n") if p.strip()]
        for idx, p in enumerate(paragraphs[:50], start=1):
            writer.writerow([idx, p[:200].replace("\n", " "), len(p)])
        return sio.getvalue()

    # Otherwise, call OpenRouter Chat Completions API
    try:
        headers = {"Authorization": f"Bearer {openrouter_api_key}", "Content-Type": "application/json"}
        user_msg = (
            f"{system_prompt}\n\nExtract a CSV from the following text. Return only the CSV text (no surrounding markdown):\n\n" + file_text
        )
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        or_url = "https://api.openrouter.ai/v1/chat/completions"
        j = _post_json(or_url, headers, payload, timeout=30)

        # Extract text from common OpenRouter / OpenAI-like shapes
        text = ""
        if isinstance(j, dict) and "choices" in j and len(j["choices"]) > 0:
            ch = j["choices"][0]
            if isinstance(ch.get("message"), dict):
                text = ch["message"].get("content", "")
            else:
                text = ch.get("text", "") or ch.get("message", "") or ""
        elif isinstance(j, dict) and "result" in j:
            text = j.get("result", "")

        csv_text = (text or "").strip()

        # Optionally call Deepseek to validate/enrich CSV (placeholder)
        if deepseek_api_key and csv_text:
            try:
                ds_headers = {"Authorization": f"Bearer {deepseek_api_key}", "Content-Type": "application/json"}
                # NOTE: replace ds_url and payload with the actual Deepseek API usage you need.
                ds_url = "https://api.deepseek.ai/v1/validate"  # placeholder
                ds_payload = {"csv": csv_text}
                try:
                    _ = _post_json(ds_url, ds_headers, ds_payload, timeout=15)
                except Exception:
                    pass
            except Exception:
                # ignore deepseek errors for now
                pass

        # If OpenRouter returned empty or non-CSV content, fall back to a small heuristic CSV
        if not csv_text:
            sio = io.StringIO()
            writer = csv.writer(sio)
            writer.writerow(["row_id", "snippet", "length"])
            paragraphs = [p.strip() for p in file_text.split("\n\n") if p.strip()]
            for idx, p in enumerate(paragraphs[:50], start=1):
                writer.writerow([idx, p[:200].replace("\n", " "), len(p)])
            return sio.getvalue()

        return csv_text
    except Exception as e:
        # On any error, return a conservative fallback CSV including the error as a note field
        sio = io.StringIO()
        writer = csv.writer(sio)
        writer.writerow(["row_id", "snippet", "length", "error"])
        paragraphs = [p.strip() for p in file_text.split("\n\n") if p.strip()]
        for idx, p in enumerate(paragraphs[:10], start=1):
            writer.writerow([idx, p[:200].replace("\n", " "), len(p), str(e)])
        return sio.getvalue()


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

        # Simple server-side reply generation (demo). Use keywords to pick a response.
        reply = "Thanks — I looked over that. For this property I'd estimate values will trend up moderately. Check water and maintenance to improve value."
        low = message.lower()
        if any(k in low for k in ["rent", "income"]):
            reply = "If you're considering rental income, estimate monthly rent at 0.8%–1% of property value depending on location and condition. I can run scenarios if you provide local comps."
        elif any(k in low for k in ["crack", "foundation"]):
            reply = "Cracks can indicate settlement; prioritize structural inspection. Small hairline cracks are low urgency, but wide or stepping cracks need immediate attention."
        elif any(k in low for k in ["value", "price", "worth"]):
            reply = "Estimated market value looks stable; predicted appreciation ~3% yearly assuming no major repairs. Improvements to water/electrical systems can raise offers by 5-8%."

        # Generate a CSV from the combined file text. Caller can supply API keys
        # via environment variables (OPENROUTER_API_KEY, DEEPSEEK_API_KEY) or pass
        # them into this function in the future. Tunable params below.
        csv_output = generate_csv_from_file_text(
            fileText,
            system_prompt=None,  # <-- place to customize the system prompt
            model="gpt-4o-mini",
            max_tokens=10240,
            context_size=16384,
            temperature=0.1
        )

        return jsonify({"ok": True, "reply": reply, "csv": csv_output}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


## Remove combine_texts and any PDF extraction logic, since all text is now extracted client-side

if __name__ == "__main__":
    # Run the development server. Use the Flask CLI or a production WSGI
    # server (gunicorn/uvicorn) for production deployments.
    app.run(host="127.0.0.1", port=5000, debug=True)
