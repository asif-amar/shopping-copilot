import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Mail,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Zap,
  Crown,
  Users,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BetaWaitlistStateProps {
  userEmail: string;
  onCheckStatus?: () => Promise<void>;
  isCheckingStatus?: boolean;
}

export const BetaWaitlistState: React.FC<BetaWaitlistStateProps> = ({
  userEmail,
  onCheckStatus,
  isCheckingStatus = false,
}) => {
  const { isRTL } = useLanguage();
  const [showFeatures, setShowFeatures] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Localized text
  type TranslationKey =
    | "welcome"
    | "waitlist"
    | "subtitle"
    | "description"
    | "yourEmail"
    | "statusPending"
    | "contactButton"
    | "checkStatus"
    | "checking"
    | "whyWait"
    | "whyWaitDesc"
    | "features"
    | "feature1"
    | "feature2"
    | "feature3"
    | "feature4"
    | "showFeatures"
    | "hideFeatures"
    | "betaProgram"
    | "limitedSpots"
    | "requestAccess"
    | "yourMessage"
    | "submitRequest"
    | "sendingRequest";

  const getText = (key: TranslationKey): string => {
    const translations = {
      en: {
        welcome: "Welcome to Shopping Copilot Beta!",
        waitlist: "You're on our exclusive waitlist",
        subtitle: "Get ready for AI-powered shopping",
        description:
          "Shopping Copilot is currently in private beta. We're gradually inviting users to ensure the best experience for everyone.",
        yourEmail: "Your email:",
        statusPending: "Status: Pending Approval",
        contactButton: "Request Beta Access",
        checkStatus: "Check Status",
        checking: "Checking...",
        whyWait: "Why the wait?",
        whyWaitDesc:
          "We're fine-tuning the AI to provide the most accurate shopping recommendations and ensuring our servers can handle the demand.",
        features: "What you'll get:",
        feature1: "Smart product recommendations",
        feature2: "Real-time price comparisons",
        feature3: "AI-powered shopping assistant",
        feature4: "Multi-store inventory search",
        showFeatures: "See what's coming",
        hideFeatures: "Hide features",
        betaProgram: "Exclusive Beta Program",
        limitedSpots: "Limited spots available",
        requestAccess: "Request Access",
        yourMessage: "Your message (optional):",
        submitRequest: "Submit Request",
        sendingRequest: "Sending...",
      },
      he: {
        welcome: "ברוכים הבאים לבטא של Shopping Copilot!",
        waitlist: "אתם ברשימת ההמתנה הבלעדית שלנו",
        subtitle: "היכונו לקניות חכמות עם AI",
        description:
          "Shopping Copilot נמצא כרגע בבטא פרטית. אנחנו מזמינים משתמשים בהדרגה כדי להבטיח את החוויה הטובה ביותר לכולם.",
        yourEmail: "האימייל שלכם:",
        statusPending: "סטטוס: ממתין לאישור",
        contactButton: "בקשת גישה לבטא",
        checkStatus: "בדיקת סטטוס",
        checking: "בודק...",
        whyWait: "למה להמתין?",
        whyWaitDesc:
          "אנחנו מכוונים את הבינה המלאכותית לספק המלצות קנייה מדויקות ומוודאים שהשרתים יכולים להתמודד עם הביקוש.",
        features: "מה תקבלו:",
        feature1: "המלצות מוצרים חכמות",
        feature2: "השוואת מחירים בזמן אמת",
        feature3: "עוזר קניות מבוסס AI",
        feature4: "חיפוש מלאי בחנויות מרובות",
        showFeatures: "ראו מה בדרך",
        hideFeatures: "הסתרת התכונות",
        betaProgram: "תוכנית בטא בלעדית",
        limitedSpots: "מספר מקומות מוגבל",
        requestAccess: "בקשת גישה",
        yourMessage: "ההודעה שלכם (אופציונלי):",
        submitRequest: "שלח בקשה",
        sendingRequest: "שולח...",
      },
    };

    return translations[isRTL ? "he" : "en"][key];
  };

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);

    try {
      console.log("📝 Submitting beta access request...");
      const response = await ApiService.submitBetaAccessRequest(
        requestMessage.trim() || undefined
      );

      console.log("✅ Beta access request submitted:", response);

      // Reset form and close
      setShowRequestForm(false);
      setRequestMessage("");

      // Show success feedback with toast
      toast.success(
        isRTL
          ? response.has_existing_request
            ? "הבקשה שלכם עודכנה בהצלחה! נבדוק אותה ונשלח לכם הודעה בקרוב."
            : "הבקשה שלכם נשלחה בהצלחה! נבדוק אותה ונשלח לכם הודעה בקרוב."
          : response.has_existing_request
            ? "Your request has been updated successfully! We'll review it and get back to you soon."
            : "Your request has been submitted successfully! We'll review it and get back to you soon."
      );
    } catch (error) {
      console.error("❌ Failed to submit beta access request:", error);

      // Show error feedback with toast
      toast.error(
        isRTL
          ? "אירעה שגיאה בשליחת הבקשה. אנא נסו שוב מאוחר יותר."
          : "Failed to submit request. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (onCheckStatus && !isCheckingStatus) {
      await onCheckStatus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center text-center max-w-md mx-auto"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Beta Badge with Gradient */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl relative">
            {/* Animated sparkle effect */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-30 z-0"
            >
              <Sparkles
                size={24}
                color="white"
                className="absolute top-2 left-2"
              />
              <Sparkles
                size={16}
                color="white"
                className="absolute bottom-3 right-3"
              />
            </motion.div>

            <Crown size={36} color="white" className="relative z-10" />
          </div>

          {/* Beta badge - moved outside main container for proper layering */}
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[8px] font-bold px-2 py-1 rounded-full transform rotate-12 shadow-lg border-2 border-white z-30">
            BETA
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 leading-tight"
        >
          {getText("welcome")}
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 mb-4"
        >
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <p className="text-lg font-semibold text-foreground">
            {getText("waitlist")}
          </p>
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="font-semibold text-purple-800 dark:text-purple-300 text-sm">
              {getText("betaProgram")}
            </span>
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            {getText("yourEmail")}
          </div>
          <div className="font-mono text-sm text-foreground bg-white dark:bg-gray-800 px-3 py-2 rounded-lg mb-3">
            {userEmail}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {getText("statusPending")}
            </span>
          </div>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground mb-6 leading-relaxed"
        >
          {getText("description")}
        </motion.p>

        {/* Features Toggle */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => setShowFeatures(!showFeatures)}
          className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-colors"
        >
          <Sparkles size={14} />
          {showFeatures ? getText("hideFeatures") : getText("showFeatures")}
        </motion.button>

        {/* Features List */}
        {showFeatures && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mb-6 overflow-hidden"
          >
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-sm text-foreground mb-3">
                {getText("features")}
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-green-500" />
                  <span className="text-muted-foreground">
                    {getText("feature1")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingBag size={12} className="text-blue-500" />
                  <span className="text-muted-foreground">
                    {getText("feature2")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-purple-500" />
                  <span className="text-muted-foreground">
                    {getText("feature3")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-orange-500" />
                  <span className="text-muted-foreground">
                    {getText("feature4")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Request Form or Action Buttons */}
        {showRequestForm ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-4"
          >
            <div className="text-left">
              <label
                className={cn(
                  "block text-sm font-medium text-foreground mb-2",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                {getText("yourMessage")}
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder={
                  isRTL
                    ? "תוכלו לכתוב כאן מדוע אתם מעוניינים להצטרף..."
                    : "You can write why you're interested in joining..."
                }
                className="w-full h-24 p-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ direction: isRTL ? "rtl" : "ltr" }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail
                  size={16}
                  className={isSubmitting ? "animate-pulse" : ""}
                />
                {isSubmitting
                  ? getText("sendingRequest")
                  : getText("submitRequest")}
              </button>

              <button
                onClick={() => {
                  setShowRequestForm(false);
                  setRequestMessage("");
                }}
                className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium text-sm transition-colors duration-200"
              >
                {isRTL ? "ביטול" : "Cancel"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col gap-3 w-full"
          >
            {/* Primary action - Request access */}
            <button
              onClick={() => setShowRequestForm(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Mail size={16} />
              {getText("requestAccess")}
            </button>

            {/* Secondary action - Check status */}
            {onCheckStatus && (
              <button
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={14}
                  className={isCheckingStatus ? "animate-spin" : ""}
                />
                {isCheckingStatus
                  ? getText("checking")
                  : getText("checkStatus")}
              </button>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 pt-4 border-t border-border text-center"
        >
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {getText("limitedSpots")}
            </span>
            <br />
            {getText("whyWaitDesc")}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
