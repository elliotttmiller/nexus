import logging
import re

class RedactingFormatter(logging.Formatter):
    SENSITIVE_FIELDS = [r'password', r'token', r'apiKey', r'apikey', r'secret', r'refreshToken', r'email']
    def format(self, record):
        msg = super().format(record)
        for field in self.SENSITIVE_FIELDS:
            msg = re.sub(rf'("?{field}"?\s*:\s*")([^"]*)"', r'\1[REDACTED]"', msg, flags=re.IGNORECASE)
            msg = re.sub(r'(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*', r'\1[REDACTED]', msg)
        return msg

logger = logging.getLogger("nexus_ai")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = RedactingFormatter('%(asctime)s [%(levelname)s]: %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler) 