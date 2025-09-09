import React, { useState } from "react";
import {
  User,
  Bot,
  Palette,
  Shield,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useUser } from "../hooks/useUser";
import { Dialog, DialogContent } from "./ui/Dialog";
import { cn } from "../lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "account" | "ai-settings" | "appearance" | "security";

interface TabConfig {
  id: SettingsTab;
  icon: React.ComponentType<any>;
  labelEn: string;
  labelHe: string;
}

const tabs: TabConfig[] = [
  { id: "account", icon: User, labelEn: "Account", labelHe: "חשבון" },
  {
    id: "ai-settings",
    icon: Bot,
    labelEn: "AI Settings",
    labelHe: "הגדרות AI",
  },
  { id: "appearance", icon: Palette, labelEn: "Appearance", labelHe: "מראה" },
  { id: "security", icon: Shield, labelEn: "Security", labelHe: "אבטחה" },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { language, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const getTabLabel = (tab: TabConfig) => {
    return language === "he" ? tab.labelHe : tab.labelEn;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountTab language={language} />;
      case "ai-settings":
        return <AISettingsTab language={language} />;
      case "appearance":
        return <AppearanceTab language={language} />;
      case "security":
        return <SecurityTab language={language} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl w-full rounded-2xl h-[600px] p-0 gap-0"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
        showCloseButton={false}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <div
            className={cn(
              "flex flex-col bg-slate-50 border-r border-slate-200",
              sidebarCollapsed ? "w-16" : "w-48",
              isRTL
                ? "border-l border-r-0 rounded-r-2xl"
                : "border-r border-l-0 rounded-l-2xl"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <h2 className="text-lg font-semibold text-slate-800">
                    {language === "he" ? "הגדרות" : "Settings"}
                  </h2>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {sidebarCollapsed ? (
                    isRTL ? (
                      <ChevronLeft size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )
                  ) : isRTL ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronLeft size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1",
                      isActive
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
                      isRTL ? "flex flex-row text-right" : "flex-row text-left",
                      sidebarCollapsed ? "justify-center px-2" : ""
                    )}
                    title={sidebarCollapsed ? getTabLabel(tab) : undefined}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span>{getTabLabel(tab)}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Close button */}
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className={cn(
                  "cursor-pointer w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all",
                  sidebarCollapsed ? "px-2" : ""
                )}
                title={
                  sidebarCollapsed
                    ? language === "he"
                      ? "סגור"
                      : "Close"
                    : undefined
                }
              >
                {!sidebarCollapsed && (language === "he" ? "סגור" : "Close")}
                {sidebarCollapsed && "✕"}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Account Tab Component
function AccountTab({ language }: { language: string }) {
  const { user, loading, error, updating, updateProfile } = useUser();
  const { isRTL } = useLanguage();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [nameError, setNameError] = useState("");

  // Initialize edited name when user data loads
  React.useEffect(() => {
    if (user) {
      setEditedName(user.full_name || "");
    }
  }, [user]);

  const handleEditName = () => {
    setIsEditingName(true);
    setNameError("");
    setEditedName(user?.full_name || "");
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNameError("");
    setEditedName(user?.full_name || "");
  };

  const handleSaveName = async () => {
    if (!user) return;

    const trimmedName = editedName.trim();

    // Validate name
    if (trimmedName.length === 0) {
      setNameError(
        language === "he"
          ? "שם מלא לא יכול להיות ריק"
          : "Full name cannot be empty"
      );
      return;
    }

    if (trimmedName.length > 255) {
      setNameError(
        language === "he" ? "שם מלא ארוך מדי" : "Full name is too long"
      );
      return;
    }

    try {
      await updateProfile({ full_name: trimmedName });
      setIsEditingName(false);
      setNameError("");
    } catch (error) {
      setNameError(
        language === "he" ? "שגיאה בעדכון השם" : "Error updating name"
      );
    }
  };

  // Handle key press in name input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  if (loading && !user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={20} className="animate-spin" />
          <span>{language === "he" ? "טוען..." : "Loading..."}</span>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 bg-red-50 rounded-lg p-4">
          <p className="font-medium mb-2">
            {language === "he"
              ? "שגיאה בטעינת פרטי החשבון"
              : "Error loading account details"}
          </p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-slate-600">
        {language === "he" ? "לא נמצאו פרטי משתמש" : "No user data found"}
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return language === "he" ? "לא זמין" : "Not available";
    return new Date(dateString).toLocaleDateString(
      language === "he" ? "he-IL" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="p-6" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {language === "he" ? "חשבון" : "Account"}
        </h1>
        <p className="text-slate-600">
          {language === "he"
            ? "נהל את מידע החשבון שלך"
            : "Manage your account information"}
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {language === "he" ? "פרופיל" : "Profile"}
          </h3>
          <div className="p-4 bg-slate-50 rounded-lg">
            {/* Profile Picture and Basic Info */}
            <div
              className={cn(
                "flex items-center gap-4 mb-4",
                isRTL ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className="relative">
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling!.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={cn(
                    "w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center",
                    user.profile_picture_url ? "hidden" : ""
                  )}
                >
                  <User size={28} color="white" />
                </div>
              </div>

              <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                <div className="text-lg font-semibold text-slate-800">
                  {user.full_name || user.email}
                </div>
                <div className="text-sm text-slate-600">{user.email}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {language === "he" ? "חבר מאז" : "Member since"}{" "}
                  {formatDate(user.created_at)}
                </div>
              </div>
            </div>

            {/* Full Name Edit Section */}
            <div className="border-t border-slate-200 pt-4">
              <div
                className={cn(
                  "flex flex-row items-center justify-between mb-3"
                )}
              >
                <label className="text-sm font-medium text-slate-700">
                  {language === "he" ? "שם מלא" : "Full name"}
                </label>
                {!isEditingName && (
                  <button
                    onClick={handleEditName}
                    disabled={updating}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {isRTL ? (
                      <>
                        <span>{language === "he" ? "ערוך" : "Edit"}</span>
                        <Edit3 size={14} />
                      </>
                    ) : (
                      <>
                        <Edit3 size={14} />
                        <span>{language === "he" ? "ערוך" : "Edit"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className={cn(
                      "w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      isRTL ? "text-right" : "text-left"
                    )}
                    placeholder={
                      language === "he" ? "הזן שם מלא" : "Enter full name"
                    }
                    disabled={updating}
                    autoFocus
                  />

                  {nameError && (
                    <div className="text-sm text-red-600">{nameError}</div>
                  )}

                  <div
                    className={cn(
                      "flex gap-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <button
                      onClick={handleSaveName}
                      disabled={
                        updating || editedName.trim() === (user.full_name || "")
                      }
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {updating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>
                            {language === "he" ? "שומר..." : "Saving..."}
                          </span>
                        </>
                      ) : isRTL ? (
                        <>
                          <span>{language === "he" ? "שמור" : "Save"}</span>
                          <Check size={14} />
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{language === "he" ? "שמור" : "Save"}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCancelEdit}
                      disabled={updating}
                      className={cn(
                        "cursor-pointer  flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {isRTL ? (
                        <>
                          <span>{language === "he" ? "בטל" : "Cancel"}</span>
                          <X size={14} />
                        </>
                      ) : (
                        <>
                          <X size={14} />
                          <span>{language === "he" ? "בטל" : "Cancel"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "text-slate-800 font-medium",
                    !user.full_name ? "text-slate-500 italic" : ""
                  )}
                >
                  {user.full_name ||
                    (language === "he"
                      ? "לא הוגדר שם מלא"
                      : "No full name set")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Settings Tab Component
function AISettingsTab({ language }: { language: string }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {language === "he" ? "הגדרות AI" : "AI Settings"}
        </h1>
        <p className="text-slate-600">
          {language === "he"
            ? "התאם את התנהגות העוזר הדיגיטלי"
            : "Customize your AI assistant behavior"}
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center text-muted-foreground">
          {language === "he"
            ? "הגדרות AI יהיו זמינות בקרוב"
            : "AI settings will be available soon"}
        </div>
      </div>
    </div>
  );
}

// Appearance Tab Component
function AppearanceTab({ language }: { language: string }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {language === "he" ? "מראה" : "Appearance"}
        </h1>
        <p className="text-slate-600">
          {language === "he"
            ? "התאם את מראה הממשק"
            : "Customize the interface appearance"}
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center text-muted-foreground">
          {language === "he"
            ? "הגדרות מראה יהיו זמינות בקרוב"
            : "Appearance settings will be available soon"}
        </div>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab({ language }: { language: string }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {language === "he" ? "אבטחה" : "Security"}
        </h1>
        <p className="text-slate-600">
          {language === "he"
            ? "נהל את העדפות האבטחה שלך"
            : "Manage your security preferences"}
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center text-muted-foreground">
          {language === "he"
            ? "הגדרות אבטחה יהיו זמינות בקרוב"
            : "Security settings will be available soon"}
        </div>
      </div>
    </div>
  );
}
