import { Upload, Trash2, Star } from "lucide-react";

interface ImageUploadGridProps {
  images: string[];
  primaryImageIndex: number;
  onSetPrimary: (index: number) => void;
  onDeleteImage: (index: number) => void;
  onUploadClick: () => void;
  uploadDisabled?: boolean;
  helperText?: string;
}

const ImageUploadGrid = ({
  images,
  primaryImageIndex,
  onSetPrimary,
  onDeleteImage,
  onUploadClick,
  uploadDisabled = false,
  helperText = "You can add images now or later after creating the product",
}: ImageUploadGridProps) => {
  return (
    <div className="mi-iug-wrapper">
      <label className="mi-iug-label">Product Images</label>

      {images.length > 0 && (
        <div className="mi-iug-grid">
          {images.map((img, index) => (
            <div
              key={index}
              className={`mi-iug-cell ${primaryImageIndex === index ? "mi-iug-cell--primary" : ""}`}
            >
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="mi-iug-img"
              />

              {primaryImageIndex === index && (
                <div className="mi-iug-primary-badge">Primary</div>
              )}

              <div className="mi-iug-overlay">
                <button
                  type="button"
                  className="mi-iug-icon-btn"
                  onClick={() => onSetPrimary(index)}
                  title="Set as primary"
                >
                  <Star
                    size={16}
                    color={primaryImageIndex === index ? "#f59e0b" : "#d97706"}
                    fill={primaryImageIndex === index ? "#f59e0b" : "none"}
                  />
                </button>

                <button
                  type="button"
                  className="mi-iug-icon-btn"
                  onClick={() => onDeleteImage(index)}
                  title="Delete image"
                >
                  <Trash2 size={16} color="#dc2626" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onUploadClick}
        disabled={uploadDisabled}
        className="mi-iug-upload-btn"
      >
        <Upload size={18} />
        {images.length > 0 ? "Add More Images" : "Upload Images"}
      </button>

      <span className="mi-iug-helper">{helperText}</span>
    </div>
  );
};

export default ImageUploadGrid;
