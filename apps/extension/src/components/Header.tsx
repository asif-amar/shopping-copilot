import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ShoppingBag } from "lucide-react";
import {
  getSiteAdapterFromHostname,
  getSiteDisplayName,
  isShoppingSite,
} from "@/services/websiteContext";
import { useLanguage } from "@/hooks/useLanguage";

interface HeaderProps {
  currentHostname: string;
  onNewConversation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentHostname,
  onNewConversation,
}) => {
  const { language, isRTL, toggleLanguage, t } = useLanguage();
  const siteAdapter = getSiteAdapterFromHostname(currentHostname);
  const displayName = siteAdapter
    ? getSiteDisplayName(siteAdapter, language)
    : currentHostname;
  const isSupported = isShoppingSite(currentHostname);

  // useEffect(() => {
  //   console.log("language changed to", language);
  //   console.log("displayName", displayName);
  //   console.log("currentHostname", currentHostname);
  //   console.log("siteAdapter", siteAdapter);
  // }, [language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: "20px 24px",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        borderBottom: "1px solid #e2e8f0",
        flexShrink: 0,
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
            }}
          >
            <ShoppingBag size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "700",
                color: "#1e293b",
                letterSpacing: "-0.02em",
              }}
            >
              {t("shopping_assistant")}
            </h1>
            <div
              style={{
                margin: "4px 0 0 0",
                fontSize: "13px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{displayName || t("loading")}</span>
              {isSupported && (
                <span
                  style={{
                    backgroundColor: "#dcfce7",
                    color: "#16a34a",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: "#16a34a",
                      borderRadius: "50%",
                    }}
                  />
                  {t("supported")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <motion.button
            onClick={toggleLanguage}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: "rgba(71, 85, 105, 0.08)",
              border: "none",
              color: "#475569",
              borderRadius: "8px",
              padding: "8px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(71, 85, 105, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(71, 85, 105, 0.08)";
            }}
            title={`Switch to ${language === "he" ? "English" : "Hebrew"}`}
          >
            {language === "he" ? "EN" : "HE"}
          </motion.button>

          <motion.button
            onClick={onNewConversation}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              border: "none",
              color: "white",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(59, 130, 246, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(59, 130, 246, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 2px 6px rgba(59, 130, 246, 0.25)";
            }}
            title={t("new_chat")}
          >
            <Plus size={14} />
            {t("new_chat")}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
