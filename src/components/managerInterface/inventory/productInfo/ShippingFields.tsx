import "../../../../styles/components/managerInterface/ProductForms.css";

interface ShippingFieldsProps {
  weight_oz: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  errors: {
    weight_oz?: string;
    length_in?: string;
    width_in?: string;
    height_in?: string;
    package_dimensions?: string;
  };
  onChange: (field: string, value: number | null) => void;
  required?: boolean;
  showTitle?: boolean;
  "data-section"?: string;
}

const ShippingFields = ({
  weight_oz,
  length_in,
  width_in,
  height_in,
  errors,
  onChange,
  required = true,
  showTitle = true,
  "data-section": dataSection,
}: ShippingFieldsProps) => {
  const handleChange = (field: string, value: string) => {
    if (value === "") {
      onChange(field, null);
    } else {
      const numValue = parseFloat(value);
      onChange(field, !isNaN(numValue) ? numValue : null);
    }
  };

  return (
    <div className="form-section" data-section={dataSection}>
      {/* Title */}
      {showTitle && (
        <>
          <h4 className="section-title">Shipping Information</h4>
          <span className="section-subtitle">
            Required for USPS shipping label generation
          </span>
        </>
      )}

      {/* Weight */}
      <div className="form-group">
        <label className={`form-label ${required ? "required" : ""}`}>
          Weight (oz)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={weight_oz ?? ""}
          onChange={(e) => handleChange("weight_oz", e.target.value)}
          placeholder="Weight in ounces"
          className={`form-control ${errors.weight_oz ? "invalid" : ""}`}
        />
        {errors.weight_oz && (
          <span className="warning-message">{errors.weight_oz}</span>
        )}
      </div>

      {/* Dimensions */}
      <div className="form-group">
        <label className={`form-label ${required ? "required" : ""}`}>
          Package Dimensions (inches)
          {errors.package_dimensions && (
            <span className="label-error"> {errors.package_dimensions}</span>
          )}
        </label>
        <div className="dimensions-grid">
          {/* Length */}
          <div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={length_in ?? ""}
              onChange={(e) => handleChange("length_in", e.target.value)}
              placeholder="Length"
              className={`form-control ${errors.length_in ? "invalid" : ""}`}
            />
            {errors.length_in && (
              <span className="warning-message">{errors.length_in}</span>
            )}
          </div>

          {/* Width */}
          <div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={width_in ?? ""}
              onChange={(e) => handleChange("width_in", e.target.value)}
              placeholder="Width"
              className={`form-control ${errors.width_in ? "invalid" : ""}`}
            />
            {errors.width_in && (
              <span className="warning-message">{errors.width_in}</span>
            )}
          </div>

          {/* Height */}
          <div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={height_in ?? ""}
              onChange={(e) => handleChange("height_in", e.target.value)}
              placeholder="Height"
              className={`form-control ${errors.height_in ? "invalid" : ""}`}
            />
            {errors.height_in && (
              <span className="warning-message">{errors.height_in}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingFields;
