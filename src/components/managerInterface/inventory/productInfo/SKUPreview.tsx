interface SKUPreviewProps {
  sku: string;
  loading: boolean;
  type?: "product" | "variant";
}

// Displays the auto-generated SKU that will be assigned on form submission
const SKUPreview = ({ sku, loading, type = "product" }: SKUPreviewProps) => {
  return (
    <div className="sku-preview-container">
      <div className="sku-preview-header">
        <span className="sku-preview-label">Generated SKU Preview:</span>
      </div>
      <div className="sku-preview-value">{loading ? "Loading..." : sku}</div>
      <div className="sku-preview-helper">
        This SKU will be automatically assigned when you create the {type}
      </div>
    </div>
  );
};

export default SKUPreview;
