import os
import requests

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

def generate_text_with_gemini(prompt: str) -> str:
    url = "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-1.0-pro-002:streamGenerateContent"
    headers = {
        "Content-Type": "application/json; charset=utf-8"
    }
    data = {
        "contents": {
            "role": "user",
            "parts": {
                "text": prompt
            }
        }
    }
    params = {"key": GEMINI_API_KEY}
    response = requests.post(url, headers=headers, params=params, json=data)
    if response.ok:
        result = response.json()
        try:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            return str(result)
    else:
        return f"Error: {response.status_code} {response.text}"

def enrich_transaction_with_vertex_ai(merchant_name: str, location: str) -> dict:
    # Placeholder for enrichment logic
    return {"category": "shopping"} 