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
} from "./ui/Dialog";
import { GoogleSignInButton } from "./ui/GoogleSignInButton";
import { LegalModal } from "./LegalModal";
import { cn } from "../lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const { t, isRTL } = useLanguage();
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [legalModalType, setLegalModalType] = React.useState<
    "terms" | "privacy" | null
  >(null);

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
        className={cn(isRTL ? "text-right" : "text-left")}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <DialogHeader>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={32} color="white" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center"
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
          className="flex flex-col gap-4 mb-6"
          style={{ direction: isRTL ? "rtl" : "ltr" }}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <div
            className={cn(
              "flex items-center gap-4 w-full",
              isRTL
                ? "flex-row-reverse text-right justify-end"
                : "flex-row text-left justify-start"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0",
                isRTL ? "order-2" : "order-1"
              )}
            />
            <span
              className={cn(
                "text-sm text-muted-foreground leading-relaxed flex-1",
                isRTL ? "order-1" : "order-2"
              )}
            >
              {t("auth_feature_personalized")}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-4 w-full",
              isRTL
                ? "flex-row-reverse text-right justify-end"
                : "flex-row text-left justify-start"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 bg-blue-500 rounded-full flex-shrink-0",
                isRTL ? "order-2" : "order-1"
              )}
            />
            <span
              className={cn(
                "text-sm text-muted-foreground leading-relaxed flex-1",
                isRTL ? "order-1" : "order-2"
              )}
            >
              {t("auth_feature_history")}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-4 w-full",
              isRTL
                ? "flex-row-reverse text-right justify-end"
                : "flex-row text-left justify-start"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0",
                isRTL ? "order-2" : "order-1"
              )}
            />
            <span
              className={cn(
                "text-sm text-muted-foreground leading-relaxed flex-1",
                isRTL ? "order-1" : "order-2"
              )}
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
          className="text-center"
        >
          <GoogleSignInButton
            onClick={handleSignIn}
            disabled={isSigningIn}
            loading={isSigningIn}
          >
            {isSigningIn ? t("auth_signing_in") : t("auth_sign_in_google")}
          </GoogleSignInButton>
        </motion.div>

        {/* Terms Agreement */}
        <motion.div
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={5}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground leading-relaxed m-0 mb-2">
            {t("auth_agree_terms")}{" "}
            <button
              onClick={() => setLegalModalType("terms")}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {t("auth_terms_of_use")}
            </button>{" "}
            {t("auth_and")}{" "}
            <button
              onClick={() => setLegalModalType("privacy")}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {t("auth_privacy_policy")}
            </button>
          </p>

          <p className="text-xs text-muted-foreground text-center leading-relaxed m-0">
            {/* {t("auth_privacy_note")} */}
            {t("auth_beta_notice")}
          </p>
        </motion.div>
      </DialogContent>

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModalType !== null}
        onClose={() => setLegalModalType(null)}
        type={legalModalType}
      />
    </Dialog>
  );
}
