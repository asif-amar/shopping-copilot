import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, Settings2, Zap, Shield, Target } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

type AIStyle = "flexible" | "balanced" | "strict";

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const { language, isRTL, t } = useLanguage();
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [aiStyle, setAIStyle] = useState<AIStyle>("balanced");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const message = inputText.trim();
    setInputText("");
    await onSendMessage(message);
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
          label: "Flexible",
          description: "AI will make smart choices for you",
          color: "text-green-600",
        };
      case "balanced":
        return {
          icon: Target,
          label: "Balanced",
          description: "AI will ask when unsure",
          color: "text-blue-600",
        };
      case "strict":
        return {
          icon: Shield,
          label: "Strict",
          description: "AI will always ask for clarification",
          color: "text-orange-600",
        };
    }
  };

  const currentStyleConfig = getAIStyleConfig(aiStyle);

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
            {/* Preferences button - left side */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors flex items-center justify-center text-slate-600 hover:text-slate-700"
                  title="Preferences"
                >
                  <Settings2 size={14} />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-white border border-slate-200 shadow-lg"
                side="top"
                sideOffset={8}
              >
                <DropdownMenuLabel className="text-slate-700 font-medium">
                  Preferences
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* AI Style submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <currentStyleConfig.icon
                      size={14}
                      className={currentStyleConfig.color}
                    />
                    <span>AI Style</span>
                    <span className="ml-auto text-xs text-slate-500">
                      {currentStyleConfig.label}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 bg-white border border-slate-200 shadow-lg">
                    <DropdownMenuLabel className="text-slate-700 font-medium">
                      AI Behavior Style
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={aiStyle}
                      onValueChange={(value) => setAIStyle(value as AIStyle)}
                    >
                      <DropdownMenuRadioItem
                        value="flexible"
                        className="flex flex-col items-start gap-1 py-3 px-3 cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-green-600" />
                          <span className="font-medium text-slate-700">
                            Flexible
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          AI will make smart choices for you (e.g., "add milk" →
                          adds popular milk)
                        </p>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="balanced"
                        className="flex flex-col items-start gap-1 py-3 px-3 cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-blue-600" />
                          <span className="font-medium text-slate-700">
                            Balanced
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          AI will ask when unsure about your preferences
                        </p>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="strict"
                        className="flex flex-col items-start gap-1 py-3 px-3 cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-orange-600" />
                          <span className="font-medium text-slate-700">
                            Strict
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          AI will always ask for clarification before taking
                          action
                        </p>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Future preferences can be added here */}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Send button - right side */}
            <motion.button
              type="submit"
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
              className={cn(
                "w-8 h-8 rounded-full border-none transition-all duration-200 flex items-center justify-center shrink-0",
                canSend
                  ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-sm"
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

        {/* AI Style indicator (subtle) */}
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-xs text-slate-500",
            isRTL ? "justify-end" : "justify-start"
          )}
        >
          <currentStyleConfig.icon
            size={12}
            className={currentStyleConfig.color}
          />
          <span>AI Style: {currentStyleConfig.label}</span>
        </div>
      </motion.form>
    </div>
  );
};
