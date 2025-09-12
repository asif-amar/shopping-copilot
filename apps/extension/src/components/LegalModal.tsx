import { useLanguage } from "../hooks/useLanguage";
import { TermsOfUse } from "./TermsOfUse";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { Dialog, DialogContent } from "./ui/Dialog";
import { cn } from "../lib/utils";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terms" | "privacy" | null;
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const { isRTL } = useLanguage();

  if (!type) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-5xl max-h-[90vh] overflow-y-auto p-0",
          isRTL ? "text-right" : "text-left"
        )}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Content */}
        <div className="mt-2">
          {type === "terms" && <TermsOfUse />}
          {type === "privacy" && <PrivacyPolicy />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
