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
    <div style={{ marginBottom: "1.5rem" }}>
      <label
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: "0.5rem",
          color: "#333",
        }}
      >
        Product Images
      </label>

      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          {images.map((img, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                paddingTop: "100%",
                border:
                  primaryImageIndex === index
                    ? "3px solid #ffc107"
                    : "2px solid #dee2e6",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <img
                src={img}
                alt={`Product ${index + 1}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {primaryImageIndex === index && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    backgroundColor: "#ffc107",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                  }}
                >
                  Primary
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <button
                  type="button"
                  onClick={() => onSetPrimary(index)}
                  style={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Set as primary"
                >
                  <Star
                    size={16}
                    color={primaryImageIndex === index ? "#ff9800" : "#ffc107"}
                    fill={primaryImageIndex === index ? "#ff9800" : "none"}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteImage(index)}
                  style={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Delete image"
                >
                  <Trash2 size={16} color="#dc3545" />
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
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: uploadDisabled ? "#999" : "#753a1e",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontWeight: 600,
          cursor: uploadDisabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          opacity: uploadDisabled ? 0.6 : 1,
        }}
      >
        <Upload size={18} />
        {images.length > 0 ? "Add More Images" : "Upload Images"}
      </button>
      <span
        style={{
          color: "#6c757d",
          fontSize: "0.875rem",
          marginTop: "0.25rem",
          display: "block",
        }}
      >
        {helperText}
      </span>
    </div>
  );
};

export default ImageUploadGrid;
