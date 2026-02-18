import { ChevronDown } from "lucide-react";
import type { VariantOption } from "../../../../api/inventory";

interface VariantSelectorProps {
  variants: VariantOption[];
  currentVariantId: number;
  onVariantChange: (variantId: number) => void;
  disabled?: boolean;
}

const VariantSelector = ({
  variants,
  currentVariantId,
  onVariantChange,
  disabled = false,
}: VariantSelectorProps) => {
  if (variants.length <= 1) {
    return null;
  }

  const getVariantLabel = (variant: VariantOption) => {
    const parts = [];
    if (variant.color) parts.push(variant.color);
    if (variant.size) parts.push(variant.size);
    if (parts.length === 0) parts.push(`SKU: ${variant.sku}`);
    return parts.join(" • ");
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  return (
    <div className="variant-selector-container">
      <label className="variant-selector-label">
        Product Variant ({variants.length} variants)
      </label>
      <div className="variant-selector-wrapper">
        <select
          className="variant-selector-select"
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
        <ChevronDown className="variant-selector-icon" size={20} />
      </div>
      <p className="variant-selector-help">
        Switch between product variants to edit different colors, sizes, or
        options
      </p>
    </div>
  );
};

export default VariantSelector;
