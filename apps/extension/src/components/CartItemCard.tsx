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
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)",
        border: "1px solid #e1e5f2",
        borderRadius: "12px",
        padding: "12px",
        boxShadow: isHovered
          ? "0 8px 16px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(102, 126, 234, 0.1)"
          : "0 2px 8px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        width: "100%",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minHeight: "80px",
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isHovered
            ? "linear-gradient(145deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)"
            : "transparent",
          transition: "background 0.3s ease",
          pointerEvents: "none",
          borderRadius: "12px",
        }}
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
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#1e293b",
              color: "white",
              padding: "6px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              whiteSpace: "nowrap",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              opacity: showDeleteTooltip ? 1 : 0,
              visibility: showDeleteTooltip ? "visible" : "hidden",
              transition: "opacity 0.2s ease, visibility 0.2s ease",
            }}
          >
            {deleteText}
            <div
              style={{
                position: "absolute",
                top: "-4px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "0",
                height: "0",
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderBottom: "4px solid #1e293b",
              }}
            />
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
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1e293b",
            color: "white",
            padding: "6px 8px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            opacity: showAvailabilityTooltip ? 1 : 0,
            visibility: showAvailabilityTooltip ? "visible" : "hidden",
            transition: "opacity 0.2s ease, visibility 0.2s ease",
          }}
        >
          {availabilityText}
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "4px solid #1e293b",
            }}
          />
        </div>
      </div>

      {/* Product Image */}
      <div
        style={{
          position: "relative",
          width: "60px",
          height: "60px",
          borderRadius: "8px",
          overflow: "hidden",
          background: imageError ? "#f3f4f6" : "#ffffff",
          border: "1px solid #f1f3f4",
          flexShrink: 0,
        }}
      >
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
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "20px",
            }}
          >
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
            style={{
              fontSize: "10px",
              color: "#667eea",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              direction: "rtl",
              textAlign: "right",
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
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#1f2937",
            margin: 0,
            lineHeight: "1.3",
            direction: "rtl",
            textAlign: "right",
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
          style={{
            fontSize: "11px",
            color: "#6b7280",
            direction: "rtl",
            textAlign: "right",
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
          <span
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#667eea",
            }}
          >
            {item.quantity}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "#6b7280",
            }}
          >
            {unitsText}
          </span>
        </motion.div>

        {/* Total Price */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#667eea",
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
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            right: "8px",
            bottom: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Top Section - Icon and Text */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "4px",
              }}
            >
              <AlertTriangle size={14} color="#ef4444" />
            </motion.div>

            {/* Simplified Message */}
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              style={{
                fontSize: "11px",
                fontWeight: "500",
                color: "#374151",
                textAlign: "center",
                margin: "0",
                lineHeight: "1.3",
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
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "10px",
                fontWeight: "500",
                color: "#6b7280",
                backgroundColor: "#f8f9fa",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                opacity: isDeleting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "#f1f3f4";
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {language === "he" ? "ביטול" : "Cancel"}
            </button>

            {/* Confirm Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "10px",
                fontWeight: "600",
                color: "white",
                backgroundColor: "#ef4444",
                border: "none",
                borderRadius: "4px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                opacity: isDeleting ? 0.8 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "#ef4444";
                }
              }}
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
