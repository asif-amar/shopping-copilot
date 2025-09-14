import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  User,
  LogOut,
  Settings,
  Menu,
  Languages,
  MessageSquare,
  MessageCircle,
  FileText,
  ShoppingBag,
} from "lucide-react";
import {
  getSiteAdapterFromHostname,
  getSiteDisplayName,
  isShoppingSite,
} from "@/services/websiteContext";
import { useLanguage } from "@/hooks/useLanguage";
import { useChangelog } from "@/hooks/useChangelog";
import { ApiService } from "@/services/api";
import { AuthModal } from "./AuthModal";
import { SettingsModal } from "./SettingsModal";
import { FeedbackModal } from "./FeedbackModal";
import { ChangelogModal } from "./ChangelogModal";
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
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentHostname,
  onNewConversation,
  onOpenConversations,
  onSignOut,
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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);

  const { hasUnreadChangelog, currentVersion, markChangelogAsRead } =
    useChangelog();

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
      // Start a new conversation after sign out
      if (onSignOut) {
        onSignOut();
      }
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  };

  const handleLanguageChange = (lang: "en" | "he") => {
    if (lang !== language) {
      toggleLanguage();
    }
  };

  const handleChangelogOpen = async () => {
    setIsChangelogModalOpen(true);
    if (hasUnreadChangelog) {
      await markChangelogAsRead();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Logo and title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#642BFE] to-[#732BFF] rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
            {/* <img
              src="/icons/shopping_copilot_logo.svg"
              alt="Shopping Copilot Logo"
              width={16}
              height={16}
              style={{ filter: "brightness(0) invert(1)" }}
            /> */}
            <ShoppingBag size={16} color="white" />
          </div>
          <div className="flex-1">
            <h1 className="m-0 text-base font-bold text-slate-800 tracking-tight">
              {t("shopping_assistant")}
            </h1>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
              <span>{displayName || t("loading")}</span>
              {isSupported ? (
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  {t("supported")}
                </span>
              ) : (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  {t("not_supported")}
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
                width: "32px",
                height: "32px",
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
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#e2e8f0";
                (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 2px 4px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#f1f5f9";
                (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 1px 2px rgba(0, 0, 0, 0.05)";
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
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #642BFE 0%, #732BFF 100%)",
              border: "none",
              color: "white",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(100, 43, 254, 0.25)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 12px rgba(100, 43, 254, 0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 2px 6px rgba(100, 43, 254, 0.25)";
            }}
          >
            <Plus size={14} />
          </TooltipButton>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-all duration-200 border border-slate-300 cursor-pointer">
                <Menu size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? "start" : "end"}
              side="bottom"
              className={cn(
                "w-56 bg-white border border-slate-200 shadow-lg max-h-[70vh] overflow-y-auto",
                isRTL ? "text-right" : "text-left"
              )}
              style={{ direction: isRTL ? "rtl" : "ltr" }}
              sideOffset={4}
              alignOffset={isRTL ? 0 : 0}
              avoidCollisions={true}
              collisionPadding={8}
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
                  className="w-32 bg-white border border-slate-200 shadow-lg max-h-[60vh] overflow-y-auto"
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                  avoidCollisions={true}
                  collisionPadding={12}
                  alignOffset={isRTL ? -100 : 100}
                  sideOffset={4}
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

              {/* Changelog */}
              <DropdownMenuItem
                onClick={handleChangelogOpen}
                className={cn(
                  "cursor-pointer flex items-center gap-2 relative",
                  isRTL ? "flex-row" : "flex flex-row-reverse justify-end"
                )}
              >
                {isRTL ? (
                  <>
                    <FileText size={16} />
                    <span>{t("changelog")}</span>
                    {hasUnreadChangelog && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-auto" />
                    )}
                  </>
                ) : (
                  <>
                    <span>{t("changelog")}</span>
                    <FileText size={16} />
                    {hasUnreadChangelog && (
                      <div className="w-2 h-2 bg-red-500 rounded-full ml-auto" />
                    )}
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Settings & Feedback - only show for authenticated users */}
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
                  <DropdownMenuItem
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className={cn(
                      "cursor-pointer flex items-center gap-2",
                      isRTL ? "flex-row" : "flex flex-row-reverse justify-end"
                    )}
                  >
                    {isRTL ? (
                      <>
                        <MessageCircle size={16} />
                        <span>{t("feedback")}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("feedback")}</span>
                        <MessageCircle size={16} />
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
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
      <ChangelogModal
        isOpen={isChangelogModalOpen}
        onClose={() => setIsChangelogModalOpen(false)}
        highlightVersion={currentVersion}
      />
    </motion.div>
  );
};
