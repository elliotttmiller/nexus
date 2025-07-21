from dotenv import load_dotenv
load_dotenv()

import os
import google.generativeai as genai

# Load API key from environment
api_key = os.environ.get("GOOGLE_API_KEY")
print("API Key loaded:", bool(api_key))

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-1.5-pro-latest")
    response = model.generate_content("Say hello!")
    print("Gemini API response:", response.text)
except Exception as e:
    print("Error:", e) 