import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { ApiService } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/Dialog";
import { GoogleSignInButton } from "./ui/GoogleSignInButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const { t, isRTL } = useLanguage();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      await ApiService.signInWithGoogle();
      console.log("User signed in successfully from modal!");
      onAuthSuccess?.();
      onClose();
    } catch (error) {
      console.error("Sign-in failed:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 200,
        delay: 0.1,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.15 + i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        style={{
          direction: isRTL ? "rtl" : "ltr",
          textAlign: isRTL ? "right" : "left",
        }}
      >
        <DialogClose onClick={onClose} />

        <DialogHeader>
          {/* Icon */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              style={{ position: "relative" }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                  borderRadius: "var(--border-radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={32} color="white" />
              </div>
              <motion.div
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "24px",
                  height: "24px",
                  background:
                    "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <Sparkles size={12} color="white" />
              </motion.div>
            </motion.div>
          </div>

          <DialogTitle>
            <motion.span
              variants={textVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              {t("auth_modal_title")}
            </motion.span>
          </DialogTitle>

          <DialogDescription>
            <motion.span
              variants={textVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              {t("auth_modal_subtitle")}
            </motion.span>
          </DialogDescription>
        </DialogHeader>

        {/* Features */}
        <motion.div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-md)",
            marginBottom: "var(--spacing-xl)",
            direction: isRTL ? "rtl" : "ltr",
          }}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-md)",
              flexDirection: isRTL ? "row-reverse" : "row",
              width: "100%",
              textAlign: isRTL ? "right" : "left",
              direction: isRTL ? "rtl" : "ltr",
              justifyContent: isRTL ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#10b981",
                borderRadius: "50%",
                flexShrink: 0,
                order: isRTL ? 2 : 1,
              }}
            />
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--text-secondary)",
                lineHeight: "1.4",
                flex: 1,
                order: isRTL ? 1 : 2,
              }}
            >
              {t("auth_feature_personalized")}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-md)",
              flexDirection: isRTL ? "row-reverse" : "row",
              width: "100%",
              textAlign: isRTL ? "right" : "left",
              direction: isRTL ? "rtl" : "ltr",
              justifyContent: isRTL ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#3b82f6",
                borderRadius: "50%",
                flexShrink: 0,
                order: isRTL ? 2 : 1,
              }}
            />
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--text-secondary)",
                lineHeight: "1.4",
                flex: 1,
                order: isRTL ? 1 : 2,
              }}
            >
              {t("auth_feature_history")}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-md)",
              flexDirection: isRTL ? "row-reverse" : "row",
              width: "100%",
              textAlign: isRTL ? "right" : "left",
              direction: isRTL ? "rtl" : "ltr",
              justifyContent: isRTL ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#6366f1",
                borderRadius: "50%",
                flexShrink: 0,
                order: isRTL ? 2 : 1,
              }}
            />
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--text-secondary)",
                lineHeight: "1.4",
                flex: 1,
                order: isRTL ? 1 : 2,
              }}
            >
              {t("auth_feature_secure")}
            </span>
          </div>
        </motion.div>

        {/* Sign In Button */}
        <motion.div
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={3}
          style={{ marginBottom: "var(--spacing-md)" }}
        >
          <GoogleSignInButton
            onClick={handleSignIn}
            disabled={isSigningIn}
            loading={isSigningIn}
          >
            {isSigningIn ? t("auth_signing_in") : t("auth_sign_in_google")}
          </GoogleSignInButton>
        </motion.div>

        {/* Privacy Note */}
        <motion.p
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={4}
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: "1.4",
            margin: "0",
          }}
        >
          {t("auth_privacy_note")}
        </motion.p>
      </DialogContent>
    </Dialog>
  );
}
