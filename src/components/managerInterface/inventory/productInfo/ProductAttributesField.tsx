import "../../../../styles/components/managerInterface/ProductForms.css";

interface ProductAttributesFieldsProps {
  color: string;
  size: string;
  errors?: {
    color?: string;
    size?: string;
  };
  onChange: (field: string, value: string) => void;
  optional?: boolean;
  "data-section"?: string;
}

// Renders optional color and size inputs
const ProductAttributesFields = ({
  color,
  size,
  errors = {},
  onChange,
  optional = true,
  "data-section": dataSection,
}: ProductAttributesFieldsProps) => {
  return (
    <div className="form-section" data-section={dataSection}>
      {/* Title */}
      <h4 className="form-section-header">
        Product Attributes {optional && "(Optional)"}
      </h4>

      {/* Color */}
      <div className="form-group">
        <label className="form-label">Color</label>
        <input
          type="text"
          value={color}
          onChange={(e) => onChange("color", e.target.value)}
          placeholder="e.g., Red, Blue, Black"
          className={`form-control ${errors.color ? "invalid" : ""}`}
        />
        <span className="form-text">Leave empty if not applicable</span>
      </div>

      {/* Size */}
      <div className="form-group">
        <label className="form-label">Size</label>
        <input
          type="text"
          value={size}
          onChange={(e) => onChange("size", e.target.value)}
          placeholder="e.g., Small, Medium, Large"
          className={`form-control ${errors.size ? "invalid" : ""}`}
        />
        <span className="form-text">Leave empty if not applicable</span>
      </div>
    </div>
  );
};

export default ProductAttributesFields;
