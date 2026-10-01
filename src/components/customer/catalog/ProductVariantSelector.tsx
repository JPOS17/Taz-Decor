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
  // Single-variant products don't need a selector
  if (variants.length <= 1) {
    return null;
  }

  // Stable display order regardless of fetch order
  const sortedVariants = [...variants].sort(
    (a, b) => a.variant_id - b.variant_id,
  );

  // No-op when the selected variant is clicked again
  const handleVariantSelect = (variantId: number) => {
    if (variantId !== selectedVariantId) {
      onVariantChange(variantId);
    }
  };

  // Returns "Color", "Size", or "Standard" for the card label
  const formatVariantDetails = (variant: ProductVariant) => {
    const details = [];
    if (variant.color) details.push(`${variant.color}`);
    if (variant.size) details.push(`${variant.size}`);
    return details.length > 0 ? details.join("\n") : "Standard";
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="product-variant-selector">
      <p className="product-variant-selector-label">Options</p>
      <div
        className="product-variant-selector-grid"
        role="group"
        aria-label="Product options"
      >
        {sortedVariants.map((variant, index) => {
          const isSelected = variant.variant_id === selectedVariantId;
          const isOutOfStock = variant.quantity === 0;
          const variantNumber = index + 1;

          return (
            <button
              key={variant.variant_id}
              type="button"
              className={[
                "product-variant-selector-card",
                isSelected ? "product-variant-selector-card-selected" : "",
                isOutOfStock ? "product-variant-selector-card-unavailable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleVariantSelect(variant.variant_id)}
              disabled={isOutOfStock}
              aria-label={`Select variant ${variantNumber}: ${formatVariantDetails(variant).replace("\n", ", ")}${isOutOfStock ? " (out of stock)" : ""}`}
              aria-pressed={isSelected}
            >
              <span className="product-variant-selector-card-details">
                {formatVariantDetails(variant)}
              </span>
              {isOutOfStock && (
                <span className="product-variant-selector-card-stock-badge">
                  Out of Stock
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VariantSelector;