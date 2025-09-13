import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  GitBranch,
  Calendar,
  Sparkles,
  Zap,
  Bug,
  Shield,
} from "lucide-react";
import { Dialog, DialogContent } from "./ui/Dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { VersionChangelog, FeatureType } from "@/types/changelog";
import changelogData from "@/data/changelog.json";
import { cn } from "@/lib/utils";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightVersion?: string;
}

const getFeatureIcon = (type: FeatureType) => {
  switch (type) {
    case "feature":
      return <Sparkles size={16} className="text-purple-500" />;
    case "improvement":
      return <Zap size={16} className="text-green-500" />;
    case "bugfix":
      return <Bug size={16} className="text-orange-500" />;
    case "security":
      return <Shield size={16} className="text-red-500" />;
    default:
      return <GitBranch size={16} className="text-gray-500" />;
  }
};

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  highlightVersion,
}) => {
  const { language, isRTL } = useLanguage();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const versions = changelogData.versions as VersionChangelog[];

  useEffect(() => {
    if (highlightVersion && isOpen) {
      setSelectedVersion(highlightVersion);
    } else if (isOpen && versions.length > 0) {
      setSelectedVersion(versions[0].version);
    }
  }, [highlightVersion, isOpen, versions]);

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
  };

  const selectedVersionData = versions.find(
    (v) => v.version === selectedVersion
  );
  const features = selectedVersionData?.features[language] || [];

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent
        className={cn(
          "w-[90vw] max-w-4xl h-[80vh] max-h-[600px] p-0 bg-white rounded-xl shadow-2xl border-0 overflow-hidden",
          isRTL ? "font-sans" : ""
        )}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <div className="flex h-full overflow-auto">
          {/* Sidebar - Version List */}
          <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mt-2 text-center">
                {language === "he" ? "היסטוריית גרסאות" : "Version History"}
              </h3>
            </div>

            <div className="space-y-2">
              {versions.map((version) => (
                <motion.button
                  key={version.version}
                  onClick={() => handleVersionSelect(version.version)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all duration-200",
                    selectedVersion === version.version
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">v{version.version}</span>
                    {highlightVersion === version.version && (
                      <span className="w-2 h-2 bg-purple-700 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                    <Calendar size={12} />
                    <span>
                      {new Date(version.releaseDate).toLocaleDateString(
                        language === "he" ? "he-IL" : "en-US"
                      )}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {language === "he" ? "מה חדש" : "What's New"}
                  </h2>
                  {selectedVersionData && (
                    <p className="text-slate-600 mt-1">
                      {language === "he" ? "גרסה" : "Version"}{" "}
                      {selectedVersionData.version} •{" "}
                      {new Date(
                        selectedVersionData.releaseDate
                      ).toLocaleDateString(
                        language === "he" ? "he-IL" : "en-US"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedVersionData ? (
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center justify-between w-full gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800">
                            {feature.title}
                          </h4>
                          <div
                            className={cn(
                              "p-1 text-xs font-medium rounded-full",
                              feature.type === "feature" &&
                                "bg-purple-100 text-purple-700",
                              feature.type === "improvement" &&
                                "bg-green-100 text-green-700",
                              feature.type === "bugfix" &&
                                "bg-orange-100 text-orange-700",
                              feature.type === "security" &&
                                "bg-red-100 text-red-700"
                            )}
                          >
                            {getFeatureIcon(feature.type)}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">
                    {language === "he"
                      ? "בחר גרסה להצגת פרטים"
                      : "Select a version to view details"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
