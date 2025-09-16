import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Trash2, AlertTriangle } from "lucide-react";
import { CartItem } from "@/types/chat";
import { useLanguage } from "@/hooks/useLanguage";

interface CartItemCardProps {
  item: CartItem;
  index?: number;
  onDelete?: (cartItemId: string, itemName: string, quantity: number) => Promise<void>;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  index = 0,
  onDelete,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showAvailabilityTooltip, setShowAvailabilityTooltip] = useState(false);
  const [showDeleteTooltip, setShowDeleteTooltip] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { language } = useLanguage();

  // Check if item is available
  const isAvailable = item.availability === true;

  // Get localized text for units
  const unitsText = language === "he" ? "יחידות" : "Units";

  // Get localized text for availability
  const availabilityText = isAvailable
    ? language === "he"
      ? "זמין"
      : "Available"
    : language === "he"
      ? "לא זמין"
      : "Unavailable";

  // Get localized text for delete functionality
  const deleteText = language === "he" ? "מחק" : "Remove";

  // Handle delete action
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(item.cart_item_id, item.name, item.quantity);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-card border border-border rounded-xl p-3 relative overflow-hidden w-full mb-2 flex items-center gap-3 min-h-[80px] transition-all duration-300"
      style={{
        boxShadow: isHovered
          ? "0 8px 16px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(var(--ring) / 0.1)"
          : "0 2px 8px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className={`absolute inset-0 pointer-events-none rounded-xl transition-colors duration-300 ${
          isHovered ? "bg-gradient-to-br from-primary/5 to-purple-500/5" : "bg-transparent"
        }`}
      />

      {/* Delete Button - Top Left Corner with Tooltip */}
      {onDelete && (
        <div
          style={{ position: "absolute", top: "8px", left: "8px", zIndex: 30 }}
          onMouseEnter={() => setShowDeleteTooltip(true)}
          onMouseLeave={() => setShowDeleteTooltip(false)}
        >
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.9)",
              border: "2px solid white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isDeleting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              position: "relative",
              opacity: isDeleting ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "rgba(220, 38, 38, 0.9)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.9)";
              }
            }}
          >
            <Trash2 size={12} color="white" />
          </motion.button>

          {/* Delete Tooltip */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover text-popover-foreground px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap z-[1000] shadow-lg transition-opacity duration-200"
            style={{
              opacity: showDeleteTooltip ? 1 : 0,
              visibility: showDeleteTooltip ? "visible" : "hidden",
            }}
          >
            {deleteText}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-popover" />
          </div>
        </div>
      )}

      {/* Availability Badge - Top Right Corner with Tooltip */}
      <div
        style={{ position: "absolute", top: "8px", right: "8px" }}
        onMouseEnter={() => setShowAvailabilityTooltip(true)}
        onMouseLeave={() => setShowAvailabilityTooltip(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: isAvailable
              ? "rgba(34, 197, 94, 0.9)"
              : "rgba(239, 68, 68, 0.9)",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            position: "relative",
          }}
        >
          {isAvailable ? (
            <CheckCircle size={10} color="white" />
          ) : (
            <AlertCircle size={10} color="white" />
          )}
        </motion.div>

        {/* Tooltip */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover text-popover-foreground px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap z-[1000] shadow-lg transition-opacity duration-200"
          style={{
            opacity: showAvailabilityTooltip ? 1 : 0,
            visibility: showAvailabilityTooltip ? "visible" : "hidden",
          }}
        >
          {availabilityText}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-popover" />
        </div>
      </div>

      {/* Product Image */}
      <div className="relative w-[60px] h-[60px] rounded-lg overflow-hidden bg-card border border-border flex-shrink-0">
        {item.image && !imageError ? (
          <motion.img
            src={item.image}
            alt={item.name}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: imageLoaded ? 1 : 0,
              scale: imageLoaded ? 1 : 1.1,
            }}
            transition={{ duration: 0.3 }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl">
            📦
          </div>
        )}
      </div>

      {/* Item Info */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Brand */}
        {item.brand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider text-right"
            style={{
              direction: "rtl",
            }}
          >
            {item.brand}
          </motion.div>
        )}

        {/* Item Name with Tooltip */}
        <motion.h3
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          title={item.name} // Native HTML tooltip on hover
          className="text-sm font-semibold text-foreground m-0 leading-snug text-right line-clamp-2"
          style={{
            direction: "rtl",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.name}
        </motion.h3>

        {/* Unit Price */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-xs text-muted-foreground text-right"
          style={{
            direction: "rtl",
          }}
        >
          מחיר יחידה: {item.price}
        </motion.div>
      </div>

      {/* Quantity and Total */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: language === "he" ? "flex-end" : "flex-start",
          gap: "4px",
          minWidth: "80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Quantity */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            direction: language === "he" ? "rtl" : "ltr",
          }}
        >
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {item.quantity}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {unitsText}
          </span>
        </motion.div>

        {/* Total Price */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-sm font-bold text-indigo-600 dark:text-indigo-400"
          style={{
            textAlign: language === "he" ? "right" : "left",
            direction: "rtl",
          }}
        >
          {item.total_price}
        </motion.div>
      </div>

      {/* Inline Confirmation Overlay */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-2 bg-background/95 backdrop-blur-sm rounded-lg z-[100] flex flex-col items-center justify-between p-2 border border-destructive/30 shadow-lg"
        >
          {/* Top Section - Icon and Text */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="w-6 h-6 rounded-full bg-destructive/15 flex items-center justify-center mb-1"
            >
              <AlertTriangle size={14} className="text-destructive" />
            </motion.div>

            {/* Simplified Message */}
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="text-xs font-medium text-foreground text-center m-0 leading-snug"
              style={{
                direction: language === "he" ? "rtl" : "ltr",
              }}
            >
              {language === "he" ? "מחק פריט?" : "Delete item?"}
            </motion.p>
          </div>

          {/* Bottom Section - Action Buttons */}
          <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            style={{
              display: "flex",
              gap: "6px",
              width: "100%",
              flexDirection: language === "he" ? "row-reverse" : "row",
            }}
          >
            {/* Cancel Button */}
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="flex-1 px-2 py-1.5 text-[10px] font-medium text-muted-foreground bg-secondary border border-border rounded cursor-pointer transition-all duration-150 hover:bg-secondary/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {language === "he" ? "ביטול" : "Cancel"}
            </button>

            {/* Confirm Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-2 py-1.5 text-[10px] font-semibold text-destructive-foreground bg-destructive border-none rounded cursor-pointer transition-all duration-150 hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-80 flex items-center justify-center gap-1"
            >
              {isDeleting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{
                      width: "10px",
                      height: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "1px solid white",
                      borderRadius: "50%",
                    }}
                  />
                  <span style={{ fontSize: "9px" }}>{language === "he" ? "מוחק" : "..."}</span>
                </>
              ) : (
                <>
                  <Trash2 size={10} />
                  {language === "he" ? "מחק" : "Delete"}
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
