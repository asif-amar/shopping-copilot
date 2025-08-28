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
