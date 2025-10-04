// API Configuration
const sanitizeUrl = (value, fallback, placeholders = []) => {
  const cleaned = value?.trim();
  if (!cleaned) {
    return fallback;
  }
  const normalized = cleaned.replace(/\/+$/, '');
  if (placeholders.includes(cleaned) || placeholders.includes(normalized)) {
    return fallback;
  }
  return normalized;
};

export const API_URL = sanitizeUrl(
  import.meta.env.VITE_API_URL,
  'http://localhost:3001',
  ['https://your-backend.onrender.com']
);

export const SOCKET_URL = sanitizeUrl(
  import.meta.env.VITE_SOCKET_URL,
  'http://localhost:3001',
  ['https://your-backend.onrender.com']
);

export const CLIENT_URL = sanitizeUrl(
  import.meta.env.VITE_CLIENT_URL,
  'https://interactive-quiz-platform-puce.vercel.app',
  [
    'https://your-frontend.vercel.app',
    'https://your-new-vercel-url.vercel.app'
  ]
);

export default {
  API_URL,
  SOCKET_URL,
  CLIENT_URL
};
