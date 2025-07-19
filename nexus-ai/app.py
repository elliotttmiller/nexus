import os
import sys
import logging
from fastapi import FastAPI

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger = logging.getLogger("nexus-ai-debug")

logger.debug("Starting Nexus AI FastAPI app...")

# Railway/production: Write GOOGLE_CREDENTIALS_JSON to a file and set GOOGLE_APPLICATION_CREDENTIALS
if os.environ.get("GOOGLE_CREDENTIALS_JSON"):
    creds_path = "/tmp/google_creds.json"
    with open(creds_path, "w") as f:
        f.write(os.environ["GOOGLE_CREDENTIALS_JSON"])
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"status": "ok"} 