import React from "react";
import { motion } from "framer-motion";
import { Milk, Banana, ChefHat } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface EmptyStateProps {
  onQuickAction: (message: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onQuickAction }) => {
  const { isRTL, t } = useLanguage();

  const quickActions = [
    {
      icon: Milk,
      key: "quick_basic_items",
      descKey: "quick_basic_items_desc",
      message: t("quick_basic_items_desc"),
    },
    {
      icon: Banana,
      key: "quick_vegetables_salad",
      descKey: null,
      message: t("quick_vegetables_salad").replace("🥦 ", ""),
    },
    {
      icon: ChefHat,
      key: "quick_recipe_suggestion",
      descKey: null,
      message: t("quick_recipe_suggestion").replace("🛒 ", ""),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        textAlign: "center",
        direction: isRTL ? "rtl" : "ltr",
        width: "100%",
        maxWidth: "350px",
        flex: 1,
        maxHeight: "100%",
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
      >
        {/* <ShoppingCart size={30} color="white" /> */}
        <img
          src="/icons/shopping_copilot_logo.svg"
          alt="Shopping Copilot Logo"
          width={30}
          height={30}
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </motion.div>

      {/* Welcome Message */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-base font-semibold text-foreground m-0 mb-2 leading-relaxed"
      >
        {t("empty_welcome")}
      </motion.h2>

      {/* Example Usage */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-muted-foreground m-0 mb-5 leading-relaxed"
      >
        {t("empty_try_typing")}
      </motion.p>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: "100%",
          maxWidth: "280px",
        }}
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.key}
              onClick={() => onQuickAction(action.message)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={`flex items-center gap-2.5 p-3 bg-muted/50 border border-border rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted hover:border-ring ${
                isRTL ? "text-right flex-row-reverse" : "text-left flex-row"
              }`}
            >
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium text-foreground ${action.descKey ? "mb-0.5" : "mb-0"}`}>
                  {t(action.key)
                    .replace(/🥛|🥦|🛒/, "")
                    .trim()}
                </div>
                {action.descKey && (
                  <div className="text-xs text-muted-foreground">
                    {t(action.descKey)}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-xs text-muted-foreground/70 mt-4 mb-0 italic"
      >
        {t("empty_tagline")}
      </motion.p>
    </motion.div>
  );
};
