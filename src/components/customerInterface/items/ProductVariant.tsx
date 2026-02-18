import "../../../styles/components/customerInterface/items/ProductVariant.css";

export interface ProductVariant {
  variant_id: number;
  sku: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
  weight_oz: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  images: string[];
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: number;
  onVariantChange: (variantId: number) => void;
}

const VariantSelector = ({
  variants,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) => {
  if (variants.length <= 1) {
    // Single variant, no selector needed
    return null;
  }

  // Sort variants by variant_id to maintain consistent numbering
  const sortedVariants = [...variants].sort(
    (a, b) => a.variant_id - b.variant_id,
  );

  const handleVariantSelect = (variantId: number) => {
    if (variantId !== selectedVariantId) {
      onVariantChange(variantId);
    }
  };

  const formatVariantDetails = (variant: ProductVariant) => {
    const details = [];
    if (variant.color) details.push(`Color: ${variant.color}`);
    if (variant.size) details.push(`Size: ${variant.size}`);
    return details.length > 0 ? details.join("\n") : "Standard";
  };

  return (
    <div className="variant-selector">
      <div className="variant-section">
        <div className="variant-grid">
          {sortedVariants.map((variant, index) => {
            const isSelected = variant.variant_id === selectedVariantId;
            const isOutOfStock = variant.quantity === 0;
            const variantNumber = index + 1;

            return (
              <button
                key={variant.variant_id}
                className={`variant-card ${
                  isSelected ? "variant-card-selected" : ""
                } ${isOutOfStock ? "variant-card-unavailable" : ""}`}
                onClick={() => handleVariantSelect(variant.variant_id)}
                disabled={isOutOfStock}
                aria-label={`Select variant ${variantNumber}: ${formatVariantDetails(variant)}`}
                aria-pressed={isSelected}
              >
                <div className="variant-card-number">#{variantNumber}</div>
                <div className="variant-card-details">
                  {formatVariantDetails(variant)}
                </div>
                {variant.price && (
                  <div className="variant-card-price">
                    ${variant.price.toFixed(2)}
                  </div>
                )}
                {isOutOfStock && (
                  <div className="variant-card-stock-badge">Out of Stock</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VariantSelector;
