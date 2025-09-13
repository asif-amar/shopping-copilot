import React from "react";
import { useLanguage } from "../hooks/useLanguage";

export const PrivacyPolicy: React.FC = () => {
  const { language, isRTL } = useLanguage();

  const policyContent = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 2025",
      sections: [
        {
          title: "1. Information We Collect",
          content: `We may collect the following information:
          
Personal Information:
• Google account information (email, name, profile picture) when you sign in
• Authentication tokens and session data

Usage Data:
• Chat messages and conversations with our AI assistant
• Shopping queries and product searches
• Website interactions and usage patterns
• Technical data (IP address, browser type, device information)

Third-Party Data:
• Product information from shopping websites you visit
• Cookies and authentication data from shopping sites (stored locally)
• Analytics and performance data`,
        },
        {
          title: "2. How We Use Your Information",
          content: `We use your information to:
          • Provide and improve our shopping assistant service
          • Personalize your shopping experience and recommendations
          • Maintain your conversation history and preferences
          • Analyze usage patterns to improve our AI responses
          • Ensure security and prevent abuse
          • Comply with legal requirements and enforce our terms

AI Processing:
• Your messages are processed by AI models to generate responses
• Conversations may be used to improve AI training (anonymized)
• We may analyze patterns to enhance product recommendations`,
        },
        {
          title: "3. Data Storage and Retention",
          content: `Storage Locations:
          • Conversations stored in secure databases
          • Authentication data managed by Google OAuth
          • Local browser storage for temporary data and preferences

Retention Periods:
          • Conversation data: Retained until you delete your account
          • Usage analytics: Anonymized and retained indefinitely
          • Authentication tokens: Expire according to Google's policies
          • Temporary data: Cleared when browser cache is cleared

We may retain anonymized data for analytics and service improvement.`,
        },
        {
          title: "4. Third-Party Services and Data Sharing",
          content: `We work with third-party services:

Google Services:
          • Google OAuth for authentication
          • Google's privacy policy applies to authentication data
          • We don't share your personal data with Google beyond authentication

Shopping Websites:
          • We access public product information from shopping sites
          • Your authentication with shopping sites is handled separately
          • We don't share your personal information with retailers

AI Service Providers:
          • Chat messages processed by AI models (may be third-party)
          • Data may be processed outside your country
          • We use anonymization where possible

We do not sell your personal information to third parties.`,
        },
        {
          title: "5. Data Security",
          content: `Security measures:
          • Encrypted data transmission (HTTPS/TLS)
          • Secure authentication via Google OAuth
          • Regular security updates and monitoring
          • Access controls and authentication for our systems

However, no system is 100% secure. We cannot guarantee absolute security of your data.

Beta Product Risks:
          • As a beta product, security measures may be incomplete
          • Data loss or corruption may occur without warning
          • Security vulnerabilities may exist and be discovered later`,
        },
        {
          title: "6. Your Privacy Rights",
          content: `Depending on your location, you may have rights to:
          • Access your personal data
          • Correct inaccurate information
          • Delete your data (right to be forgotten)
          • Port your data to another service
          • Restrict processing of your data
          • Object to certain data processing

To exercise these rights, contact us through the service interface.

Note: Some data may be retained for legal or operational reasons even after deletion requests.`,
        },
        {
          title: "7. Cookies and Local Storage",
          content: `We use:
          • Essential cookies for service functionality
          • Authentication tokens and session data
          • Local browser storage for preferences and temporary data
          • Analytics cookies to understand usage patterns

You can control cookies through your browser settings, but disabling them may affect service functionality.`,
        },
        {
          title: "8. International Data Transfers",
          content: `Your data may be processed in:
          • Israel (where our primary servers are located)
          • United States (for AI processing and cloud services)
          • Other countries where our service providers operate

We implement appropriate safeguards for international transfers, but data protection laws may vary by country.`,
        },
        {
          title: "9. Children's Privacy",
          content: `Our service is not intended for children under 13 (or relevant age in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.`,
        },
        {
          title: "10. Changes to This Policy",
          content: `We may update this privacy policy at any time. Changes are effective immediately upon posting. We will notify users of significant changes through the service interface.

Continued use after changes constitutes acceptance of the updated policy.`,
        },
        {
          title: "11. Data Breach Notification",
          content: `In case of a data breach:
          • We will assess the risk and impact
          • Notify relevant authorities as required by law
          • Inform affected users when legally required or when we determine notification is appropriate
          • Take steps to mitigate the breach and prevent future incidents

As a beta product, breach response procedures may be limited.`,
        },
        {
          title: "12. Contact Information",
          content: `For privacy-related questions or requests:
          • Contact us through the service interface
          • Use official communication channels provided in the application
          • Response times may vary, especially during beta period

We will respond to legitimate privacy requests within reasonable timeframes, subject to legal and technical limitations.`,
        },
      ],
    },
    he: {
      title: "מדיניות פרטיות",
      lastUpdated: "עודכן לאחרונה: ספטמבר 2025",
      sections: [
        {
          title: "1. מידע שאנו אוספים",
          content: `אנו עשויים לאסוף את המידע הבא:
          
מידע אישי:
• מידע חשבון Google (אימייל, שם, תמונת פרופיל) כאשר אתה נכנס
• אסימוני אימות ונתוני הפעלה

נתוני שימוש:
• הודעות צ'אט ושיחות עם עוזר ה-AI שלנו
• שאילתות קניות וחיפוש מוצרים
• אינטראקציות באתר ודפוסי שימוש
• נתונים טכניים (כתובת IP, סוג דפדפן, מידע מכשיר)

נתוני צד שלישי:
• מידע מוצרים מאתרי קניות שאתה מבקר
• עוגיות ונתוני אימות מאתרי קניות (נשמרים מקומית)
• נתוני אנליטיקה וביצועים`,
        },
        {
          title: "2. כיצד אנו משתמשים במידע שלך",
          content: `אנו משתמשים במידע שלך כדי:
          • לספק ולשפר את שירות עוזר הקניות שלנו
          • להתאים אישית את חוויית הקניות וההמלצות שלך
          • לשמור על היסטוריית השיחות והעדפותיך
          • לנתח דפוסי שימוש כדי לשפר את תגובות ה-AI שלנו
          • להבטיח אבטחה ולמנוע שימוש לרעה
          • לציית לדרישות חוקיות ולאכוף את התנאים שלנו

עיבוד AI:
• ההודעות שלך מעובדות על ידי מודלי AI כדי ליצור תגובות
• שיחות עשויות לשמש לשיפור אימון ה-AI (באופן אנונימי)
• אנו עשויים לנתח דפוסים כדי לשפר המלצות מוצרים`,
        },
        {
          title: "3. אחסון ושמירת נתונים",
          content: `מיקומי אחסון:
          • שיחות נשמרות במסדי נתונים מאובטחים
          • נתוני אימות מנוהלים על ידי Google OAuth
          • אחסון דפדפן מקומי לנתונים זמניים והעדפות

תקופות שמירה:
          • נתוני שיחה: נשמרים עד למחיקת החשבון שלך
          • אנליטיקת שימוש: אנונימית ונשמרת ללא הגבלת זמן
          • אסימוני אימות: פגים לפי מדיניות Google
          • נתונים זמניים: נמחקים כאשר זיכרון הדפדפן מתרוקן

אנו עשויים לשמור נתונים אנונימיים לאנליטיקה ושיפור השירות.`,
        },
        {
          title: "4. שירותי צד שלישי ושיתוף נתונים",
          content: `אנו עובדים עם שירותי צד שלישי:

שירותי Google:
          • Google OAuth לאימות
          • מדיניות הפרטיות של Google חלה על נתוני אימות
          • איננו משתפים את הנתונים האישיים שלך עם Google מעבר לאימות

אתרי קניות:
          • אנו ניגשים למידע מוצרים ציבורי מאתרי קניות
          • האימות שלך עם אתרי קניות מטופל בנפרד
          • איננו משתפים את המידע האישי שלך עם קמעונאים

ספקי שירות AI:
          • הודעות צ'אט מעובדות על ידי מודלי AI (עשויים להיות צד שלישי)
          • נתונים עשויים להיות מעובדים מחוץ למדינתך
          • אנו משתמשים באנונימיזציה במידת האפשר

איננו מוכרים את המידע האישי שלך לצדדים שלישיים.`,
        },
        {
          title: "5. אבטחת נתונים",
          content: `אמצעי אבטחה:
          • העברת נתונים מוצפנת (HTTPS/TLS)
          • אימות מאובטח דרך Google OAuth
          • עדכוני אבטחה ומעקב קבועים
          • בקרות גישה ואימות למערכות שלנו

עם זאת, אין מערכת מאובטחת ב-100%. איננו יכולים להבטיח אבטחה מוחלטת של הנתונים שלך.

סיכוני מוצר בטא:
          • כמוצר בטא, אמצעי האבטחה עלולים להיות לא שלמים
          • אובדן או פגיעה בנתונים עלולים להתרחש ללא אזהרה
          • פגיעויות אבטחה עלולות להתקיים ולהתגלות מאוחר יותר`,
        },
        {
          title: "6. זכויות הפרטיות שלך",
          content: `בהתאם למיקומך, ייתכן שיש לך זכויות:
          • לגשת לנתונים האישיים שלך
          • לתקן מידע לא מדויק
          • למחוק את הנתונים שלך (זכות להשכחה)
          • לייצא את הנתונים שלך לשירות אחר
          • להגביל עיבוד הנתונים שלך
          • להתנגד לעיבוד נתונים מסוימים

כדי לממש זכויות אלו, צור קשר איתנו דרך ממשק השירות.

הערה: נתונים מסוימים עשויים להישמר מסיבות חוקיות או תפעוליות גם לאחר בקשות מחיקה.`,
        },
        {
          title: "7. עוגיות ואחסון מקומי",
          content: `אנו משתמשים ב:
          • עוגיות חיוניות לפונקציונליות השירות
          • אסימוני אימות ונתוני הפעלה
          • אחסון דפדפן מקומי להעדפות ונתונים זמניים
          • עוגיות אנליטיקה להבנת דפוסי שימוש

אתה יכול לשלוט בעוגיות דרך הגדרות הדפדפן שלך, אך השבתתן עלולה להשפיע על פונקציונליות השירות.`,
        },
        {
          title: "8. העברות נתונים בינלאומיות",
          content: `הנתונים שלך עשויים להיות מעובדים ב:
          • ישראל (שם השרתים העיקריים שלנו נמצאים)
          • ארצות הברית (לעיבוד AI ושירותי ענן)
          • מדינות אחרות שבהן פועלים ספקי השירות שלנו

אנו מיישמים הגנות מתאימות להעברות בינלאומיות, אך חוקי הגנת הנתונים עשויים להשתנות לפי מדינה.`,
        },
        {
          title: "9. פרטיות ילדים",
          content: `השירות שלנו לא מיועד לילדים מתחת לגיל 13 (או הגיל הרלוונטי בתחום השיפוט שלך). איננו אוספים במכוון מידע אישי מילדים. אם אתה מאמין שאספנו מידע מילד, אנא צור קשר איתנו מיד.`,
        },
        {
          title: "10. שינויים במדיניות זו",
          content: `אנו עשויים לעדכן את מדיניות הפרטיות הזו בכל עת. שינויים נכנסים לתוקף מיד עם הפרסום. אנו נודיע למשתמשים על שינויים משמעותיים דרך ממשק השירות.

המשך השימוש לאחר שינויים מהווה הסכמה למדיניות המעודכנת.`,
        },
        {
          title: "11. הודעת פרצת נתונים",
          content: `במקרה של פרצת נתונים:
          • נעריך את הסיכון וההשפעה
          • נודיע לרשויות הרלוונטיות כנדרש בחוק
          • נודיע למשתמשים מושפעים כאשר נדרש בחוק או כאשר נקבע שההודעה מתאימה
          • ננקוט צעדים לצמצום הפרצה ולמנוע אירועים עתידיים

כמוצר בטא, הליכי תגובה לפרצות עלולים להיות מוגבלים.`,
        },
        {
          title: "12. פרטי יצירת קשר",
          content: `לשאלות או בקשות הקשורות לפרטיות:
          • צור קשר איתנו דרך ממשק השירות
          • השתמש בערוצי תקשורת רשמיים המסופקים באפליקציה
          • זמני תגובה עשויים להשתנות, במיוחד בתקופת הבטא

נגיב לבקשות פרטיות לגיטימיות בתוך מסגרות זמן סבירות, בכפוף להגבלות חוקיות וטכניות.`,
        },
      ],
    },
  };

  const content = policyContent[language];

  return (
    <div
      className="max-w-4xl mx-auto p-6 bg-white"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {content.title}
        </h1>
        <p className="text-sm text-slate-500">{content.lastUpdated}</p>
      </div>

      <div className="space-y-8">
        {content.sections.map((section, index) => (
          <div key={index} className="border-l-4 border-green-500 pl-4">
            <h2 className="text-xl font-semibold text-slate-700 mb-3">
              {section.title}
            </h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800 font-medium">
          {language === "he"
            ? "🔒 אנו מתחייבים להגן על הפרטיות שלך, אך זכור שזהו מוצר ניסיוני."
            : "🔒 We are committed to protecting your privacy, but remember this is an experimental product."}
        </p>
      </div>
    </div>
  );
};
