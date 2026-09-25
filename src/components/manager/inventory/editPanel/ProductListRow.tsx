import { Package } from "lucide-react";
import type { ProductVariantForManagement } from "../../../../api/inventory";

interface ProductListItemProps {
  product: ProductVariantForManagement;
  isActive: boolean;
  onClick: () => void;
}

// Renders a single product row in the manager sidebar list
const ProductListItem = ({
  product,
  isActive,
  onClick,
}: ProductListItemProps) => {
  const hasVariants = (product.variant_count || 0) > 1;
  const variantLabel =
    product.color || product.size
      ? `${product.color || ""} ${product.size || ""}`.trim()
      : "Default";

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`inventory-list-product-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      {product.primary_image ? (
        <img
          src={product.primary_image}
          alt={product.name}
          className="inventory-list-product-thumbnail"
        />
      ) : (
        <div className="inventory-list-product-thumbnail-placeholder">
          <Package size={28} />
        </div>
      )}

      <div className="inventory-list-product-info">
        <h3 className="inventory-list-product-name">{product.name}</h3>
        <p className="inventory-list-product-meta">
          ${product.price.toFixed(2)} • Stock: {product.stock_quantity}
          {/* Variant label is only shown when the product has more than one variant */}
          {hasVariants && (
            <>
              <br />
              <span className="inventory-list-variant-info">{variantLabel}</span>
            </>
          )}
        </p>
      </div>

      {/* Variant count badge */}
      {hasVariants && (
        <span
          className="inventory-list-variant-badge inventory-list-variant-badge-bottom"
          title={`This product has ${product.variant_count} variants`}
        >
          {product.variant_count}V
        </span>
      )}
    </div>
  );
};

export default ProductListItem;
