import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export interface Product {
  name: string;
  price: string;
  availability: string;
  url: string;
  image: string;
  brand?: string;
  category?: string;
  rating?: string;
  description?: string;
  product_id: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
  onAddToCart?: (productName: string) => Promise<void>;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index = 0,
  onAddToCart,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showUnavailableTooltip, setShowUnavailableTooltip] = useState(false);
  const { language } = useLanguage();

  // Check if product is available
  const isAvailable =
    product.availability?.includes("זמין") ||
    product.availability?.toLowerCase().includes("in stock");

  // Parse rating if available TODO


  // Get localized text for unavailable tooltip
  const unavailableText = language === "he" ? "אזל מהמלאי" : "Unavailable";


  const handleOpenProduct = () => {
    if (product.url) {
      chrome.tabs.update({ url: product.url });
    }
  };

  // Handle add to cart action
  const handleAddToCart = async (): Promise<void> => {
    if (!onAddToCart || !isAvailable || isAdding) return;
    
    setIsAdding(true);
    try {
      await onAddToCart(product.name);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpenProduct}
      className="bg-card border border-border rounded-2xl p-3 cursor-pointer relative overflow-hidden w-full min-w-0 h-[250px] flex flex-col transition-all duration-300"
      style={{
        boxShadow: isHovered
          ? "0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(var(--ring) / 0.1)"
          : "0 2px 8px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className={`absolute inset-0 pointer-events-none rounded-2xl transition-colors duration-300 ${
          isHovered ? "bg-gradient-to-br from-primary/5 to-purple-500/5" : "bg-transparent"
        }`}
      />

      {/* Product Image */}
      <div
        className={`relative w-full h-[100px] rounded-xl overflow-hidden mb-2 border border-border ${
          imageError ? "bg-muted" : "bg-card"
        }`}
      >
        {product.image && !imageError ? (
          <motion.img
            src={product.image}
            alt={product.name}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: imageLoaded ? 1 : 0,
              scale: imageLoaded ? (isHovered ? 1.05 : 1) : 1.1,
            }}
            transition={{
              duration: 0.3,
              scale: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
            }}
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
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            📦 תמונה לא זמינה
          </div>
        )}

        {/* Top Left Corner Icon - Uses existing availability logic */}
        {isAvailable && onAddToCart ? (
          /* Green + icon for available items */
          <motion.button
            type="button"
            disabled={isAdding}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            whileHover={!isAdding ? { scale: 1.1 } : {}}
            whileTap={!isAdding ? { scale: 0.9 } : {}}
            className={`absolute top-1.5 left-1.5 z-30 w-6 h-6 rounded-full border-none flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200 ${
              isAdding 
                ? "bg-green-600/70 cursor-not-allowed" 
                : "bg-green-600/90 hover:bg-green-700 cursor-pointer"
            }`}
          >
            <Plus size={12} color="white" />
          </motion.button>
        ) : !isAvailable ? (
          /* Red unavailable icon for out-of-stock items */
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onMouseEnter={() => setShowUnavailableTooltip(true)}
              onMouseLeave={() => setShowUnavailableTooltip(false)}
              className="absolute top-1.5 left-1.5 z-30 w-6 h-6 rounded-full border border-white/20 bg-red-600/90 flex items-center justify-center shadow-lg backdrop-blur-sm cursor-default"
            >
              <AlertCircle size={14} color="white" />
            </motion.div>
            
            {/* Unavailable Tooltip */}
            {showUnavailableTooltip && (
              <div
                className="absolute top-11 left-5.5 bg-popover text-popover-foreground px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap z-[999999] shadow-lg pointer-events-none -translate-x-1/2"
              >
                {unavailableText}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-popover" />
              </div>
            )}
          </>
        ) : null}

      </div>

      {/* Product Info */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand */}
        {product.brand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: "10px",
              color: "#667eea",
              fontWeight: "600",
              marginBottom: "3px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              direction: "rtl",
              textAlign: "right",
            }}
          >
            {product.brand}
          </motion.div>
        )}

        {/* Product Name */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-semibold text-foreground m-0 mb-1.5 leading-relaxed line-clamp-2 overflow-hidden"
          style={{
            direction: "rtl",
            textAlign: "right",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {product.name}
        </motion.h3>

        {/* Rating */}
        {/* {rating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "6px",
              direction: "ltr",
            }}
          >
            <div style={{ display: "flex", gap: "1px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  fill={star <= rating ? "#fbbf24" : "none"}
                  color={star <= rating ? "#fbbf24" : "#e5e7eb"}
                />
              ))}
            </div>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>
              ({rating})
            </span>
          </motion.div>
        )} */}

        {/* Spacer to push price to bottom */}
        <div style={{ flex: 1 }}></div>

        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-base font-bold text-indigo-600 dark:text-indigo-400 mb-2"
          style={{
            direction: "rtl",
            textAlign: "right",
          }}
        >
          {product.price}
        </motion.div>

        {/* Category */}
        {product.category && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: "11px",
              color: "#6b7280",
              marginBottom: "12px",
              direction: "rtl",
              textAlign: "right",
            }}
          >
            {product.category}
          </motion.div>
        )}

        {/* Action Buttons */}
        {/* <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center"
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={!isAvailable}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              background: isAvailable
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "#e5e7eb",
              color: isAvailable ? "white" : "#9ca3af",
              fontSize: "12px",
              fontWeight: "600",
              cursor: isAvailable ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              opacity: isAvailable ? 1 : 0.6
            }}
          >
            <ShoppingCart size={14} />
            הוסף לעגלה
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProduct();
            }}
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #e1e5f2",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(4px)",
              color: "#667eea",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease"
            }}
          >
            <ExternalLink size={14} />
          </motion.button>
        </motion.div> */}
      </div>

    </motion.div>
  );
};
