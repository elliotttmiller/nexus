const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn("EXPO_PUBLIC_API_BASE_URL is not set. Some features may not work properly. Check your .env file for local dev and eas.json for production builds.");
}

export { API_BASE_URL }; 