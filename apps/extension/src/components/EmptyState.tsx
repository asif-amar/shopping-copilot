import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Milk, Banana, ChefHat, Carrot } from "lucide-react";
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
        padding: "40px 24px",
        textAlign: "center",
        direction: isRTL ? "rtl" : "ltr",
        width: "100%",
        maxWidth: "400px",
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
        }}
      >
        <ShoppingCart size={36} color="white" />
      </motion.div>

      {/* Welcome Message */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#1e293b",
          margin: "0 0 12px 0",
          lineHeight: "1.4",
        }}
      >
        {t("empty_welcome")}
      </motion.h2>

      {/* Example Usage */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontSize: "14px",
          color: "#64748b",
          margin: "0 0 32px 0",
          lineHeight: "1.5",
        }}
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
          gap: "8px",
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: isRTL ? "right" : "left",
                flexDirection: isRTL ? "row-reverse" : "row",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#3b82f6" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: action.descKey ? "2px" : "0",
                  }}
                >
                  {t(action.key)
                    .replace(/🥛|🥦|🛒/, "")
                    .trim()}
                </div>
                {action.descKey && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
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
        style={{
          fontSize: "13px",
          color: "#9ca3af",
          margin: "24px 0 0 0",
          fontStyle: "italic",
        }}
      >
        {t("empty_tagline")}
      </motion.p>
    </motion.div>
  );
};
