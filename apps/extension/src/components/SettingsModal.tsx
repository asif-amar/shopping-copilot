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
  Calendar,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useUser } from "../hooks/useUser";
import { useCredits } from "../hooks/useCredits";
import { usePreferences } from "../hooks/usePreferences";
import { UserPreferencesData } from "../services/api";
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
        className="max-w-3xl w-full rounded-2xl max-h-[85vh] h-auto p-0 gap-0"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
        showCloseButton={false}
      >
        <div className="flex h-full min-h-[500px] max-h-[85vh]">
          {/* Sidebar */}
          <div
            className={cn(
              "flex flex-col bg-muted/50 border-r border-border",
              sidebarCollapsed ? "w-16" : "w-48",
              isRTL
                ? "border-l border-r-0 rounded-r-2xl"
                : "border-r border-l-0 rounded-l-2xl"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <h2 className="text-lg font-semibold text-foreground">
                    {language === "he" ? "הגדרות" : "Settings"}
                  </h2>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
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
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
            <div className="p-4 border-t border-border">
              <button
                onClick={onClose}
                className={cn(
                  "cursor-pointer w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all",
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
  const {
    creditStatus,
    loading: creditsLoading,
    refreshCredits,
  } = useCredits();
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
        <div className="text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
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
    <div className="p-6 pb-8" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {language === "he" ? "חשבון" : "Account"}
        </h1>
        <p className="text-muted-foreground">
          {language === "he"
            ? "נהל את מידע החשבון שלך"
            : "Manage your account information"}
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {language === "he" ? "פרופיל" : "Profile"}
          </h3>
          <div className="p-4 bg-muted/50 rounded-lg">
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
                    "w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center",
                    user.profile_picture_url ? "hidden" : ""
                  )}
                >
                  <User size={28} color="white" />
                </div>
              </div>

              <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                <div className="text-lg font-semibold text-foreground">
                  {user.full_name || user.email}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {language === "he" ? "חבר מאז" : "Member since"}{" "}
                  {formatDate(user.created_at)}
                </div>
              </div>
            </div>

            {/* Full Name Edit Section */}
            <div className="border-t border-border pt-4">
              <div
                className={cn(
                  "flex flex-row items-center justify-between mb-3"
                )}
              >
                <label className="text-sm font-medium text-foreground">
                  {language === "he" ? "שם מלא" : "Full name"}
                </label>
                {!isEditingName && (
                  <button
                    onClick={handleEditName}
                    disabled={updating}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors cursor-pointer",
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
                      "w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
                      isRTL ? "text-right" : "text-left"
                    )}
                    placeholder={
                      language === "he" ? "הזן שם מלא" : "Enter full name"
                    }
                    disabled={updating}
                    autoFocus
                  />

                  {nameError && (
                    <div className="text-sm text-red-600 dark:text-red-400">{nameError}</div>
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
                        "flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer",
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
                        "cursor-pointer  flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
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
                    "text-foreground font-medium",
                    !user.full_name ? "text-muted-foreground italic" : ""
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

        {/* Credits Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {language === "he" ? "קרדיטים" : "Credits"}
          </h3>
          <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
            {creditsLoading ? (
              <div className="flex items-center gap-3 text-slate-600 justify-center py-4">
                <Loader2 size={20} className="animate-spin" />
                <span>{language === "he" ? "טוען..." : "Loading..."}</span>
              </div>
            ) : creditStatus ? (
              <div className="space-y-6">
                {/* Main Credits Display */}
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-foreground">
                    {creditStatus.credits_remaining}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === "he" ? "קרדיטים נותרו" : "Credits remaining"}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-secondary rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (creditStatus.credits_remaining / creditStatus.credits_total_monthly) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {creditStatus.credits_remaining}{" "}
                      {language === "he" ? "מתוך" : "of"}{" "}
                      {creditStatus.credits_total_monthly}{" "}
                      {language === "he" ? "בחודש" : "per month"}
                    </div>
                  </div>
                </div>

                {/* Reset Date */}
                {creditStatus.credits_reset_date && (
                  <div className="text-center py-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                      <Calendar size={16} />
                      <span className="text-sm">
                        {language === "he" ? "הקרדיטים יתחדשו ב-" : "Resets on"}{" "}
                        {new Date(
                          creditStatus.credits_reset_date
                        ).toLocaleDateString(
                          language === "he" ? "he-IL" : "en-US",
                          { month: "long", day: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {creditStatus.credits_exhausted && (
                  <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-800 font-medium text-sm">
                      {language === "he"
                        ? "הקרדיטים אזלו"
                        : "Credits exhausted"}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-600 py-4">
                <div className="text-sm mb-2">
                  {language === "he"
                    ? "לא ניתן לטעון מידע קרדיטים"
                    : "Unable to load credits information"}
                </div>
                <button
                  onClick={refreshCredits}
                  className="text-purple-600 hover:text-purple-700 text-xs cursor-pointer"
                >
                  {language === "he" ? "נסה שוב" : "Try again"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Settings Tab Component
function AISettingsTab({ language }: { language: string }) {
  const { isRTL, t } = useLanguage();
  const { preferences, loading, error, updating, updatePreferences } =
    usePreferences();
  const [showSuccess, setShowSuccess] = useState(false);


  const handlePreferenceUpdate = async (
    updates: Partial<UserPreferencesData>
  ) => {
    if (!preferences) return;

    try {
      await updatePreferences(updates);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update preferences:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={20} className="animate-spin" />
          <span>{language === "he" ? "טוען..." : "Loading..."}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="font-medium mb-2">
            {language === "he"
              ? "שגיאה בטעינת העדפות"
              : "Error loading preferences"}
          </p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-8" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("settings_preferences")}
        </h1>
        <p className="text-muted-foreground">{t("settings_preferences_desc")}</p>

        {showSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {t("settings_preferences_saved")}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Household Size */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("settings_household_size")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: "small", label: t("onboarding_household_1_2") },
              { value: "medium", label: t("onboarding_household_3_4") },
              { value: "large", label: t("onboarding_household_5_plus") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  handlePreferenceUpdate({ household_size: option.value })
                }
                disabled={updating}
                className={cn(
                  "p-3 rounded-lg border transition-colors text-center",
                  preferences?.household_size === option.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-border hover:border-ring hover:bg-accent/30"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Budget Preference */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("settings_budget_preference")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: "budget",
                label: t("onboarding_budget_conscious"),
                desc: t("onboarding_budget_conscious_desc"),
              },
              {
                value: "moderate",
                label: t("onboarding_moderate"),
                desc: t("onboarding_moderate_desc"),
              },
              {
                value: "premium",
                label: t("onboarding_premium"),
                desc: t("onboarding_premium_desc"),
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  handlePreferenceUpdate({ budget_preference: option.value })
                }
                disabled={updating}
                className={cn(
                  "p-3 rounded-lg border transition-colors text-left",
                  isRTL && "text-right",
                  preferences?.budget_preference === option.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-border hover:border-ring hover:bg-accent/30"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="text-sm font-medium mb-1">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Shopping Frequency */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("settings_shopping_frequency")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: "daily", label: t("onboarding_daily") },
              { value: "weekly", label: t("onboarding_weekly") },
              { value: "monthly", label: t("onboarding_monthly") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  handlePreferenceUpdate({ shopping_frequency: option.value })
                }
                disabled={updating}
                className={cn(
                  "p-3 rounded-lg border transition-colors text-center",
                  preferences?.shopping_frequency === option.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-border hover:border-ring hover:bg-accent/30"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Sites */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("settings_preferred_sites")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { value: "rami-levy", label: t("onboarding_rami_levy") },
              { value: "shufersal", label: t("onboarding_shufersal") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const current = preferences?.primary_sites || [];
                  const updated = current.includes(option.value)
                    ? current.filter((item) => item !== option.value)
                    : [...current, option.value];
                  handlePreferenceUpdate({ primary_sites: updated });
                }}
                disabled={updating}
                className={cn(
                  "p-3 rounded-lg border transition-colors text-center",
                  (preferences?.primary_sites || []).includes(option.value)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-border hover:border-ring hover:bg-accent/30"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>

          {/* Custom Site Input */}
          {/* <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customSiteInput}
                onChange={(e) => setCustomSiteInput(e.target.value)}
                placeholder={t("onboarding_other_placeholder")}
                className={cn(
                  "flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomSiteAdd();
                  }
                }}
              />
              <button
                onClick={handleCustomSiteAdd}
                disabled={!customSiteInput.trim() || updating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {t("onboarding_other")}
              </button>
            </div>
            
            {(preferences?.primary_sites || []).filter(site => site.startsWith('custom:')).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(preferences?.primary_sites || [])
                  .filter(site => site.startsWith('custom:'))
                  .map((site) => {
                    const siteName = site.replace('custom:', '');
                    return (
                      <span
                        key={site}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-500 rounded-md text-xs"
                      >
                        <span dir={isRTL ? "rtl" : "ltr"}>{siteName}</span>
                        <button
                          onClick={() => {
                            const current = preferences?.primary_sites || [];
                            handlePreferenceUpdate({
                              primary_sites: current.filter(item => item !== site)
                            });
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                }
              </div>
            )}
          </div> */}
        </div>

        {/* Dietary Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("settings_dietary_preferences")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { value: "kosher", label: t("onboarding_kosher") },
              { value: "vegan", label: t("onboarding_vegan") },
              { value: "vegetarian", label: t("onboarding_vegetarian") },
              { value: "gluten-free", label: t("onboarding_gluten_free") },
              { value: "dairy-free", label: t("onboarding_dairy_free") },
              { value: "organic", label: t("onboarding_organic") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const current = preferences?.dietary_restrictions || [];
                  const updated = current.includes(option.value)
                    ? current.filter((item) => item !== option.value)
                    : [...current, option.value];
                  handlePreferenceUpdate({ dietary_restrictions: updated });
                }}
                disabled={updating}
                className={cn(
                  "p-2 rounded-lg border text-sm transition-colors",
                  isRTL ? "text-right" : "text-left",
                  (preferences?.dietary_restrictions || []).includes(
                    option.value
                  )
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-border hover:border-ring hover:bg-accent/30"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                {option.label}
              </button>
            ))}
          </div>
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
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {language === "he" ? "מראה" : "Appearance"}
        </h1>
        <p className="text-muted-foreground">
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
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {language === "he" ? "אבטחה" : "Security"}
        </h1>
        <p className="text-muted-foreground">
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
