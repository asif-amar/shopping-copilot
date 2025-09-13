export const APP_NAME = "shopAI Chat";

// Dynamically set backend URL based on build mode
const isProduction = process.env.NODE_ENV === 'production';
export const BACKEND_URL = isProduction
  ? "https://shopping-copilot-server.onrender.com/api"
  : "http://127.0.0.1:8000/api";
export const MESSAGE_TYPES = {
  GET_CONVERSATION: "GET_CONVERSATION",
  SAVE_MESSAGE: "SAVE_MESSAGE",
  CLEAR_CONVERSATION: "CLEAR_CONVERSATION",
  GET_CURRENT_HOSTNAME: "GET_CURRENT_HOSTNAME",
  HOSTNAME_CHANGED: "HOSTNAME_CHANGED",
} as const;
