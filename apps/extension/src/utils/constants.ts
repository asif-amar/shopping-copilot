export const APP_NAME = "shopAI Chat";
// export const BACKEND_URL = "https://shopping-copilot-1.onrender.com/api";
export const BACKEND_URL = "http://127.0.0.1:8000/api";
export const MESSAGE_TYPES = {
  GET_CONVERSATION: "GET_CONVERSATION",
  SAVE_MESSAGE: "SAVE_MESSAGE",
  CLEAR_CONVERSATION: "CLEAR_CONVERSATION",
  GET_CURRENT_HOSTNAME: "GET_CURRENT_HOSTNAME",
  HOSTNAME_CHANGED: "HOSTNAME_CHANGED",
} as const;
