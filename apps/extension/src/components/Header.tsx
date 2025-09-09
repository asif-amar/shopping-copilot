import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ShoppingBag,
  User,
  LogOut,
  Settings,
  Menu,
  Languages,
  MessageSquare,
} from "lucide-react";
import {
  getSiteAdapterFromHostname,
  getSiteDisplayName,
  isShoppingSite,
} from "@/services/websiteContext";
import { useLanguage } from "@/hooks/useLanguage";
import { ApiService } from "@/services/api";
import { AuthModal } from "./AuthModal";
import { SettingsModal } from "./SettingsModal";
import { TooltipButton } from "./TooltipButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";

interface HeaderProps {
  currentHostname: string;
  onNewConversation: () => void;
  onOpenConversations?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentHostname,
  onNewConversation,
  onOpenConversations,
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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

  const handleLanguageChange = (lang: "en" | "he") => {
    if (lang !== language) {
      toggleLanguage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-6 py-5 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShoppingBag size={18} color="white" />
          </div>
          <div className="flex-1">
            <h1 className="m-0 text-xl font-bold text-slate-800 tracking-tight">
              {t("shopping_assistant")}
            </h1>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
              <span>{displayName || t("loading")}</span>
              {isSupported && (
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  {t("supported")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Action buttons and dropdown */}
        <div className="flex items-center gap-2">
          {/* Conversations Button */}
          {onOpenConversations && (
            <TooltipButton
              tooltip={t("conversations") || "Conversations"}
              onClick={onOpenConversations}
              buttonStyle={{
                width: "36px",
                height: "36px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#e2e8f0";
                (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
                (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
              }}
            >
              <MessageSquare size={14} />
            </TooltipButton>
          )}

          {/* New Chat Button */}
          <TooltipButton
            tooltip={t("new_chat")}
            onClick={onNewConversation}
            buttonStyle={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              border: "none",
              color: "white",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(59, 130, 246, 0.25)",
              transition: "all 0.2s ease",
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

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-all duration-200 border border-slate-300 cursor-pointer">
                <Menu size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? "start" : "end"}
              className={cn("w-56", isRTL ? "text-right" : "text-left")}
              style={{ direction: isRTL ? "rtl" : "ltr" }}
            >
              {/* User section */}
              {isAuthenticated && userEmail && (
                <DropdownMenuLabel
                  className={cn("text-xs", isRTL ? "text-right" : "text-left")}
                >
                  {userEmail}
                </DropdownMenuLabel>
              )}

              {/* Language submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  isRTL={isRTL}
                  className={cn(
                    "flex items-center gap-2",
                    isRTL ? "flex-row justify-between" : "flex-row"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Languages size={16} />
                    <span>{t("language")}</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                >
                  <DropdownMenuItem
                    onClick={() => handleLanguageChange("en")}
                    className={cn(
                      "cursor-pointer flex justify-between",
                      language === "en" ? "bg-accent" : ""
                    )}
                  >
                    <span>English</span>
                    {language === "en" && <span>✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleLanguageChange("he")}
                    className={cn(
                      "cursor-pointer flex justify-between",
                      language === "he" ? "bg-accent" : ""
                    )}
                  >
                    <span>עברית</span>
                    {language === "he" && <span>✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Settings - only show for authenticated users */}
              {isAuthenticated && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsSettingsModalOpen(true)}
                    className={cn(
                      "cursor-pointer flex items-center gap-2",
                      isRTL ? "flex-row" : "flex flex-row-reverse justify-end"
                    )}
                  >
                    {isRTL ? (
                      <>
                        <Settings size={16} />
                        <span>{language === "he" ? "הגדרות" : "Settings"}</span>
                      </>
                    ) : (
                      <>
                        <span>{language === "he" ? "הגדרות" : "Settings"}</span>
                        <Settings size={16} />
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Auth section */}
              {isAuthenticated ? (
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className={cn(
                    "cursor-pointer flex items-center gap-2",
                    isRTL ? "flex-row" : "flex flex-row-reverse justify-end"
                  )}
                >
                  {isRTL ? (
                    <>
                      <LogOut size={16} />
                      <span>{t("sign_out")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("sign_out")}</span>
                      <LogOut size={16} />
                    </>
                  )}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setIsAuthModalOpen(true)}
                  className={cn(
                    "cursor-pointer flex items-center gap-2",
                    isRTL ? "flex-row" : "flex flex-row-reverse justify-end"
                  )}
                >
                  {isRTL ? (
                    <>
                      <User size={16} />
                      <span>{t("sign_in")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("sign_in")}</span>
                      <User size={16} />
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </motion.div>
  );
};
