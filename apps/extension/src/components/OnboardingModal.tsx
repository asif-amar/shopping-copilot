import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Users,
  Heart,
  Globe,
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Settings,
  Zap,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { ApiService, OnboardingRequest } from "../services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OnboardingData {
  household_size?: string;
  dietary_restrictions?: string[];
  budget_preference?: string;
  primary_sites?: string[];
  shopping_frequency?: string;
  language_preference?: string;
  preferred_categories?: string[];
  brand_preferences?: string[];
  special_considerations?: string[];
}

const getSteps = (t: (key: string) => string) => [
  { id: 1, title: t("onboarding_welcome"), icon: Sparkles },
  { id: 2, title: t("onboarding_profile"), icon: Users },
  { id: 3, title: t("onboarding_preferences"), icon: Heart },
  { id: 4, title: t("onboarding_features"), icon: Zap },
  { id: 5, title: t("onboarding_privacy"), icon: Shield },
];

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const { t, isRTL } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    language_preference: "en",
    dietary_restrictions: [],
    primary_sites: [],
    preferred_categories: [],
    brand_preferences: [],
    special_considerations: [],
  });

  const steps = getSteps(t);

  const updateData = (newData: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await ApiService.completeOnboarding(onboardingData as OnboardingRequest);
      onComplete();
      onClose();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span>{t("onboarding_title")}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn("flex items-center", isRTL && "flex-row-reverse")}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep >= step.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 transition-colors",
                      currentStep > step.id ? "bg-purple-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && <WelcomeStep t={t} isRTL={isRTL} />}
              {currentStep === 2 && (
                <ProfileStep
                  data={onboardingData}
                  updateData={updateData}
                  t={t}
                />
              )}
              {currentStep === 3 && (
                <PreferencesStep
                  data={onboardingData}
                  updateData={updateData}
                  t={t}
                />
              )}
              {currentStep === 4 && <FeaturesStep t={t} />}
              {currentStep === 5 && <PrivacyStep t={t} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div
          className={cn(
            "flex justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-4",
            isRTL && "flex-row-reverse"
          )}
        >
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleSkip : prevStep}
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-2! px-4! py-2! rounded-lg!",
              isRTL && "flex-row-reverse"
            )}
          >
            {currentStep !== 1 &&
              (isRTL ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              ))}
            {currentStep === 1
              ? t("onboarding_skip")
              : t("onboarding_previous")}
          </Button>

          {/* <div className="text-sm text-gray-500 text-center min-w-0 flex-shrink-0">
            {t("onboarding_step_of")
              .replace("{current}", currentStep.toString())
              .replace("{total}", steps.length.toString())}
          </div> */}

          <Button
            onClick={currentStep === steps.length ? handleComplete : nextStep}
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-2! px-4! py-2! rounded-lg!",
              isRTL && "flex-row-reverse"
            )}
          >
            {currentStep === steps.length ? (
              isSubmitting ? (
                t("onboarding_completing")
              ) : (
                t("onboarding_complete")
              )
            ) : (
              <>
                {t("onboarding_next")}
                {isRTL ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step Components
function WelcomeStep({
  t,
  isRTL,
}: {
  t: (key: string) => string;
  isRTL: boolean;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
        <ShoppingCart className="w-10 h-10 text-purple-600" />
      </div>

      <div>
        <h2
          className="text-2xl font-bold text-gray-900 mb-3"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {t("onboarding_welcome")}
        </h2>
        <p className="text-gray-600 text-lg" dir={isRTL ? "rtl" : "ltr"}>
          {t("onboarding_welcome_desc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 bg-green-50 rounded-lg">
          <Settings className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3
            className="font-medium text-gray-900 mb-1"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("onboarding_smart_search")}
          </h3>
          <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
            {t("onboarding_smart_search_desc")}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <ShoppingCart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3
            className="font-medium text-gray-900 mb-1"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("onboarding_cart_management")}
          </h3>
          <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
            {t("onboarding_cart_management_desc")}
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <h3
            className="font-medium text-gray-900 mb-1"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("onboarding_price_comparison")}
          </h3>
          <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
            {t("onboarding_price_comparison_desc")}
          </p>
        </div>
      </div>

      <p className="text-gray-500 text-sm" dir={isRTL ? "rtl" : "ltr"}>
        {t("onboarding_personalize_desc")}
      </p>
    </div>
  );
}

function ProfileStep({
  data,
  updateData,
  t,
}: {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  t: (key: string) => string;
}) {
  const { isRTL } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("onboarding_profile")}
        </h2>
        <p className="text-gray-600">{t("onboarding_profile_desc")}</p>
      </div>

      <div className="space-y-4">
        {/* Household Size */}
        <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_household_size")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: "small",
                label: t("onboarding_household_1_2"),
                icon: "👥",
              },
              {
                value: "medium",
                label: t("onboarding_household_3_4"),
                icon: "👪",
              },
              {
                value: "large",
                label: t("onboarding_household_5_plus"),
                icon: "👨‍👩‍👧‍👦",
              },
            ].map((option) => (
              <button
                dir={isRTL ? "rtl" : "ltr"}
                key={option.value}
                onClick={() => updateData({ household_size: option.value })}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  isRTL ? "text-right" : "text-left",

                  data.household_size === option.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {/* <div className="text-lg mb-1">{option.icon}</div> */}
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_dietary_prefs")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "kosher", label: t("onboarding_kosher") },
              { value: "vegan", label: t("onboarding_vegan") },
              { value: "vegetarian", label: t("onboarding_vegetarian") },
              { value: "gluten-free", label: t("onboarding_gluten_free") },
              { value: "dairy-free", label: t("onboarding_dairy_free") },
              { value: "organic", label: t("onboarding_organic") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const current = data.dietary_restrictions || [];
                  const updated = current.includes(option.value)
                    ? current.filter((item) => item !== option.value)
                    : [...current, option.value];
                  updateData({ dietary_restrictions: updated });
                }}
                className={cn(
                  "p-2 rounded-lg border text-sm transition-colors",
                  isRTL ? "text-right" : "text-left",
                  (data.dietary_restrictions || []).includes(option.value)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Preference */}
        <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_budget_pref")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: "budget",
                label: t("onboarding_budget_conscious"),
                desc: t("onboarding_budget_conscious_desc"),
              },
              {
                value: "moderate",
                label: t("onboarding_moderate"),
                desc: t("onboarding_moderate_desc"),
              },
              {
                value: "premium",
                label: t("onboarding_premium"),
                desc: t("onboarding_premium_desc"),
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateData({ budget_preference: option.value })}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  isRTL ? "text-right" : "text-left",
                  data.budget_preference === option.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="text-sm font-medium mb-1">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Shopping Frequency */}
        <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_shopping_frequency")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "daily", label: t("onboarding_daily"), icon: "📅" },
              { value: "weekly", label: t("onboarding_weekly"), icon: "📋" },
              { value: "monthly", label: t("onboarding_monthly"), icon: "🗓️" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateData({ shopping_frequency: option.value })}
                className={cn(
                  "p-3 rounded-lg border text-center transition-colors",
                  data.shopping_frequency === option.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {/* <div className="text-lg mb-1">{option.icon}</div> */}
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferencesStep({
  data,
  updateData,
  t,
}: {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  t: (key: string) => string;
}) {
  const { isRTL } = useLanguage();
  const [customSiteInput, setCustomSiteInput] = useState("");

  const sanitizeInput = (input: string): string => {
    return input
      .replace(/<[^>]*>/g, "")
      .replace(/['"`;\\]/g, "")
      .replace(
        /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi,
        ""
      )
      .trim()
      .substring(0, 50);
  };

  const handleCustomSiteAdd = () => {
    if (customSiteInput.trim()) {
      const sanitizedInput = sanitizeInput(customSiteInput);
      if (sanitizedInput) {
        const current = data.primary_sites || [];
        if (!current.includes(`custom:${sanitizedInput}`)) {
          updateData({
            primary_sites: [...current, `custom:${sanitizedInput}`],
          });
        }
        setCustomSiteInput("");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 text-pink-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("onboarding_preferences")}
        </h2>
        <p className="text-gray-600">{t("onboarding_preferences_desc")}</p>
      </div>

      <div className="space-y-4">
        {/* Language Preference */}
        {/* <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_language_preference")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "en", label: "English", flag: "🇺🇸" },
              { value: "he", label: "עברית", flag: "🇮🇱" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateData({ language_preference: option.value })
                }
                className={cn(
                  "p-3 rounded-lg border text-center transition-colors",
                  data.language_preference === option.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="text-lg mb-1">{option.flag}</div>
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div> */}

        {/* Primary Sites */}
        <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_preferred_shopping_sites")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "shufersal",
                label: t("onboarding_shufersal"),
              },
              {
                value: "rami-levy",
                label: t("onboarding_rami_levy"),
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const current = data.primary_sites || [];
                  const updated = current.includes(option.value)
                    ? current.filter((item) => item !== option.value)
                    : [...current, option.value];
                  updateData({ primary_sites: updated });
                }}
                className={cn(
                  "p-3 rounded-lg border text-center transition-colors",
                  (data.primary_sites || []).includes(option.value)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className="text-sm font-medium"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {option.label}
                </div>
              </button>
            ))}
          </div>

          {/* Other Option with Custom Input */}
          {/* <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customSiteInput}
                onChange={(e) => setCustomSiteInput(e.target.value)}
                placeholder={t("onboarding_other_placeholder")}
                className={cn(
                  "flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomSiteAdd();
                  }
                }}
              />
              <button
                onClick={handleCustomSiteAdd}
                disabled={!customSiteInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {t("onboarding_other")}
              </button>
            </div>
            
            {(data.primary_sites || []).filter(site => site.startsWith('custom:')).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(data.primary_sites || [])
                  .filter(site => site.startsWith('custom:'))
                  .map((site) => {
                    const siteName = site.replace('custom:', '');
                    return (
                      <span
                        key={site}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-500 rounded-md text-xs"
                      >
                        <span dir={isRTL ? "rtl" : "ltr"}>{siteName}</span>
                        <button
                          onClick={() => {
                            const current = data.primary_sites || [];
                            updateData({
                              primary_sites: current.filter(item => item !== site)
                            });
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                }
              </div>
            )}
          </div> */}
        </div>

        {/* Product Categories */}
        <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_favorite_categories_optional")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "fresh-produce", label: t("onboarding_fresh_produce") },
              { value: "meat-fish", label: t("onboarding_meat_fish") },
              { value: "dairy", label: t("onboarding_dairy") },
              { value: "bakery", label: t("onboarding_bakery") },
              { value: "pantry", label: t("onboarding_pantry") },
              { value: "frozen", label: t("onboarding_frozen") },
              { value: "snacks", label: t("onboarding_snacks") },
              { value: "beverages", label: t("onboarding_beverages") },
              { value: "household", label: t("onboarding_household_items") },
              { value: "baby", label: t("onboarding_baby_products") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const current = data.preferred_categories || [];
                  const updated = current.includes(option.value)
                    ? current.filter((item) => item !== option.value)
                    : [...current, option.value];
                  updateData({ preferred_categories: updated });
                }}
                className={cn(
                  "p-2 rounded-lg border text-sm transition-colors",
                  isRTL ? "text-right" : "text-left",
                  (data.preferred_categories || []).includes(option.value)
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Preferences */}
        <div>
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-2",
              isRTL && "text-right"
            )}
          >
            {t("onboarding_brand_preferences_optional")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "store-brands", label: t("onboarding_store_brands") },
              {
                value: "national-brands",
                label: t("onboarding_national_brands"),
              },
              {
                value: "premium-brands",
                label: t("onboarding_premium_brands"),
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const current = data.brand_preferences || [];
                  const updated = current.includes(option.value)
                    ? current.filter((item) => item !== option.value)
                    : [...current, option.value];
                  updateData({ brand_preferences: updated });
                }}
                className={cn(
                  "p-2 rounded-lg border text-xs text-center transition-colors",
                  (data.brand_preferences || []).includes(option.value)
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesStep({ t }: { t: (key: string) => string }) {
  const { isRTL } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Zap className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
        <h2
          className="text-xl font-bold text-gray-900 mb-2"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {t("onboarding_features")}
        </h2>
        <p className="text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
          {t("onboarding_features_desc")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-purple-50 rounded-lg">
          <div
            className={cn(
              "flex items-start gap-3",
              isRTL ? "flex-row-reverse text-right" : ""
            )}
          >
            <Settings className="w-6 h-6 text-purple-600 mt-0.5" />
            <div className={cn(isRTL && "text-right")}>
              <h3
                className="font-medium text-gray-900 mb-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("onboarding_auto_credential_capture")}
              </h3>
              <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
                {t("onboarding_auto_credential_capture_desc")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div
            className={cn(
              "flex items-start gap-3",
              isRTL ? "flex-row-reverse text-right" : ""
            )}
          >
            <ShoppingCart className="w-6 h-6 text-green-600 mt-0.5" />
            <div className={cn(isRTL && "text-right")}>
              <h3
                className="font-medium text-gray-900 mb-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("onboarding_smart_chat_commands")}
              </h3>
              <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
                {t("onboarding_smart_chat_commands_desc")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div
            className={cn(
              "flex items-start gap-3",
              isRTL ? "flex-row-reverse text-right" : ""
            )}
          >
            <Zap className="w-6 h-6 text-purple-600 mt-0.5" />
            <div className={cn(isRTL && "text-right")}>
              <h3
                className="font-medium text-gray-900 mb-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("onboarding_credit_system_title")}
              </h3>
              <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
                {t("onboarding_credit_system_desc_detailed")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <div
            className={cn(
              "flex items-start gap-3",
              isRTL ? "flex-row-reverse text-right" : ""
            )}
          >
            <Globe className="w-6 h-6 text-orange-600 mt-0.5" />
            <div className={cn(isRTL && "text-right")}>
              <h3
                className="font-medium text-gray-900 mb-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("onboarding_multi_site_support")}
              </h3>
              <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
                {t("onboarding_multi_site_support_desc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivacyStep({ t }: { t: (key: string) => string }) {
  const { isRTL } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h2
          className="text-xl font-bold text-gray-900 mb-2"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {t("onboarding_privacy")}
        </h2>
        <p className="text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
          {t("onboarding_privacy_desc")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div
            className={cn(
              "flex items-start gap-3",
              isRTL ? "flex-row-reverse text-right" : ""
            )}
          >
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div className={cn(isRTL && "text-right")}>
              <h3
                className="font-medium text-gray-900 mb-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("onboarding_secure_data_handling")}
              </h3>
              <p className="text-sm text-gray-600" dir={isRTL ? "rtl" : "ltr"}>
                {t("onboarding_secure_data_handling_desc")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div
            className={cn(
              "flex items-start gap-3",
              isRTL ? "flex-row-reverse text-right" : ""
            )}
          >
            <Shield className="w-6 h-6 text-purple-600 mt-0.5" />
            <div className={cn(isRTL && "text-right")}>
              <h3
                className="font-medium text-gray-900 mb-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("onboarding_data_collection_title")}
              </h3>
              <ul
                className="text-sm text-gray-600 space-y-1 mt-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <li>{t("onboarding_data_collection_item_1")}</li>
                <li>{t("onboarding_data_collection_item_2")}</li>
                <li>{t("onboarding_data_collection_item_3")}</li>
                <li>{t("onboarding_data_collection_item_4")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div
            className={cn(
              "flex items-start gap-3",
              isRTL ? "flex-row-reverse text-right" : ""
            )}
          >
            <Users className="w-6 h-6 text-purple-600 mt-0.5" />
            <div className={cn(isRTL && "text-right")}>
              <h3
                className="font-medium text-gray-900 mb-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("onboarding_your_rights")}
              </h3>
              <ul
                className="text-sm text-gray-600 space-y-1 mt-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <li>{t("onboarding_your_rights_item_1")}</li>
                <li>{t("onboarding_your_rights_item_2")}</li>
                {/* <li>{t("onboarding_your_rights_item_3")}</li> */}
                <li>{t("onboarding_your_rights_item_4")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
