// src/config.js
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'https://nexus-production-2e34.up.railway.app';

export const AppConfig = {
  API_BASE_URL,
}; 