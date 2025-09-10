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
import { cn } from "@/lib/utils";
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
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const { isRTL, t } = useLanguage();
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const message = inputText.trim();
    setInputText("");
    await onSendMessage(message, preferences);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const canSend = inputText.trim() && !isLoading;

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
          color: "text-blue-600",
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
      className="p-4 bg-white border-t border-slate-200 shrink-0"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
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
            placeholder={t("type_message")}
            disabled={isLoading}
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
                  <Hint text={t("preferences") || "Preferences"}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors flex items-center justify-center text-slate-600 hover:text-slate-700"
                    >
                      <Settings2 size={14} />
                    </motion.button>
                  </Hint>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isRTL ? "end" : "start"}
                  className="w-56 bg-white border border-slate-200 shadow-lg max-h-[80vh] overflow-y-auto"
                  side="top"
                  sideOffset={8}
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                  avoidCollisions={true}
                  collisionPadding={8}
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
                      className="w-72 max-w-[90vw] bg-white border border-slate-200 shadow-lg max-h-[70vh] overflow-y-auto"
                      style={{ direction: isRTL ? "rtl" : "ltr" }}
                      avoidCollisions={true}
                      collisionPadding={8}
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
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Target size={14} className="text-blue-600" />
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
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              )}
              title={canSend ? t("send_message") : t("type_message")}
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
