import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const { language, isRTL, t } = useLanguage();
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

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

  useEffect(() => {
    console.log("CHATINPUT: language", language);
    console.log("CHATINPUT: isRTL", isRTL);
  }, [language, isRTL]);

  return (
    <div
      style={{
        padding: "16px 20px",
        background: "#ffffff",
        borderTop: "1px solid #f1f5f9",
        flexShrink: 0,
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "relative",
          background: "#f8fafc",
          borderRadius: "20px",
          border: isFocused ? "1px solid #e2e8f0" : "1px solid #f1f5f9",
          transition: "all 0.2s ease",
          boxShadow: isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.1)" : "none",
        }}
      >
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t("type_message")}
          disabled={isLoading}
          style={{
            width: "100%",
            minHeight: "44px",
            maxHeight: "120px",
            padding: isRTL ? "12px 16px 12px 52px" : "12px 52px 12px 16px",
            border: "none",
            borderRadius: "20px",
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            background: "transparent",
            color: "#334155",
            lineHeight: "1.4",
            boxSizing: "border-box",
            direction: isRTL ? "rtl" : "ltr",
            textAlign: isRTL ? "right" : "left",
          }}
        />

        <motion.button
          type="submit"
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.02 } : {}}
          whileTap={canSend ? { scale: 0.98 } : {}}
          style={{
            position: "absolute",
            [isRTL ? "left" : "right"]: "6px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            background: canSend ? "#3b82f6" : "#cbd5e1",
            color: "white",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
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
            <Send size={14} />
          )}
        </motion.button>
      </motion.form>
    </div>
  );
};
