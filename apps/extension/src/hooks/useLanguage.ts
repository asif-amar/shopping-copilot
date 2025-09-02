import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";

export type Language = "he" | "en";

interface Translations {
  he: Record<string, string>;
  en: Record<string, string>;
}

const translations: Translations = {
  he: {
    // Header
    shopping_assistant: "עוזר קניות חכם",
    new_chat: "צ'אט חדש",
    supported: "נתמך",

    // Chat Input
    type_message: "איך אוכל לעזור לך היום?",
    send: "שלח",
    send_message: "שלח הודעה",

    // Messages
    typing: "...חושב",
    error_occurred: "מצטער, אני נתקל בבעיה. אנא נסה שוב מאוחר יותר.",

    // Common
    loading: "טוען...",

    // Empty State
    empty_welcome: "היי, אני כאן כדי לעזור לך למצוא את המוצרים שאתה צריך",
    empty_try_typing: 'נסה לכתוב: "תמצא לי חלב 3%" או "תראה לי פירות במבצע"',
    empty_no_conversation:
      "עדיין אין שיחה. התחל לכתוב כדי למצוא מוצרים במהירות",
    empty_tagline: "אני כאן כדי לעשות את הקניות שלך חכמות יותר וקלות יותר ✨",

    // Quick Actions
    quick_basic_items: "🥛 מצא מוצרי יסוד",
    quick_basic_items_desc: "חלב, לחם, ביצים",
    quick_vegetables_sale: "🥦 תראה לי ירקות במבצע",
    quick_recipe_suggestion: "🛒 הצע מתכון וקנה מרכיבים",

    // Auth Modal
    auth_modal_title: "היכנס לחשבון שלך",
    auth_modal_subtitle: "התחבר כדי לקבל חוויה אישית ושמורה",
    auth_feature_personalized: "המלצות מותאמות אישית",
    auth_feature_history: "היסטוריית קניות שמורה",
    auth_feature_secure: "אבטחה מתקדמת עם Google",
    auth_sign_in_google: "התחבר עם Google",
    auth_signing_in: "מתחבר...",
    auth_privacy_note: "אנחנו לא נשמור מידע אישי ללא רשותך",
  },
  en: {
    // Header
    shopping_assistant: "Shopping Assistant",
    new_chat: "New Chat",
    supported: "Supported",

    // Chat Input
    type_message: "How can I help you today?",
    send: "Send",
    send_message: "Send message",

    // Messages
    typing: "Thinking...",
    error_occurred:
      "Sorry, I encountered an error while processing your request. Please try again.",

    // Common
    loading: "Loading...",

    // Empty State
    empty_welcome: "Hi, I'm here to help you find the products you need",
    empty_try_typing:
      'Try typing: "Find me a 3% milk" or "Show me fruits on sale"',
    empty_no_conversation:
      "No conversation yet. Start typing to quickly find products",
    empty_tagline: "I'm here to make your shopping smarter and easier ✨",

    // Quick Actions
    quick_basic_items: "🥛 Find basic items",
    quick_basic_items_desc: "milk, bread, eggs",
    quick_vegetables_sale: "🥦 Show me vegetables on sale",
    quick_recipe_suggestion: "🛒 Suggest a recipe and buy ingredients",

    // Auth Modal
    auth_modal_title: "Sign In to Your Account",
    auth_modal_subtitle: "Sign in to get a personalized and saved experience",
    auth_feature_personalized: "Personalized recommendations",
    auth_feature_history: "Saved shopping history",
    auth_feature_secure: "Advanced security with Google",
    auth_sign_in_google: "Continue with Google",
    auth_signing_in: "Signing in...",
    auth_privacy_note:
      "We won't save personal information without your permission",
  },
};

interface UseLanguageReturn {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Create context
const LanguageContext = createContext<UseLanguageReturn | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Language Provider Component
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("he"); // Default to Hebrew for Israeli shopping sites

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "shopping_assistant_language"
    ) as Language;
    if (savedLanguage && (savedLanguage === "he" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("shopping_assistant_language", language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "he" ? "en" : "he"));
  }, []);

  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  const isRTL = language === "he";

  const value = {
    language,
    isRTL,
    toggleLanguage,
    setLanguage,
    t,
  };

  return React.createElement(LanguageContext.Provider, { value }, children);
}

// Hook to use language context
export function useLanguage(): UseLanguageReturn {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
