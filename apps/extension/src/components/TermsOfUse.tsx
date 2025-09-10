import React from "react";
import { useLanguage } from "../hooks/useLanguage";

export const TermsOfUse: React.FC = () => {
  const { language, isRTL } = useLanguage();

  const termsContent = {
    en: {
      title: "Terms of Use",
      lastUpdated: "Last updated: January 2025",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: `By accessing or using our Shopping Copilot service ("Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Service.`,
        },
        {
          title: "2. Beta/Experimental Product Disclaimer",
          content: `This Service is provided as an experimental/beta product. You acknowledge and agree that:
          • The Service may be unstable, unreliable, or unavailable
          • Features may not work as intended or may be discontinued without notice
          • Your data may be lost or corrupted without warning
          • We provide no guarantees regarding functionality, uptime, or performance
          • The Service is provided "as is" without any warranties`,
        },
        {
          title: "3. Limitation of Liability",
          content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          • We shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages
          • Our total liability shall not exceed $10 USD
          • You use the Service at your own risk
          • We are not responsible for any losses, damages, or harm arising from your use of the Service
          • We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose`,
        },
        {
          title: "4. Shopping and E-commerce Disclaimers",
          content: `• We are not affiliated with any shopping websites or retailers
          • Product information, prices, and availability are provided by third parties
          • We do not guarantee accuracy of product information or prices
          • We are not responsible for transactions between you and retailers
          • You are responsible for verifying all product details and prices before purchase
          • We do not provide customer service for retail transactions`,
        },
        {
          title: "5. AI-Generated Content Disclaimer",
          content: `• Our Service uses artificial intelligence which may provide inaccurate information
          • AI responses should not be considered professional advice
          • We are not responsible for decisions made based on AI-generated content
          • Always verify information independently before making purchases
          • AI may misunderstand requests or provide inappropriate responses`,
        },
        {
          title: "6. User Conduct and Prohibited Uses",
          content: `You agree not to:
          • Use the Service for any illegal or unauthorized purpose
          • Attempt to reverse engineer, hack, or exploit the Service
          • Use automated systems to access the Service
          • Upload malicious content or attempt to harm other users
          • Violate any third-party rights or terms of service
          • Use the Service for commercial purposes without permission`,
        },
        {
          title: "7. Data and Privacy",
          content: `• We may collect and process your data as described in our Privacy Policy
          • You consent to data processing for Service functionality
          • We may share anonymized data for analytics purposes
          • We use third-party services (Google, shopping sites) subject to their terms
          • Data retention and deletion policies apply as described in Privacy Policy`,
        },
        {
          title: "8. Intellectual Property",
          content: `• The Service and its content are owned by us or our licensors
          • You may not copy, modify, or distribute our intellectual property
          • Third-party trademarks belong to their respective owners
          • User-generated content may be used by us for Service improvement`,
        },
        {
          title: "9. Service Modifications and Termination",
          content: `We reserve the right to:
          • Modify or discontinue the Service at any time without notice
          • Suspend or terminate your access for any reason
          • Change these terms at any time (changes effective immediately upon posting)
          • Remove or modify features without compensation`,
        },
        {
          title: "10. International Use and Compliance",
          content: `• The Service is provided from Israel and subject to Israeli law
          • You are responsible for compliance with local laws and regulations
          • Some features may not be available in all jurisdictions
          • Currency conversions and international transactions are your responsibility`,
        },
        {
          title: "11. Indemnification",
          content: `You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses arising from your use of the Service or violation of these terms.`,
        },
        {
          title: "12. Governing Law and Disputes",
          content: `These terms are governed by Israeli law. Any disputes shall be resolved in Israeli courts. If any provision is found invalid, the remainder shall remain in effect.`,
        },
        {
          title: "13. Contact Information",
          content: `For questions about these terms, contact us through the Service interface or official channels.`,
        },
      ],
    },
    he: {
      title: "תנאי שימוש",
      lastUpdated: "עודכן לאחרונה: ספטמבר 2025",
      sections: [
        {
          title: "1. הסכמה לתנאים",
          content: `בגישה או שימוש בשירות עוזר הקניות שלנו ("השירות"), אתה מסכים להיות מחויב לתנאי השימוש הללו. אם אינך מסכים לתנאים אלו, אנא אל תשתמש בשירות.`,
        },
        {
          title: "2. הצהרת מוצר ניסיוני/בטא",
          content: `השירות מסופק כמוצר ניסיוני/בטא. אתה מכיר ומסכים כי:
          • השירות עלול להיות לא יציב, לא אמין או לא זמין
          • תכונות עלולות לא לעבוד כמתוכנן או להיות מופסקות ללא הודעה
          • הנתונים שלך עלולים ללכת לאיבוד או להיפגם ללא אזהרה
          • איננו מספקים אחריות כלשהי לגבי פונקציונליות, זמינות או ביצועים
          • השירות מסופק "כפי שהוא" ללא כל אחריות`,
        },
        {
          title: "3. הגבלת אחריות",
          content: `במידה המרבית המותרת על פי חוק:
          • לא נהיה אחראים לנזקים ישירים, עקיפים, מקריים, מיוחדים, תוצאתיים או עונשיים
          • אחריותנו הכוללת לא תעלה על 10 דולר אמריקאי
          • אתה משתמש בשירות על אחריותך הבלעדית
          • איננו אחראים לאובדנים, נזקים או פגיעות הנובעים מהשימוש שלך בשירות
          • אנו מתנערים מכל אחריות, מפורשת או משתמעת`,
        },
        {
          title: "4. הצהרות קניות ומסחר אלקטרוני",
          content: `• איננו קשורים לאתרי קניות או קמעונאים כלשהם
          • מידע על מוצרים, מחירים וזמינות מסופק על ידי צדדים שלישיים
          • איננו מבטיחים דיוק של מידע מוצרים או מחירים
          • איננו אחראים לעסקאות בינך לבין קמעונאים
          • אתה אחראי לאמת את כל פרטי המוצר והמחירים לפני רכישה
          • איננו מספקים שירות לקוחות לעסקאות קמעונאיות`,
        },
        {
          title: "5. הצהרת תוכן שנוצר על ידי AI",
          content: `• השירות שלנו משתמש בבינה מלאכותית שעלולה לספק מידע לא מדויק
          • תגובות AI לא צריכות להיחשב כייעוץ מקצועי
          • איננו אחראים להחלטות שהתקבלו על בסיס תוכן שנוצר על ידי AI
          • תמיד אמת מידע באופן עצמאי לפני ביצוע רכישות
          • AI עלול לא להבין בקשות או לספק תגובות לא מתאימות`,
        },
        {
          title: "6. התנהגות משתמש ושימושים אסורים",
          content: `אתה מסכים לא:
          • להשתמש בשירות למטרה בלתי חוקית או לא מורשית
          • לנסות לבצע הנדסה לאחור, פריצה או ניצול של השירות
          • להשתמש במערכות אוטומטיות לגישה לשירות
          • להעלות תוכן זדוני או לנסות לפגוע במשתמשים אחרים
          • להפר זכויות צד שלישי או תנאי שירות
          • להשתמש בשירות למטרות מסחריות ללא רשות`,
        },
        {
          title: "7. נתונים ופרטיות",
          content: `• אנו עשויים לאסוף ולעבד את הנתונים שלך כמתואר במדיניות הפרטיות שלנו
          • אתה מסכים לעיבוד נתונים לצורך פונקציונליות השירות
          • אנו עשויים לשתף נתונים אנונימיים למטרות אנליטיקה
          • אנו משתמשים בשירותי צד שלישי (Google, אתרי קניות) הכפופים לתנאים שלהם
          • מדיניות שמירה ומחיקת נתונים חלות כמתואר במדיניות הפרטיות`,
        },
        {
          title: "8. קניין רוחני",
          content: `• השירות והתוכן שלו בבעלותנו או של מעניקי הרישיון שלנו
          • אתה לא רשאי להעתיק, לשנות או להפיץ את הקניין הרוחני שלנו
          • סימנים מסחריים של צד שלישי שייכים לבעליהם בהתאמה
          • תוכן שנוצר על ידי משתמש עשוי לשמש אותנו לשיפור השירות`,
        },
        {
          title: "9. שינויים בשירות והפסקה",
          content: `אנו שומרים לעצמנו את הזכות:
          • לשנות או להפסיק את השירות בכל עת ללא הודעה
          • להשעות או להפסיק את הגישה שלך מכל סיבה
          • לשנות את התנאים הללו בכל עת (שינויים נכנסים לתוקף מיד עם הפרסום)
          • להסיר או לשנות תכונות ללא פיצוי`,
        },
        {
          title: "10. שימוש בינלאומי וציות",
          content: `• השירות מסופק מישראל וכפוף לחוק הישראלי
          • אתה אחראי לציות לחוקים ותקנות מקומיים
          • תכונות מסוימות עלולות לא להיות זמינות בכל התחומים השיפוטיים
          • המרות מטבע ועסקאות בינלאומיות הן באחריותך`,
        },
        {
          title: "11. פיצוי",
          content: `אתה מסכים לפצות ולשמור אותנו בפני כל תביעות, נזקים, הפסדים או הוצאות הנובעות מהשימוש שלך בשירות או הפרת התנאים הללו.`,
        },
        {
          title: "12. חוק החל וסכסוכים",
          content: `תנאים אלו כפופים לחוק הישראלי. כל מחלוקת תיפתר בבתי המשפט הישראליים. אם הוראה כלשהי תימצא לא תקפה, השאר יישאר בתוקף.`,
        },
        {
          title: "13. פרטי יצירת קשר",
          content: `לשאלות על תנאים אלו, צור קשר איתנו דרך ממשק השירות או ערוצים רשמיים.`,
        },
      ],
    },
  };

  const content = termsContent[language];

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
          <div key={index} className="border-l-4 border-blue-500 pl-4">
            <h2 className="text-xl font-semibold text-slate-700 mb-3">
              {section.title}
            </h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800 font-medium">
          {language === "he"
            ? "⚠️ זהו מוצר ניסיוני. השתמש על אחריותך הבלעדית."
            : "⚠️ This is an experimental product. Use at your own risk."}
        </p>
      </div>
    </div>
  );
};
