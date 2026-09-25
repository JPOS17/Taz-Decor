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

// Lightweight image grid for creation forms
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
    <div className="image-upload-grid-wrapper">
      <label className="image-upload-grid-label">Product Images</label>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="image-upload-grid">
          {images.map((img, index) => (
            <div
              key={index}
              className={`image-upload-grid-cell ${primaryImageIndex === index ? "image-upload-grid-cell--primary" : ""}`}
            >
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="image-upload-grid-img"
              />

              {/* Primary badge */}
              {primaryImageIndex === index && (
                <div className="image-upload-grid-primary-badge">Primary</div>
              )}

              {/* Overlay actions */}
              <div className="image-upload-grid-overlay">
                <button
                  type="button"
                  className="image-upload-grid-icon-btn"
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
                  className="image-upload-grid-icon-btn"
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

      {/* Upload button label updates once images exist */}
      <button
        type="button"
        onClick={onUploadClick}
        disabled={uploadDisabled}
        className="image-upload-grid-upload-btn"
      >
        <Upload size={18} />
        {images.length > 0 ? "Add More Images" : "Upload Images"}
      </button>

      <span className="image-upload-grid-helper">{helperText}</span>
    </div>
  );
};

export default ImageUploadGrid;
