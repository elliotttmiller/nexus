import os
from dotenv import load_dotenv
import tempfile

print("INFO: main.py - Loading environment from .env...")
load_dotenv()
print("INFO: main.py - .env loaded.")

if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON"):
    creds_path = os.path.join(tempfile.gettempdir(), "gcp_credentials.json")
    with open(creds_path, "w") as f:
        f.write(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path
    print(f"INFO: main.py - Wrote credentials to {creds_path}")

from app import app 