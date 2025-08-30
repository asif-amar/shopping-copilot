import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard, Product } from "./ProductCard";
import { Package, Search } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading = false }) => {
  console.log("🎯 ProductGrid rendered with:", products.length, "products, isLoading:", isLoading);
  
  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px"
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
            borderRadius: "50%"
          }}
        />
        <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center" }}>
          מחפש מוצרים...
        </p>
      </div>
    );
  }

  if (products.length === 0) {
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
          textAlign: "center"
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
            justifyContent: "center"
          }}
        >
          <Search size={28} color="#9ca3af" />
        </div>
        <div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
            לא נמצאו מוצרים
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>
            נסה לחפש משהו אחר או בדוק את האיות
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "16px"
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #f1f3f4"
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Package size={16} color="white" />
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "600",
              color: "#1f2937",
              direction: "rtl"
            }}
          >
            נמצאו {products.length} מוצרים
          </h3>
        </div>
      </motion.div>

      {/* Product Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
          width: "100%"
        }}
      >
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <motion.div
              key={product.product_id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                layout: { duration: 0.3 },
                opacity: { duration: 0.4, delay: index * 0.05 },
                scale: { duration: 0.4, delay: index * 0.05 }
              }}
            >
              <ProductCard product={product} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show more indicator if there are many products */}
      {products.length > 6 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: "center",
            marginTop: "16px",
            padding: "12px",
            color: "#6b7280",
            fontSize: "12px"
          }}
        >
          מציג {Math.min(products.length, 10)} מתוך {products.length} מוצרים
        </motion.div>
      )}
    </div>
  );
};