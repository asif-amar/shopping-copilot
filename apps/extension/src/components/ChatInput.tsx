import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  Loader2,
  Settings2,
  Zap,
  Shield,
  Target,
  X,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";
import { CreditWarningBanner } from "./CreditWarningBanner";
import { isShoppingSite } from "@/services/websiteContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPreferences,
  AIStyle,
  DEFAULT_PREFERENCES,
} from "@/types/preferences";
import { Hint } from "./ui/hint";

interface ChatInputProps {
  onSendMessage: (
    message: string,
    preferences?: UserPreferences
  ) => Promise<void>;
  isLoading: boolean;
  currentHostname: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  currentHostname,
}) => {
  const { isRTL, t } = useLanguage();
  const { creditStatus, refreshCredits } = useCredits();
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [showCreditWarning, setShowCreditWarning] = useState(true);
  
  const isSupported = isShoppingSite(currentHostname);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !isSupported) return;
    
    // Check if credits are exhausted
    if (creditStatus?.credits_exhausted) {
      return; // Don't send message if no credits
    }

    const message = inputText.trim();
    setInputText("");
    await onSendMessage(message, preferences);
    
    // Refresh credits after sending message
    await refreshCredits();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const canSend = inputText.trim() && !isLoading && !creditStatus?.credits_exhausted && isSupported;

  const getAIStyleConfig = (style: AIStyle) => {
    switch (style) {
      case "flexible":
        return {
          icon: Zap,
          label: t("flexible"),
          description: t("flexible_desc"),
          color: "text-green-600",
        };
      case "balanced":
        return {
          icon: Target,
          label: t("balanced"),
          description: t("balanced_desc"),
          color: "text-purple-600",
        };
      case "strict":
        return {
          icon: Shield,
          label: t("strict"),
          description: t("strict_desc"),
          color: "text-orange-600",
        };
    }
  };

  const currentStyleConfig = getAIStyleConfig(preferences.aiStyle);

  const handleRemoveStyleTag = () => {
    setPreferences({ ...preferences, aiStyle: "balanced" });
  };

  return (
    <div
      className="p-3 bg-white border-t border-slate-200 shrink-0"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      {/* Credit Warning Banner */}
      {creditStatus && showCreditWarning && (
        <CreditWarningBanner
          creditsRemaining={creditStatus.credits_remaining}
          isLowCredits={creditStatus.is_low_credits}
          creditsExhausted={creditStatus.credits_exhausted}
          resetDate={creditStatus.credits_reset_date}
          onClose={() => setShowCreditWarning(false)}
        />
      )}
      
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {/* Main input container */}
        <div
          className={cn(
            "relative bg-slate-50 rounded-xl border transition-all duration-200 pb-12",
            isFocused ? "border-slate-300" : "border-slate-200"
          )}
        >
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              !isSupported
                ? (isRTL ? "אתר לא נתמך - חזור לאתר קניות נתמך" : "Unsupported site - navigate to a supported shopping site")
                : creditStatus?.credits_exhausted 
                  ? (isRTL ? "הקרדיטים אזלו - לא ניתן לשלוח הודעות" : "Credits exhausted - cannot send messages")
                  : t("type_message")
            }
            disabled={isLoading || creditStatus?.credits_exhausted || !isSupported}
            className={cn(
              "w-full min-h-[20px] max-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-3 pb-4 ring-0 border-none rounded-xl text-sm resize-none outline-none bg-transparent text-slate-700 leading-5 box-border placeholder:text-slate-400",
              isRTL ? "text-right" : "text-left"
            )}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
          />

          {/* Bottom buttons container */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex flex-row gap-2">
              {/* Preferences button - left side */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    type="button"
                    disabled={!isSupported}
                    whileHover={isSupported ? { scale: 1.05 } : {}}
                    whileTap={isSupported ? { scale: 0.95 } : {}}
                    className={cn(
                      "w-8 h-8 rounded-full transition-colors flex items-center justify-center",
                      isSupported
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <Hint
                      text={t("preferences") || "Preferences"}
                      sideOffset={5}
                    >
                      <Settings2 size={14} />
                    </Hint>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isRTL ? "end" : "start"}
                  className="w-56 bg-white border border-slate-200 shadow-lg max-h-[70vh] overflow-y-auto"
                  side="top"
                  sideOffset={12}
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                  avoidCollisions={true}
                  collisionPadding={16}
                  alignOffset={isRTL ? 8 : -8}
                >
                  <DropdownMenuLabel className="text-slate-700 font-medium">
                    {t("preferences")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* AI Style submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                      isRTL={isRTL}
                      className={cn("flex flex-row items-center gap-2")}
                      chevronClassName="size-4"
                    >
                      <currentStyleConfig.icon
                        size={14}
                        className={currentStyleConfig.color}
                      />
                      <span>{t("ai_style")}</span>
                      <span
                        className={cn(
                          "text-xs text-slate-500",
                          isRTL ? "mr-auto" : "ml-auto"
                        )}
                      >
                        {currentStyleConfig.label}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                      className="w-56 max-w-[80vw] bg-white border border-slate-200 shadow-lg max-h-[50vh] overflow-y-auto"
                      style={{ direction: isRTL ? "rtl" : "ltr" }}
                      avoidCollisions={true}
                      collisionPadding={12}
                      alignOffset={isRTL ? -80 : 80}
                      sideOffset={4}
                    >
                      <DropdownMenuLabel className="text-slate-700 font-medium">
                        {t("ai_behavior_style")}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="space-y-1">
                        {/* Flexible Option */}
                        <div
                          onClick={() =>
                            setPreferences({
                              ...preferences,
                              aiStyle: "flexible",
                            })
                          }
                          className={cn(
                            "flex flex-col items-start gap-1 py-3 px-3 rounded-md transition-colors cursor-pointer",
                            preferences.aiStyle === "flexible"
                              ? "bg-green-50"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-green-600" />
                            <span className="font-medium text-slate-700">
                              {t("flexible")}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-xs text-slate-500",
                              isRTL ? "mr-5 text-right" : "ml-5 text-left"
                            )}
                          >
                            {t("flexible_desc")}
                          </p>
                        </div>

                        {/* Balanced Option */}
                        <div
                          onClick={() =>
                            setPreferences({
                              ...preferences,
                              aiStyle: "balanced",
                            })
                          }
                          className={cn(
                            "flex flex-col items-start gap-1 py-3 px-3 rounded-md transition-colors cursor-pointer",
                            preferences.aiStyle === "balanced"
                              ? "bg-purple-50"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Target size={14} className="text-purple-600" />
                            <span className="font-medium text-slate-700">
                              {t("balanced")}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-xs text-slate-500",
                              isRTL ? "mr-5 text-right" : "ml-5 text-left"
                            )}
                          >
                            {t("balanced_desc")}
                          </p>
                        </div>

                        {/* Strict Option */}
                        <div
                          onClick={() =>
                            setPreferences({
                              ...preferences,
                              aiStyle: "strict",
                            })
                          }
                          className={cn(
                            "flex flex-col items-start gap-1 py-3 px-3 rounded-md transition-colors cursor-pointer",
                            preferences.aiStyle === "strict"
                              ? "bg-orange-50"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-orange-600" />
                            <span className="font-medium text-slate-700">
                              {t("strict")}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-xs text-slate-500",
                              isRTL ? "mr-5 text-right" : "ml-5 text-left"
                            )}
                          >
                            {t("strict_desc")}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {/* Future preferences can be added here */}
                </DropdownMenuContent>
              </DropdownMenu>
              {/* AI Style Tag - only show when not balanced */}
              {preferences.aiStyle !== "balanced" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors select-none",
                    preferences.aiStyle === "flexible" &&
                      "bg-green-100 text-green-700 border border-green-200",
                    preferences.aiStyle === "strict" &&
                      "bg-orange-100 text-orange-700 border border-orange-200"
                  )}
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                >
                  <currentStyleConfig.icon
                    size={12}
                    className={currentStyleConfig.color}
                  />
                  <span>{currentStyleConfig.label}</span>
                  <button
                    type="button"
                    onClick={handleRemoveStyleTag}
                    className={cn(
                      "rounded-full p-0.5 transition-colors",
                      preferences.aiStyle === "flexible" &&
                        "hover:bg-green-200",
                      preferences.aiStyle === "strict" && "hover:bg-orange-200",
                      isRTL ? "mr-0.5" : "ml-0.5"
                    )}
                    title={t("reset_to_balanced") || "Reset to balanced"}
                    aria-label="Remove AI style preference"
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Send button - right side */}
            <motion.button
              type="submit"
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
              className={cn(
                "w-8 h-8 rounded-full border-none transition-all duration-200 flex items-center justify-center shrink-0",
                canSend
                  ? "bg-purple-500 hover:bg-purple-600 text-white shadow-sm"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              )}
              title={
                !isSupported
                  ? (isRTL ? "אתר לא נתמך" : "Unsupported site")
                  : creditStatus?.credits_exhausted 
                    ? (isRTL ? "הקרדיטים אזלו" : "Credits exhausted")
                    : canSend 
                      ? t("send_message") 
                      : t("type_message")
              }
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={14} />
                </motion.div>
              ) : (
                <ArrowUp size={14} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.form>
    </div>
  );
};
