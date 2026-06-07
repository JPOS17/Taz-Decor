import { ChevronDown } from "lucide-react";
import type { VariantOption } from "../../../../api/inventory";

interface VariantSelectorProps {
  variants: VariantOption[];
  currentVariantId: number;
  onVariantChange: (variantId: number) => void;
  disabled?: boolean;
}

// Dropdown for switching between variants of the same product in the edit panel
const VariantSelector = ({
  variants,
  currentVariantId,
  onVariantChange,
  disabled = false,
}: VariantSelectorProps) => {
  if (variants.length <= 1) {
    return null;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Builds a human-readable label from color and size — falls back to SKU when neither is set
  const getVariantLabel = (variant: VariantOption) => {
    const parts = [];
    if (variant.color) parts.push(variant.color);
    if (variant.size) parts.push(variant.size);
    if (parts.length === 0) parts.push(`SKU: ${variant.sku}`);
    return parts.join(" • ");
  };

  // Normalizes price to a fixed-decimal string regardless of whether it arrives as string or number
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="mi-variant-selector-container">
      <label className="mi-variant-selector-label">
        Product Variant ({variants.length} variants)
      </label>
      <div className="mi-variant-selector-wrapper">
        <select
          className="mi-variant-selector-select"
          value={currentVariantId}
          onChange={(e) => onVariantChange(Number(e.target.value))}
          disabled={disabled}
        >
          {variants.map((variant) => (
            <option key={variant.variant_id} value={variant.variant_id}>
              {getVariantLabel(variant)} - ${formatPrice(variant.price)} (Stock:{" "}
              {variant.stock_quantity})
            </option>
          ))}
        </select>
        <ChevronDown className="mi-variant-selector-icon" size={20} />
      </div>
      <p className="mi-variant-selector-help">
        Switch between product variants to edit different colors, sizes, or
        options
      </p>
    </div>
  );
};

export default VariantSelector;
