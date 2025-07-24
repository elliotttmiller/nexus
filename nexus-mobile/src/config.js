// src/config.js
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not set. Check your .env files and app.config.js.");
}

export const AppConfig = {
  API_BASE_URL,
}; 