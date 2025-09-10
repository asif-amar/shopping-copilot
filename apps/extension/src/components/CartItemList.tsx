import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CartItemCard } from "./CartItemCard";
import { CartItem } from "@/types/chat";
import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface CartItemListProps {
  items: CartItem[];
  isLoading?: boolean;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  isLoading = false,
}) => {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #f3f4f6",
            borderTop: "3px solid #667eea",
            borderRadius: "50%",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center" }}>
          טוען פריטי עגלה...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "100%",
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShoppingCart size={28} color="#9ca3af" />
        </div>
        <div>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}
          >
            העגלה ריקה
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>
            לא נמצאו פריטים בעגלה
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "0",
      }}
    >
      {/* Cart Items List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0",
          width: "100%",
          direction: language === "he" ? "rtl" : "ltr",
        }}
      >
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.cart_item_id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                layout: { duration: 0.3 },
                opacity: { duration: 0.4, delay: index * 0.05 },
                x: { duration: 0.4, delay: index * 0.05 },
              }}
            >
              <CartItemCard item={item} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};