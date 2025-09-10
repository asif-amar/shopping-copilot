import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface CreditWarningBannerProps {
  creditsRemaining: number;
  isLowCredits: boolean;
  creditsExhausted: boolean;
  resetDate?: string | null;
  onClose?: () => void;
}

export const CreditWarningBanner: React.FC<CreditWarningBannerProps> = ({
  creditsRemaining,
  isLowCredits,
  creditsExhausted,
  resetDate,
  onClose,
}) => {
  const { isRTL, t } = useLanguage();

  // Don't show banner if credits are sufficient
  if (!isLowCredits && !creditsExhausted) {
    return null;
  }

  const formatResetDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getWarningContent = () => {
    if (creditsExhausted) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        title: t("credits_exhausted"),
        message: t("credits_exhausted_message"),
        bgColor: "bg-red-50 border-red-200",
        textColor: "text-red-800",
        iconColor: "text-red-600",
      };
    }

    if (isLowCredits) {
      return {
        icon: <Zap className="w-4 h-4" />,
        title: t("credits_low_warning"),
        message: t("credits_low_message").replace(
          "{count}",
          creditsRemaining.toString()
        ),
        bgColor: "bg-amber-50 border-amber-200",
        textColor: "text-amber-800",
        iconColor: "text-amber-600",
      };
    }

    return null;
  };

  const warningContent = getWarningContent();
  if (!warningContent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "border rounded-lg p-3 mb-3 overflow-hidden",
          warningContent.bgColor,
          isRTL ? "text-right" : "text-left"
        )}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0 mt-0.5", warningContent.iconColor)}>
            {warningContent.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* <div className={cn("font-medium text-sm", warningContent.textColor)}>
              {warningContent.title}
            </div> */}
            <div className={cn("text-sm opacity-90", warningContent.textColor)}>
              {warningContent.message}
            </div>

            {resetDate && (
              <div
                className={cn(
                  "flex items-center gap-1.5 mt-2 text-xs opacity-75",
                  warningContent.textColor
                )}
              >
                <span>
                  {t("credits_refresh_next_month").replace(
                    "{date}",
                    formatResetDate(resetDate)
                  )}
                </span>
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "flex-shrink-0 opacity-50 hover:opacity-75 transition-opacity p-1 rounded",
                warningContent.textColor
              )}
              aria-label="Close warning"
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
