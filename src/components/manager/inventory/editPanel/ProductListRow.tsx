import { Package } from "lucide-react";
import type { ProductVariantForManagement } from "../../../../api/inventory";

interface ProductListItemProps {
  product: ProductVariantForManagement;
  isActive: boolean;
  onClick: () => void;
}

// Stock at or below this number is flagged as "low" (matches the Low Stock filter)
const LOW_STOCK_THRESHOLD = 3;

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

  const stock = product.stock_quantity;
  const isOut = stock <= 0;
  const isLow = !isOut && stock <= LOW_STOCK_THRESHOLD;

  // Lets keyboard users open a row with Enter / Space
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`inventory-list-product-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
    >
      {/* Thumbnail */}
      {product.primary_image ? (
        <img
          src={product.primary_image}
          alt=""
          className="inventory-list-product-thumbnail"
          loading="lazy"
        />
      ) : (
        <div
          className="inventory-list-product-thumbnail-placeholder"
          aria-hidden="true"
        >
          <Package size={22} />
        </div>
      )}

      <div className="inventory-list-product-info">
        <h3 className="inventory-list-product-name" title={product.name}>
          {product.name}
        </h3>

        <p className="inventory-list-product-meta">
          <span className="inventory-list-product-price">
            ${product.price.toFixed(2)}
          </span>

          {/* Stock level — only highlighted when it needs attention */}
          {isOut ? (
            <span className="inventory-list-pill inventory-list-pill--out">
              Out of stock
            </span>
          ) : isLow ? (
            <span className="inventory-list-pill inventory-list-pill--low">
              Low · {stock}
            </span>
          ) : (
            <span className="inventory-list-pill inventory-list-pill--ok">
              {stock} in stock
            </span>
          )}

          {/* Variant label is only shown when the product has more than one variant */}
          {hasVariants && (
            <span className="inventory-list-variant-info">{variantLabel}</span>
          )}
        </p>
      </div>

      {/* Variant count badge */}
      {hasVariants && (
        <span
          className="inventory-list-variant-badge"
          title={`This product has ${product.variant_count} variants`}
        >
          {product.variant_count}V
        </span>
      )}
    </div>
  );
};

export default ProductListItem;
