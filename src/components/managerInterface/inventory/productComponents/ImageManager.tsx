import { useState } from "react";
import { Star, X, Upload } from "lucide-react";
import type { VariantImage } from "../../../../api/inventory";

interface ImageManagerProps {
  images: VariantImage[];
  onReorder: (newOrder: VariantImage[]) => void;
  onSetPrimary: (imageId: number) => void;
  onDelete: (imageId: number) => void;
  onUpload: () => void;
}

const ImageManager = ({
  images,
  onReorder,
  onSetPrimary,
  onDelete,
  onUpload,
}: ImageManagerProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<VariantImage | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update display_order for all images
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      display_order: index + 1,
    }));

    onReorder(reorderedImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleThumbnailClick = (image: VariantImage) => {
    setSelectedImage(image);
  };

  const handleSetPrimary = (e: React.MouseEvent, imageId: number) => {
    e.stopPropagation();
    onSetPrimary(imageId);
  };

  const handleDeleteImage = (e: React.MouseEvent, imageId: number) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this image? Changes will apply when you click Save Changes.",
      )
    ) {
      onDelete(imageId);
      if (selectedImage?.image_id === imageId) {
        setSelectedImage(null);
      }
    }
  };

  const primaryImage = images.find((img) => img.is_primary);
  const displayImage = selectedImage || primaryImage || images[0];

  return (
    <div className="image-management-section">
      <h3 className="form-label">Product Images</h3>

      {images.length > 0 ? (
        <div className="image-layout">
          {/* Thumbnail Column with scroll */}
          <div className="thumbnail-column">
            {images.map((image, index) => (
              <div
                key={image.image_id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleThumbnailClick(image)}
                className={`thumbnail-item ${
                  draggedIndex === index ? "dragging" : ""
                } ${dragOverIndex === index ? "drag-over" : ""}`}
              >
                <img
                  src={image.img_url}
                  alt={`Product ${index + 1}`}
                  className="thumbnail-image"
                />

                <div className="order-badge">{index + 1}</div>

                {image.is_primary && (
                  <div className="primary-badge">Primary</div>
                )}

                <div className="thumbnail-overlay">
                  <button
                    type="button"
                    className="thumbnail-icon"
                    onClick={(e) => handleSetPrimary(e, image.image_id)}
                    title="Set as primary (will apply on save)"
                  >
                    <Star
                      size={16}
                      className={`icon-star ${
                        image.is_primary ? "active" : ""
                      }`}
                      fill={image.is_primary ? "currentColor" : "none"}
                    />
                  </button>

                  <button
                    type="button"
                    className="thumbnail-icon"
                    onClick={(e) => handleDeleteImage(e, image.image_id)}
                    title="Delete image (will apply on save)"
                  >
                    <X size={16} className="icon-delete" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Main Image Display */}
          <div className="main-image-column">
            <div className="main-image-display">
              <div className="main-image-wrapper">
                {displayImage ? (
                  <img
                    src={displayImage.img_url}
                    alt="Product display image"
                    className="main-image"
                  />
                ) : (
                  <span style={{ color: "#999" }}>No images available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Upload className="empty-state-icon" size={64} />
          <p className="empty-state-text">No images yet</p>
        </div>
      )}

      {/* Upload Button */}
      <div className="upload-section">
        <button type="button" className="btn btn-upload" onClick={onUpload}>
          <Upload size={20} />
          Upload Product Image
        </button>
      </div>
    </div>
  );
};

export default ImageManager;
