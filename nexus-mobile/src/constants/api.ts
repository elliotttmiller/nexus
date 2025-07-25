const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("CRITICAL ERROR: EXPO_PUBLIC_API_BASE_URL is not set. Check your .env file and eas.json.");
}

export { API_BASE_URL }; 