import { Package } from "lucide-react";
import type { ProductVariantForManagement } from "../../../../api/inventory";

interface ProductListItemProps {
  product: ProductVariantForManagement;
  isActive: boolean;
  onClick: () => void;
}

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

  return (
    <div
      className={`mi-product-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      {product.primary_image ? (
        <img
          src={product.primary_image}
          alt={product.name}
          className="mi-product-thumbnail"
        />
      ) : (
        <div className="mi-product-thumbnail-placeholder">
          <Package size={28} />
        </div>
      )}

      <div className="mi-product-info">
        <h3 className="mi-product-name">{product.name}</h3>
        <p className="mi-product-meta">
          ${product.price.toFixed(2)} • Stock: {product.stock_quantity}
          {hasVariants && (
            <>
              <br />
              <span className="mi-variant-info">{variantLabel}</span>
            </>
          )}
        </p>
      </div>

      {hasVariants && (
        <span
          className="mi-variant-badge mi-variant-badge-bottom"
          title={`This product has ${product.variant_count} variants`}
        >
          {product.variant_count}V
        </span>
      )}
    </div>
  );
};

export default ProductListItem;
