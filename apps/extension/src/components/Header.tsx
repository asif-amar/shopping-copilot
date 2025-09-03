import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ShoppingBag, User, LogOut } from "lucide-react";
import {
  getSiteAdapterFromHostname,
  getSiteDisplayName,
  isShoppingSite,
} from "@/services/websiteContext";
import { useLanguage } from "@/hooks/useLanguage";
import { ApiService } from "@/services/api";
import { AuthModal } from "./AuthModal";
import { TooltipButton } from "./TooltipButton";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await ApiService.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      const userInfo = await ApiService.getCurrentUserInfo();
      setUserEmail(userInfo?.email || null);
    }
  };

  const handleUserIconClick = () => {
    if (isAuthenticated) {
      handleSignOut();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = async () => {
    await checkAuthStatus(); // Refresh auth status
  };

  const handleSignOut = async () => {
    try {
      await ApiService.signOut();
      console.log("User signed out successfully!");
      setIsAuthenticated(false);
      setUserEmail(null);
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  };

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
          {isAuthenticated ? (
            <TooltipButton
              tooltip={`${t("sign_out")}${userEmail ? ` (${userEmail})` : ""}`}
              onClick={handleSignOut}
              buttonStyle={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "none",
                color: "#dc2626",
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
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(239, 68, 68, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(239, 68, 68, 0.1)";
              }}
            >
              <LogOut size={16} />
            </TooltipButton>
          ) : (
            <TooltipButton
              tooltip={t("sign_in")}
              onClick={handleUserIconClick}
              buttonStyle={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "none",
                color: "#16a34a",
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
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(34, 197, 94, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(34, 197, 94, 0.1)";
              }}
            >
              <User size={16} />
            </TooltipButton>
          )}

          <TooltipButton
            tooltip={`${t("switch_to")} ${language === "he" ? "English" : "Hebrew"}`}
            onClick={toggleLanguage}
            buttonStyle={{
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
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(71, 85, 105, 0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(71, 85, 105, 0.08)";
            }}
          >
            {language === "he" ? "EN" : "HE"}
          </TooltipButton>

          <TooltipButton
            tooltip={t("new_chat")}
            onClick={onNewConversation}
            buttonStyle={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              border: "none",
              color: "white",
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
              boxShadow: "0 2px 6px rgba(59, 130, 246, 0.25)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 12px rgba(59, 130, 246, 0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 2px 6px rgba(59, 130, 246, 0.25)";
            }}
          >
            <Plus size={14} />
          </TooltipButton>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </motion.div>
  );
};
