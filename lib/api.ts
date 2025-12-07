// API Configuration for split deployment
// When deployed on Netlify (frontend) + Render (backend), set VITE_API_URL to your Render URL

// Get API base URL from environment variable or use relative path (for same-origin deployment)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// API endpoints
export const API_ENDPOINTS = {
  chat: `${API_BASE_URL}/api/chat`,
  image: `${API_BASE_URL}/api/image`,
  health: `${API_BASE_URL}/api/health`,
};

// WebSocket URL for Gemini Live
export const getWebSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    // Convert https:// to wss:// for WebSocket
    return import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  }
  // Same-origin WebSocket
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};
