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
    not_supported: "לא נתמך",
    sign_in: "התחבר",
    sign_out: "התנתק",
    switch_to: "עבור ל",
    language: "שפה",

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
    quick_vegetables_salad: "הוסף לסל קילו בננה טרייה",
    quick_recipe_suggestion: "🛒 הצע מתכון לפנקייק וקנה מרכיבים",

    // Preferences
    preferences: "העדפות",
    ai_style: "סגנון AI",
    ai_behavior_style: "סגנון התנהגות AI",
    flexible: "גמיש",
    balanced: "מאוזן",
    strict: "קפדן",
    flexible_desc:
      "AI יבחר עבורך באופן חכם (למשל: 'הוסף חלב' → מוסיף חלב פופולרי)",
    balanced_desc: "AI ישאל כשיהיה לא בטוח בהעדפות שלך",
    strict_desc: "AI תמיד ישאל הבהרות לפני פעולה",

    // Conversations
    conversations: "שיחות",
    no_conversations: "אין שיחות עדיין",
    start_chatting_desc: "התחל לשוחח כדי לראות את היסטוריית השיחות שלך כאן",
    just_now: "עכשיו",
    retry: "נסה שוב",
    refresh: "רענן",

    // Auth Modal
    auth_modal_title: "היכנס לחשבון שלך",
    auth_modal_subtitle: "התחבר כדי לקבל חוויה אישית ושמורה",
    auth_feature_personalized: "המלצות מותאמות אישית",
    auth_feature_history: "היסטוריית קניות שמורה",
    auth_feature_secure: "אבטחה מתקדמת עם Google",
    auth_sign_in_google: "התחבר עם Google",
    auth_signing_in: "מתחבר...",
    auth_privacy_note: "אנחנו לא נשמור מידע אישי ללא רשותך",
    auth_agree_terms: "על ידי התחברות, אתה מסכים ל",
    auth_terms_of_use: "תנאי השימוש",
    auth_privacy_policy: "מדיניות הפרטיות",
    auth_and: "ו",
    auth_beta_notice:
      "זהו מוצר ניסיוני/בטא. השירות עלול להיות לא זמין או לא מושלם.",

    // Feedback
    feedback: "משוב",
    feedback_title: "שתף אותנו במחשבותיך",
    feedback_subtitle: "המשוב שלך עוזר לנו לשפר את החוויה",
    feedback_type: "סוג המשוב",
    feedback_type_bug: "דיווח על באג",
    feedback_type_feature: "בקשת תכונה",
    feedback_type_general: "משוב כללי",
    feedback_type_improvement: "הצעה לשיפור",
    feedback_subject: "נושא",
    feedback_subject_placeholder: "תאר בקצרה את המשוב שלך...",
    feedback_message: "הודעה",
    feedback_message_placeholder: "ספר לנו יותר פרטים...",
    feedback_submit: "שלח משוב",
    feedback_submitting: "שולח...",
    feedback_success: "תודה על המשוב!",
    feedback_success_message: "המשוב שלך נקלט בהצלחה ויעזור לנו לשפר את המוצר",
    feedback_error: "שגיאה בשליחת המשוב",
    feedback_cancel: "ביטול",

    // Validation messages
    validation_subject_min: "הנושא חייב להכיל לפחות 3 תווים",
    validation_subject_max: "הנושא לא יכול להכיל יותר מ-255 תווים",
    validation_message_min: "ההודעה חייבת להכיל לפחות 5 תווים",
    validation_message_max: "ההודעה לא יכולה להכיל יותר מ-2000 תווים",

    // Credit system
    credits: "קרדיטים",
    credits_remaining: "קרדיטים נותרים",
    credits_monthly: "קרדיטים חודשיים",
    credits_usage: "שימוש בקרדיטים",
    credits_history: "היסטוריית קרדיטים",
    credits_reset_date: "תאריך איפוס",
    credits_low_warning: "קרדיטים נמוכים",
    credits_exhausted: "הקרדיטים אזלו",
    credits_low_message: "נותרו לך {count} קרדיטים",
    credits_exhausted_message:
      "הקרדיטים שלך אזלו. תוכל להמשיך לשלוח הודעות בחודש הבא.",
    credits_refresh_next_month: "הקרדיטים יתחדשו ב-{date}",
    credit_transaction_conversation: "שיחה",
    credit_transaction_refund: "החזרה",
    credit_transaction_monthly_reset: "איפוס חודשי",
    credit_transaction_account_creation: "פתיחת חשבון",

    // Changelog
    changelog: "יומן שינויים",
    whats_new: "מה חדש",
    version_history: "היסטוריית גרסאות",
    new_version_available: "גרסה חדשה זמינה!",
    view_changelog: "צפה ביומן השינויים",
  },
  en: {
    // Header
    shopping_assistant: "Shopping Assistant",
    new_chat: "New Chat",
    supported: "Supported",
    not_supported: "Not Supported",
    sign_in: "Sign In",
    sign_out: "Sign Out",
    switch_to: "Switch to",
    language: "Language",

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
    quick_vegetables_salad: "Find me vegetables to make a salad",
    quick_recipe_suggestion: "🛒 Suggest a recipe and buy ingredients",

    // Preferences
    preferences: "Preferences",
    ai_style: "AI Style",
    ai_behavior_style: "AI Behavior Style",
    flexible: "Flexible",
    balanced: "Balanced",
    strict: "Strict",
    flexible_desc:
      "AI will make smart choices for you (e.g., 'add milk' → adds popular milk)",
    balanced_desc: "AI will ask when unsure about your preferences",
    strict_desc: "AI will always ask for clarification before taking action",

    // Conversations
    conversations: "Conversations",
    no_conversations: "No conversations yet",
    start_chatting_desc: "Start chatting to see your conversation history here",
    just_now: "Just now",
    retry: "Retry",
    refresh: "Refresh",

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
    auth_agree_terms: "By signing in, you agree to our",
    auth_terms_of_use: "Terms of Use",
    auth_privacy_policy: "Privacy Policy",
    auth_and: "and",
    auth_beta_notice:
      "This is an experimental/beta product. Service may be unavailable or imperfect.",

    // Feedback
    feedback: "Feedback",
    feedback_title: "Share Your Thoughts",
    feedback_subtitle: "Your feedback helps us improve the experience",
    feedback_type: "Feedback Type",
    feedback_type_bug: "Bug Report",
    feedback_type_feature: "Feature Request",
    feedback_type_general: "General Feedback",
    feedback_type_improvement: "Improvement Suggestion",
    feedback_subject: "Subject",
    feedback_subject_placeholder: "What’s your feedback about?",
    feedback_message: "Message",
    feedback_message_placeholder: "Tell us more details...",
    feedback_submit: "Submit Feedback",
    feedback_submitting: "Submitting...",
    feedback_success: "Thank you for your feedback!",
    feedback_success_message:
      "Your feedback has been received and will help us improve the product",
    feedback_error: "Error submitting feedback",
    feedback_cancel: "Cancel",

    // Validation messages
    validation_subject_min: "Subject must be at least 3 characters long",
    validation_subject_max: "Subject cannot exceed 255 characters",
    validation_message_min: "Message must be at least 5 characters long",
    validation_message_max: "Message cannot exceed 2000 characters",

    // Credit system
    credits: "Credits",
    credits_remaining: "Credits Remaining",
    credits_monthly: "Monthly Credits",
    credits_usage: "Credit Usage",
    credits_history: "Credit History",
    credits_reset_date: "Reset Date",
    credits_low_warning: "Low Credits",
    credits_exhausted: "Credits Exhausted",
    credits_low_message: "You have {count} credits remaining",
    credits_exhausted_message:
      "You've used up your credits. You can continue sending messages next month.",
    credits_refresh_next_month: "Credits will refresh on {date}",
    credit_transaction_conversation: "Conversation",
    credit_transaction_refund: "Refund",
    credit_transaction_monthly_reset: "Monthly Reset",
    credit_transaction_account_creation: "Account Creation",

    // Changelog
    changelog: "Changelog",
    whats_new: "What's New",
    version_history: "Version History",
    new_version_available: "New Version Available!",
    view_changelog: "View Changelog",
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
