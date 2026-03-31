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
      className={`product-list-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      {product.primary_image ? (
        <img
          src={product.primary_image}
          alt={product.name}
          className="product-thumbnail"
        />
      ) : (
        <div className="product-thumbnail-placeholder">
          <Package size={28} />
        </div>
      )}

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-meta">
          ${product.price.toFixed(2)} • Stock: {product.stock_quantity}
          {hasVariants && (
            <>
              <br />
              <span className="variant-info">{variantLabel}</span>
            </>
          )}
        </p>
      </div>

      {hasVariants && (
        <span
          className="variant-badge variant-badge-bottom"
          title={`This product has ${product.variant_count} variants`}
        >
          {product.variant_count}V
        </span>
      )}
    </div>
  );
};

export default ProductListItem;
