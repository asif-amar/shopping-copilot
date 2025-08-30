import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle, AlertCircle } from "lucide-react";

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
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index = 0,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if product is available
  const isAvailable =
    product.availability?.includes("זמין") ||
    product.availability?.toLowerCase().includes("in stock");

  // Parse rating if available
  const rating = product.rating
    ? parseFloat(product.rating.split("/")[0])
    : null;

  const handleOpenProduct = () => {
    if (product.url) {
      chrome.tabs.update({ url: product.url });
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
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)",
        border: "1px solid #e1e5f2",
        borderRadius: "16px",
        padding: "12px",
        cursor: "pointer",
        boxShadow: isHovered
          ? "0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(102, 126, 234, 0.1)"
          : "0 2px 8px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        width: "100%",
        minWidth: "0",
        height: "250px",
        display: "flex",
        flexDirection: "column",
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
          borderRadius: "16px",
        }}
      />

      {/* Product Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100px",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "8px",
          background: imageError ? "#f3f4f6" : "#ffffff",
          border: "1px solid #f1f3f4",
        }}
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

        {/* Availability Badge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            padding: "4px 8px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "600",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: isAvailable
              ? "rgba(34, 197, 94, 0.9)"
              : "rgba(239, 68, 68, 0.9)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          {isAvailable ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
          {isAvailable ? "זמין" : "אזל"}
        </motion.div>
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
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#1f2937",
            margin: "0 0 6px 0",
            lineHeight: "1.4",
            direction: "rtl",
            textAlign: "right",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </motion.h3>

        {/* Rating */}
        {rating && (
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
        )}

        {/* Spacer to push price to bottom */}
        <div style={{ flex: 1 }}></div>

        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#667eea",
            marginBottom: "8px",
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
