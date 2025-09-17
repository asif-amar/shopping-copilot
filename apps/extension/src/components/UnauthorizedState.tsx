import React from "react";
import { motion } from "framer-motion";
import { Shield, Mail, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface UnauthorizedStateProps {
  message?: string;
  onRetry?: () => void;
}

export const UnauthorizedState: React.FC<UnauthorizedStateProps> = ({
  message = "Access restricted. Please contact us for authorization.",
  onRetry,
}) => {
  const { isRTL, t } = useLanguage();

  const defaultMessage = isRTL
    ? "הגישה מוגבלת. אנא צרו קשר לקבלת הרשאה."
    : "Access restricted. Please contact us for authorization.";

  const contactEmail = "liorlivyatan@gmail.com"; // Replace with your email

  const handleEmailContact = () => {
    const subject = encodeURIComponent(
      "Shopping Copilot Extension Access Request"
    );
    const body = encodeURIComponent(
      isRTL
        ? `שלום,\n\nאני מבקש/ת גישה להרחבת Shopping Copilot.\n\nהאימייל שלי: [אנא הכניסו את האימייל שלכם כאן]\n\nתודה!`
        : `Hello,\n\nI would like to request access to the Shopping Copilot extension.\n\nMy email: [Please enter your email here]\n\nThank you!`
    );

    window.open(
      `mailto:${contactEmail}?subject=${subject}&body=${body}`,
      "_blank"
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] max-w-sm mx-auto"
      style={{
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
      >
        <Shield size={32} color="white" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-bold text-foreground mb-2 leading-tight"
      >
        {isRTL ? "גישה מוגבלת" : "Access Restricted"}
      </motion.h2>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-muted-foreground mb-6 leading-relaxed"
      >
        {message.includes("restricted") ? defaultMessage : message}
      </motion.p>

      {/* Warning notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-6 text-left"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <AlertTriangle
          size={16}
          className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
        />
        <div className="text-xs text-amber-800 dark:text-amber-200 leading-tight">
          <strong className="font-medium">
            {isRTL ? "הרחבה זו זמינה לחברים בלבד" : "Friends-Only Extension"}
          </strong>
          <br />
          {isRTL
            ? "בעל ההרחבה הגביל את הגישה לרשימת חברים מוגדרת מראש."
            : "The extension owner has restricted access to a predefined friends list."}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col gap-3 w-full"
      >
        {/* Primary action - Contact via email */}
        <button
          onClick={handleEmailContact}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Mail size={16} />
          {isRTL ? "בקשת גישה באימייל" : "Request Access via Email"}
        </button>

        {/* Secondary action - Retry if available */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium text-sm transition-colors duration-200"
          >
            {isRTL ? "נסה שוב" : "Try Again"}
          </button>
        )}
      </motion.div>

      {/* Footer info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 pt-4 border-t border-border"
      >
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          {isRTL
            ? "לאחר בקשת הגישה, בעל ההרחבה יוכל להוסיף אותכם לרשימת המשתמשים המורשים."
            : "After requesting access, the extension owner can add you to the authorized users list."}
        </p>
      </motion.div>
    </motion.div>
  );
};
