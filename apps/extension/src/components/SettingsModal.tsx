import React, { useState } from "react";
import {
  User,
  Bot,
  Palette,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
                  className="p-1 rounded-md hover:bg-slate-200 transition-colors"
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
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1",
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
                  "w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all",
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
  return (
    <div className="p-6">
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
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={24} color="white" />
            </div>
            <div>
              <div className="font-medium text-slate-800">
                {language === "he" ? "משתמש" : "User"}
              </div>
              <div className="text-sm text-slate-600">user@example.com</div>
            </div>
          </div>
        </div>

        {/* Email Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {language === "he" ? "כתובות אימייל" : "Email addresses"}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <div className="font-medium">user@example.com</div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  {language === "he" ? "ראשי" : "Primary"}
                </span>
              </div>
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
