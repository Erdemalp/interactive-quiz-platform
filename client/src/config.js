// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
export const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'https://interactive-quiz-platform-puce.vercel.app';

export default {
  API_URL,
  SOCKET_URL,
  CLIENT_URL
};

