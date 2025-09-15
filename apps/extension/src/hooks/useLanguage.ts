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

    // Onboarding
    onboarding_title: "הגדרת עוזר הקניות",
    onboarding_welcome: "ברוכים הבאים לעוזר הקניות!",
    onboarding_welcome_desc: "העוזר החכם שלכם לקניות באתרי המכולת הישראליים",
    onboarding_smart_search: "חיפוש חכם",
    onboarding_smart_search_desc: "מוצא מוצרים במהירות ברמי לוי ושופרסל",
    onboarding_cart_management: "ניהול עגלה",
    onboarding_cart_management_desc: "הוסף, הסר וטפל בעגלת הקניות שלך",
    onboarding_price_comparison: "השוואת מחירים",
    onboarding_price_comparison_desc: "השווה מחירים ומצא את הטובים ביותר",
    onboarding_personalize_desc:
      "בוא נתאים את חווית הקניות שלך בכמה שלבים פשוטים",
    onboarding_profile: "פרופיל אישי",
    onboarding_profile_desc: "עזור לנו להבין את הצרכים שלך",
    onboarding_preferences: "העדפות קניות",
    onboarding_preferences_desc: "התאם את החוויה שלך",
    onboarding_features: "תכונות מרכזיות",
    onboarding_features_desc: "למד איך להפיק את המקסימום מהעוזר",
    onboarding_privacy: "פרטיות ואבטחה",
    onboarding_privacy_desc: "הפרטיות והאבטחה שלכם הם בעדיפות עליונה",
    onboarding_household_size: "גודל משק בית",
    onboarding_household_1_2: "1-2 אנשים",
    onboarding_household_3_4: "3-4 אנשים",
    onboarding_household_5_plus: "5+ אנשים",
    onboarding_dietary_prefs: "העדפות תזונה (אופציונלי)",
    onboarding_kosher: "כשר",
    onboarding_vegan: "טבעוני",
    onboarding_vegetarian: "צמחוני",
    onboarding_gluten_free: "ללא גלוטן",
    onboarding_dairy_free: "ללא לקטוז",
    onboarding_organic: "העדפה אורגנית",
    onboarding_budget_pref: "העדפת תקציב",
    onboarding_budget_conscious: "חסכני",
    onboarding_budget_conscious_desc: "התמקד בהנחות ומבצעים",
    onboarding_moderate: "בינוני",
    onboarding_moderate_desc: "איזון בין מחיר לאיכות",
    onboarding_premium: "פרימיום",
    onboarding_premium_desc: "איכות על פני מחיר",
    onboarding_shopping_frequency: "תדירות קניות",
    onboarding_daily: "יומי",
    onboarding_weekly: "שבועי",
    onboarding_monthly: "חודשי",
    onboarding_language_pref: "העדפת שפה",
    onboarding_hebrew: "עברית",
    onboarding_english: "English",
    onboarding_preferred_sites: "אתרים מועדפים",
    onboarding_rami_levy: "רמי לוי",
    onboarding_shufersal: "שופרסל",
    onboarding_favorite_categories: "קטגוריות מועדפות (אופציונלי)",
    onboarding_fresh_produce: "🥬 ירקות ופירות טריים",
    onboarding_meat_fish: "🥩 בשר ודגים",
    onboarding_dairy: "🧀 מוצרי חלב",
    onboarding_bakery: "🍞 מאפייה",
    onboarding_pantry: "🥫 מוצרי מזווה",
    onboarding_frozen: "🧊 מזון קפוא",
    onboarding_snacks: "🍿 חטיפים",
    onboarding_beverages: "🥤 משקאות",
    onboarding_household_items: "🧽 מוצרי בית",
    onboarding_baby_products: "👶 מוצרי תינוקות",
    onboarding_brand_prefs: "העדפות מותג (אופציונלי)",
    onboarding_store_brands: "מותגי הרשת",
    onboarding_national_brands: "מותגים לאומיים",
    onboarding_premium_brands: "מותגי פרימיום",
    onboarding_auto_credentials: "לכידת אישורים אוטומטית",
    onboarding_auto_credentials_desc:
      "אנו לוכדים אוטומטית את פרטי הכניסה כשאתם גולשים ברמי לוי או בשופרסל. אם הדף מתרענן, זה רק כדי ללכוד את הסשן שלכם לסיוע חלק בקניות.",
    onboarding_smart_commands: "פקודות צ'אט חכמות",
    onboarding_smart_commands_desc:
      'נסו פקודות כמו: "מצא עגבניות אורגניות", "הוסף חלב לעגלה", "השווה מחירי לחם", או "הראה לי את העגלה". הבינה המלאכותית מבינה שפה טבעית!',
    onboarding_credit_system: "מערכת קרדיטים",
    onboarding_credit_system_desc:
      "אתם מקבלים 50 קרדיטים בחינם מדי חודש. כל שיחה משתמשת בקרדיט אחד. עקבו אחר השימוש שלכם בכותרת וקבלו התראות כשהקרדיטים נגמרים.",
    onboarding_multi_site: "תמיכה מרובת אתרים",
    onboarding_multi_site_desc:
      "פועל בצורה חלקה ברמי לוי ובשופרסל. העוזר מזהה אוטומטית באיזה אתר אתם נמצאים ומתאים בהתאם.",
    onboarding_pro_tip: "טיפ מקצועי",
    onboarding_pro_tip_desc:
      "לתוצאות הטובות ביותר, וודאו שאתם מחוברים לאתר הקניות לפני השימוש בעוזר. זה מאפשר ניהול עגלה מלא והמלצות מותאמות אישית.",
    onboarding_secure_data: "טיפול מאובטח בנתונים",
    onboarding_secure_data_desc:
      "פרטי הכניסה שלכם מוצפנים ומאוחסנים בצורה מאובטחת. אנו ניגשים אליהם רק כדי לבצע פעולות שאתם מבקשים דרך העוזר.",
    onboarding_data_collection: "איסוף נתונים",
    onboarding_data_collection_item1: "• העדפות קנייה (להתאמה אישית של המלצות)",
    onboarding_data_collection_item2: "• פרטי כניסה לאתר (לניהול עגלה והזמנות)",
    onboarding_data_collection_item3: "• היסטוריית שיחות (לשיפור השירות)",
    onboarding_data_collection_item4:
      "• אנליטיקת שימוש (אנונימית, לשיפור האפליקציה)",
    onboarding_user_rights: "הזכויות שלכם",
    onboarding_user_rights_item1: "• עדכן העדפות בכל עת בהגדרות",
    onboarding_user_rights_item2: "• מחק את החשבון וכל הנתונים",
    onboarding_user_rights_item3: "• יצא את היסטוריית השיחות",
    onboarding_user_rights_item4: "• פנה לתמיכה עם חששות פרטיות",
    onboarding_agreement:
      "על ידי השלמת ההגדרה, אתם מסכימים ל{terms} ול{privacy} שלנו. תוכלו לשנות את ההעדפות האלה בכל עת בהגדרות.",
    onboarding_terms: "תנאי השירות",
    onboarding_privacy_policy: "מדיניות פרטיות",
    onboarding_skip: "דלג על ההגדרה",
    onboarding_previous: "הקודם",
    onboarding_next: "הבא",
    onboarding_complete: "השלם הגדרה",
    onboarding_completing: "משלים...",
    onboarding_step_of: "שלב {current} מתוך {total}",

    // Step 3 - Additional translations
    onboarding_language_preference: "העדפת שפה",
    onboarding_preferred_shopping_sites: "אתרים מועדפים לקניות",
    onboarding_other: "אחר",
    onboarding_other_placeholder: "הזן שם אתר אחר...",
    onboarding_favorite_categories_optional: "קטגוריות מועדפות (אופציונלי)",
    onboarding_brand_preferences_optional: "העדפות מותג (אופציונלי)",

    // Step 4 - Features translations
    onboarding_auto_credential_capture: "לכידת אישורים אוטומטית",
    onboarding_auto_credential_capture_desc:
      "אנו לוכדים אוטומטית את פרטי הכניסה שלכם כאשר אתם גולשים ברמי לוי או בשופרסל. אם הדף מתרענן, זה רק כדי ללכוד את הסשן שלכם לסיוע חלק בקניות.",
    onboarding_smart_chat_commands: "פקודות צ'אט חכמות",
    onboarding_smart_chat_commands_desc:
      'נסו פקודות כמו: "מצא עגבניות אורגניות", "הוסף חלב לעגלה", "השווה מחירי לחם", או "הראה לי את העגלה". הבינה המלאכותית מבינה שפה טבעית!',
    onboarding_credit_system_title: "מערכת קרדיטים",
    onboarding_credit_system_desc_detailed:
      "אתם מקבלים 50 קרדיטים בחינם מדי חודש. כל שיחה משתמשת בקרדיט אחד. עקבו אחר השימוש שלכם בכותרת וקבלו התראות כשהקרדיטים נגמרים.",
    onboarding_multi_site_support: "תמיכה מרובת אתרים",
    onboarding_multi_site_support_desc:
      "פועל בצורה חלקה ברמי לוי ובשופרסל. העוזר מזהה אוטומטית באיזה אתר אתם נמצאים ומתאים בהתאם.",
    onboarding_pro_tip_title: "טיפ מקצועי",
    onboarding_pro_tip_content:
      "לתוצאות הטובות ביותר, וודאו שאתם מחוברים לאתר הקניות לפני השימוש בעוזר. זה מאפשר ניהול עגלה מלא והמלצות מותאמות אישית.",

    // Step 5 - Privacy translations
    onboarding_secure_data_handling: "טיפול מאובטח בנתונים",
    onboarding_secure_data_handling_desc:
      "פרטי הכניסה שלכם מוצפנים ומאוחסנים בצורה מאובטחת. אנו ניגשים אליהם רק כדי לבצע פעולות שאתם מבקשים דרך העוזר.",
    onboarding_data_collection_title: "איסוף נתונים",
    onboarding_data_collection_item_1:
      "• העדפות קנייה (להתאמה אישית של המלצות)",
    onboarding_data_collection_item_2:
      "• פרטי כניסה לאתר (לניהול עגלה והזמנות)",
    onboarding_data_collection_item_3: "• היסטוריית שיחות (לשיפור השירות)",
    onboarding_data_collection_item_4:
      "• אנליטיקת שימוש (אנונימית, לשיפור האפליקציה)",
    onboarding_your_rights: "הזכויות שלכם",
    onboarding_your_rights_item_1: "• עדכן העדפות בכל עת בהגדרות",
    onboarding_your_rights_item_2: "• מחק את החשבון וכל הנתונים",
    onboarding_your_rights_item_3: "• יצא את היסטוריית השיחות",
    onboarding_your_rights_item_4: "• פנה לתמיכה עם חששות פרטיות",
    onboarding_agreement_text: "על ידי השלמת ההגדרה, אתם מסכימים ל",
    onboarding_terms_of_service: "תנאי השירות",
    onboarding_privacy_policy_link: "מדיניות פרטיות",
    onboarding_agreement_suffix:
      "שלנו. תוכלו לשנות את ההעדפות האלה בכל עת בהגדרות.",
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

    // Onboarding
    onboarding_title: "Shopping Copilot Setup",
    onboarding_welcome: "Welcome to Shopping Copilot!",
    onboarding_welcome_desc:
      "Your AI-powered shopping assistant for Israeli grocery stores",
    onboarding_smart_search: "Smart Search",
    onboarding_smart_search_desc:
      "Find products quickly across Rami Levy & Shufersal",
    onboarding_cart_management: "Cart Management",
    onboarding_cart_management_desc:
      "Add, remove, and manage your shopping cart",
    onboarding_price_comparison: "Price Comparison",
    onboarding_price_comparison_desc: "Compare prices and find the best deals",
    onboarding_personalize_desc:
      "Let's personalize your shopping experience in just a few steps",
    onboarding_profile: "Personal Profile",
    onboarding_profile_desc: "Help us understand your shopping needs",
    onboarding_preferences: "Shopping Preferences",
    onboarding_preferences_desc: "Customize your shopping experience",
    onboarding_features: "Key Features",
    onboarding_features_desc:
      "Learn how to get the most out of Shopping Copilot",
    onboarding_privacy: "Privacy & Security",
    onboarding_privacy_desc: "Your privacy and security are our top priorities",
    onboarding_household_size: "Household Size",
    onboarding_household_1_2: "1-2 people",
    onboarding_household_3_4: "3-4 people",
    onboarding_household_5_plus: "5+ people",
    onboarding_dietary_prefs: "Dietary Preferences (Optional)",
    onboarding_kosher: "Kosher",
    onboarding_vegan: "Vegan",
    onboarding_vegetarian: "Vegetarian",
    onboarding_gluten_free: "Gluten-Free",
    onboarding_dairy_free: "Dairy-Free",
    onboarding_organic: "Organic Preferred",
    onboarding_budget_pref: "Budget Preference",
    onboarding_budget_conscious: "Budget-Conscious",
    onboarding_budget_conscious_desc: "Focus on deals & discounts",
    onboarding_moderate: "Moderate",
    onboarding_moderate_desc: "Balance of price & quality",
    onboarding_premium: "Premium",
    onboarding_premium_desc: "Quality over price",
    onboarding_shopping_frequency: "How often do you shop?",
    onboarding_daily: "Daily",
    onboarding_weekly: "Weekly",
    onboarding_monthly: "Monthly",
    onboarding_language_pref: "Language Preference",
    onboarding_hebrew: "עברית",
    onboarding_english: "English",
    onboarding_preferred_sites: "Preferred Shopping Sites",
    onboarding_rami_levy: "Rami Levy",
    onboarding_shufersal: "Shufersal",
    onboarding_favorite_categories: "Favorite Product Categories (Optional)",
    onboarding_fresh_produce: "🥬 Fresh Produce",
    onboarding_meat_fish: "🥩 Meat & Fish",
    onboarding_dairy: "🧀 Dairy Products",
    onboarding_bakery: "🍞 Bakery",
    onboarding_pantry: "🥫 Pantry Items",
    onboarding_frozen: "🧊 Frozen Foods",
    onboarding_snacks: "🍿 Snacks",
    onboarding_beverages: "🥤 Beverages",
    onboarding_household_items: "🧽 Household Items",
    onboarding_baby_products: "👶 Baby Products",
    onboarding_brand_prefs: "Brand Preferences (Optional)",
    onboarding_store_brands: "Store Brands",
    onboarding_national_brands: "National Brands",
    onboarding_premium_brands: "Premium Brands",
    onboarding_auto_credentials: "Automatic Credential Capture",
    onboarding_auto_credentials_desc:
      "We automatically capture your login credentials when you browse Rami Levy or Shufersal. If the page refreshes, it's just capturing your session for seamless shopping assistance.",
    onboarding_smart_commands: "Smart Chat Commands",
    onboarding_smart_commands_desc:
      'Try commands like: "Find organic tomatoes", "Add milk to cart", "Compare bread prices", or "Show my cart". The AI understands natural language!',
    onboarding_credit_system: "Credit System",
    onboarding_credit_system_desc:
      "You get 50 free credits monthly. Each conversation uses 1 credit. Monitor your usage in the header and get notifications when running low.",
    onboarding_multi_site: "Multi-Site Support",
    onboarding_multi_site_desc:
      "Works seamlessly across Rami Levy and Shufersal. The assistant automatically detects which site you're on and adapts accordingly.",
    onboarding_pro_tip: "Pro Tip",
    onboarding_pro_tip_desc:
      "For best results, make sure you're logged into the shopping site before using the assistant. This enables full cart management and personalized recommendations.",
    onboarding_secure_data: "Secure Data Handling",
    onboarding_secure_data_desc:
      "Your shopping credentials are encrypted and stored securely. We only access them to perform actions you request through the assistant.",
    onboarding_data_collection: "Data Collection",
    onboarding_data_collection_item1:
      "• Shopping preferences (to personalize recommendations)",
    onboarding_data_collection_item2:
      "• Site credentials (to manage your cart and orders)",
    onboarding_data_collection_item3:
      "• Conversation history (to improve service)",
    onboarding_data_collection_item4:
      "• Usage analytics (anonymous, for app improvement)",
    onboarding_user_rights: "Your Rights",
    onboarding_user_rights_item1: "• Update preferences anytime in settings",
    onboarding_user_rights_item2: "• Delete your account and all data",
    onboarding_user_rights_item3: "• Export your conversation history",
    onboarding_user_rights_item4: "• Contact support with privacy concerns",
    onboarding_agreement:
      "By completing setup, you agree to our {terms} and {privacy}. You can change these preferences anytime in settings.",
    onboarding_terms: "Terms of Service",
    onboarding_privacy_policy: "Privacy Policy",
    onboarding_skip: "Skip Setup",
    onboarding_previous: "Previous",
    onboarding_next: "Next",
    onboarding_complete: "Complete Setup",
    onboarding_completing: "Completing...",
    onboarding_step_of: "Step {current} of {total}",

    // Step 3 - Additional translations
    onboarding_language_preference: "Language Preference",
    onboarding_preferred_shopping_sites: "Preferred Shopping Sites",
    onboarding_other: "Other",
    onboarding_other_placeholder: "Enter other site name...",
    onboarding_favorite_categories_optional:
      "Favorite Product Categories (Optional)",
    onboarding_brand_preferences_optional: "Brand Preferences (Optional)",

    // Step 4 - Features translations
    onboarding_auto_credential_capture: "Automatic Credential Capture",
    onboarding_auto_credential_capture_desc:
      "We automatically capture your login credentials when you browse Rami Levy or Shufersal. If the page refreshes, it's just capturing your session for seamless shopping assistance.",
    onboarding_smart_chat_commands: "Smart Chat Commands",
    onboarding_smart_chat_commands_desc:
      'Try commands like: "Find organic tomatoes", "Add milk to cart", "Compare bread prices", or "Show my cart". The AI understands natural language!',
    onboarding_credit_system_title: "Credit System",
    onboarding_credit_system_desc_detailed:
      "You get 50 free credits monthly. Each conversation uses 1 credit. Monitor your usage in the header and get notifications when running low.",
    onboarding_multi_site_support: "Multi-Site Support",
    onboarding_multi_site_support_desc:
      "Works seamlessly across Rami Levy and Shufersal. The assistant automatically detects which site you're on and adapts accordingly.",
    onboarding_pro_tip_title: "Pro Tip",
    onboarding_pro_tip_content:
      "For best results, make sure you're logged into the shopping site before using the assistant. This enables full cart management and personalized recommendations.",

    // Step 5 - Privacy translations
    onboarding_secure_data_handling: "Secure Data Handling",
    onboarding_secure_data_handling_desc:
      "Your shopping credentials are encrypted and stored securely. We only access them to perform actions you request through the assistant.",
    onboarding_data_collection_title: "Data Collection",
    onboarding_data_collection_item_1:
      "• Shopping preferences (to personalize recommendations)",
    onboarding_data_collection_item_2:
      "• Site credentials (to manage your cart and orders)",
    onboarding_data_collection_item_3:
      "• Conversation history (to improve service)",
    onboarding_data_collection_item_4:
      "• Usage analytics (anonymous, for app improvement)",
    onboarding_your_rights: "Your Rights",
    onboarding_your_rights_item_1: "• Update preferences anytime in settings",
    onboarding_your_rights_item_2: "• Delete your account and all data",
    onboarding_your_rights_item_3: "• Export your conversation history",
    onboarding_your_rights_item_4: "• Contact support with privacy concerns",
    onboarding_agreement_text: "By completing setup, you agree to our",
    onboarding_terms_of_service: "Terms of Service",
    onboarding_privacy_policy_link: "Privacy Policy",
    onboarding_agreement_suffix:
      ". You can change these preferences anytime in settings.",
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
