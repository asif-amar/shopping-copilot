import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
}) => {
  const { language } = useLanguage();

  const defaultConfirmText = confirmText || (language === "he" ? "מחק" : "Delete");
  const defaultCancelText = cancelText || (language === "he" ? "ביטול" : "Cancel");

  const variantStyles = {
    danger: {
      iconColor: "#ef4444",
      confirmBg: "#ef4444",
      confirmHoverBg: "#dc2626",
    },
    warning: {
      iconColor: "#f59e0b",
      confirmBg: "#f59e0b",
      confirmHoverBg: "#d97706",
    },
    info: {
      iconColor: "#3b82f6",
      confirmBg: "#3b82f6",
      confirmHoverBg: "#2563eb",
    },
  };

  const currentStyle = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "24px",
                maxWidth: "400px",
                width: "100%",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                position: "relative",
                direction: language === "he" ? "rtl" : "ltr",
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isLoading}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: language === "he" ? "auto" : "16px",
                  left: language === "he" ? "16px" : "auto",
                  background: "none",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  color: "#6b7280",
                  transition: "all 0.2s ease",
                  opacity: isLoading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                <X size={20} />
              </button>

              {/* Icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: `${currentStyle.iconColor}15`,
                  margin: "0 auto 16px auto",
                }}
              >
                <AlertTriangle size={24} color={currentStyle.iconColor} />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  textAlign: "center",
                  margin: "0 0 12px 0",
                }}
              >
                {title}
              </h3>

              {/* Message */}
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  textAlign: "center",
                  margin: "0 0 24px 0",
                  lineHeight: "1.5",
                }}
              >
                {message}
              </p>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexDirection: language === "he" ? "row-reverse" : "row",
                }}
              >
                {/* Cancel Button */}
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                      e.currentTarget.style.borderColor = "#9ca3af";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }
                  }}
                >
                  {defaultCancelText}
                </button>

                {/* Confirm Button */}
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "white",
                    backgroundColor: currentStyle.confirmBg,
                    border: "none",
                    borderRadius: "8px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = currentStyle.confirmHoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = currentStyle.confirmBg;
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                        }}
                      />
                      {language === "he" ? "מוחק..." : "Deleting..."}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {defaultConfirmText}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};