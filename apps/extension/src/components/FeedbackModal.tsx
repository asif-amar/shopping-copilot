import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import { ApiService } from "@/services/api";
import { cn } from "@/lib/utils";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = "bug" | "feature" | "general" | "improvement";
type SubmissionState = "idle" | "submitting" | "success" | "error";

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, isRTL, t } = useLanguage();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [validationErrors, setValidationErrors] = useState<{
    subject?: string;
    message?: string;
  }>({});

  const feedbackTypes = [
    { value: "bug", label: t("feedback_type_bug") },
    { value: "feature", label: t("feedback_type_feature") },
    { value: "general", label: t("feedback_type_general") },
    { value: "improvement", label: t("feedback_type_improvement") },
  ];

  const resetForm = () => {
    setFeedbackType("general");
    setSubject("");
    setMessage("");
    setSubmissionState("idle");
    setValidationErrors({});
  };

  const validateField = (field: "subject" | "message", value: string) => {
    const trimmedValue = value.trim();
    const errors: { subject?: string; message?: string } = { ...validationErrors };

    if (field === "subject") {
      if (trimmedValue.length < 3) {
        errors.subject = t("validation_subject_min");
      } else if (trimmedValue.length > 255) {
        errors.subject = t("validation_subject_max");
      } else {
        delete errors.subject;
      }
    }

    if (field === "message") {
      if (trimmedValue.length < 5) {
        errors.message = t("validation_message_min");
      } else if (trimmedValue.length > 2000) {
        errors.message = t("validation_message_max");
      } else {
        delete errors.message;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    const subjectValid = validateField("subject", subject);
    const messageValid = validateField("message", message);

    if (!subjectValid || !messageValid) {
      return;
    }

    setSubmissionState("submitting");

    try {
      await ApiService.submitFeedback({
        type: feedbackType,
        subject: subject.trim(),
        message: message.trim(),
      });

      setSubmissionState("success");

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setSubmissionState("error");
    }
  };

  const isSubmitting = submissionState === "submitting";
  const isSuccess = submissionState === "success";
  const isError = submissionState === "error";
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const canSubmit = subject.trim() && message.trim() && !isSubmitting && !hasValidationErrors;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "sm:max-w-md w-full max-w-[calc(100%-2rem)]",
          isRTL ? "text-right" : "text-left"
        )}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <DialogHeader>
          <DialogTitle className={cn("text-lg font-semibold")}>
            {t("feedback_title")}
          </DialogTitle>
          <DialogDescription className={cn("text-sm text-slate-600")}>
            {t("feedback_subtitle")}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                {t("feedback_success")}
              </h3>
              <p className="text-sm text-green-600">
                {t("feedback_success_message")}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Feedback Type Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("feedback_type")}
              </label>
              <Select
                value={feedbackType}
                onValueChange={(value: FeedbackType) => setFeedbackType(value)}
              >
                <SelectTrigger
                  className="w-full"
                  style={{
                    display: "flex",
                    flexDirection: isRTL ? "row-reverse" : "row",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ direction: isRTL ? "rtl" : "ltr" }}>
                  {feedbackTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("feedback_subject")}
              </label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  validateField("subject", e.target.value);
                }}
                onBlur={() => validateField("subject", subject)}
                placeholder={t("feedback_subject_placeholder")}
                disabled={isSubmitting}
                className={cn(
                  isRTL ? "text-right" : "text-left",
                  validationErrors.subject ? "border-red-500 focus-visible:ring-red-500/50" : ""
                )}
              />
              {validationErrors.subject && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.subject}
                </p>
              )}
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("feedback_message")}
              </label>
              <Textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  validateField("message", e.target.value);
                }}
                onBlur={() => validateField("message", message)}
                placeholder={t("feedback_message_placeholder")}
                disabled={isSubmitting}
                rows={4}
                className={cn(
                  "resize-none",
                  isRTL ? "text-right" : "text-left",
                  validationErrors.message ? "border-red-500 focus-visible:ring-red-500/50" : ""
                )}
              />
              {validationErrors.message && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.message}
                </p>
              )}
            </div>

            {isError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-md"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{t("feedback_error")}</span>
              </motion.div>
            )}
          </motion.form>
        )}

        {!isSuccess && (
          <DialogFooter
            className={cn(
              "gap-2",
              isRTL ? "sm:flex-row-reverse" : "sm:flex-row"
            )}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("feedback_cancel")}
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={isSubmitting}
              className="rounded-[20px]!"
            >
              {isSubmitting ? t("feedback_submitting") : t("feedback_submit")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
