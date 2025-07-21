import { getToken, saveToken, removeToken, getRefreshToken, saveRefreshToken, removeRefreshToken } from './token';
import { API_BASE_URL } from './api';

export const refreshToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    if (data.token && data.refreshToken) {
      await saveToken(data.token);
      await saveRefreshToken(data.refreshToken);
      return data.token;
    }
    return null;
  } catch (e) {
    await removeToken();
    await removeRefreshToken();
    return null;
  }
};

export const fetchWithAuth = async (url, options = {}) => {
  let token = await getToken();
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    // Try to refresh token
    token = await refreshToken();
    if (token) {
      const retryHeaders = {
        ...headers,
        'Authorization': `Bearer ${token}`,
      };
      res = await fetch(url, { ...options, headers: retryHeaders });
    } else {
      // Log out user or redirect to login if needed
      return res;
    }
  }
  return res;
}; 