import { useState } from "react";
import { Star, X, Upload } from "lucide-react";
import type { VariantImage } from "../../../../api/inventory";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageManagerProps {
  images: VariantImage[];
  onReorder: (newOrder: VariantImage[]) => void;
  onSetPrimary: (imageId: number) => void;
  onDelete: (imageId: number) => void;
  onUpload: () => void;
}

// ============================================================================
// SORTABLE THUMBNAIL — individual draggable image tile
// ============================================================================

interface SortableThumbnailProps {
  image: VariantImage;
  index: number;
  isSelected: boolean;
  onClick: (image: VariantImage) => void;
  onSetPrimary: (e: React.MouseEvent, imageId: number) => void;
  onDelete: (e: React.MouseEvent, imageId: number) => void;
}

const SortableThumbnail = ({
  image,
  index,
  isSelected,
  onClick,
  onSetPrimary,
  onDelete,
}: SortableThumbnailProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.image_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const classes = [
    "thumbnail-item",
    isDragging ? "dragging" : "",
    isSelected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classes}
      {...attributes}
      {...listeners}
      onClick={() => onClick(image)}
    >
      <img
        src={image.img_url}
        alt={`Product ${index + 1}`}
        className="thumbnail-image"
        draggable={false}
      />
      <div className="order-badge">{index + 1}</div>
      {image.is_primary && <div className="primary-badge">Primary</div>}
      <div className="thumbnail-overlay">
        <button
          type="button"
          className="thumbnail-icon"
          onClick={(e) => onSetPrimary(e, image.image_id)}
          title="Set as primary (will apply on save)"
        >
          <Star
            size={16}
            className={`icon-star ${image.is_primary ? "active" : ""}`}
            fill={image.is_primary ? "currentColor" : "none"}
          />
        </button>
        <button
          type="button"
          className="thumbnail-icon"
          onClick={(e) => onDelete(e, image.image_id)}
          title="Delete image (will apply on save)"
        >
          <X size={16} className="icon-delete" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// IMAGE MANAGER
// ============================================================================

const ImageManager = ({
  images,
  onReorder,
  onSetPrimary,
  onDelete,
  onUpload,
}: ImageManagerProps) => {
  const [selectedImage, setSelectedImage] = useState<VariantImage | null>(null);

  // ============================================================================
  // DND-KIT SENSORS
  // ============================================================================

  const sensors = useSensors(
    useSensor(TouchSensor, {
      // 250ms press activates drag; 5px tolerance prevents accidental drags on taps
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(PointerSensor, {
      // 8px movement required before drag starts on desktop
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ============================================================================
  // DRAG END
  // ============================================================================

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.image_id === active.id);
    const newIndex = images.findIndex((img) => img.image_id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(images, oldIndex, newIndex).map(
      (img, index) => ({ ...img, display_order: index + 1 }),
    );

    onReorder(reordered);
  };

  // ============================================================================
  // OTHER HANDLERS
  // ============================================================================

  const handleThumbnailClick = (image: VariantImage) => setSelectedImage(image);

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
      if (selectedImage?.image_id === imageId) setSelectedImage(null);
    }
  };

  const primaryImage = images.find((img) => img.is_primary);
  const displayImage = selectedImage || primaryImage || images[0];

  return (
    <div className="image-management-section">
      <h3 className="form-label">Product Images</h3>

      {images.length > 0 ? (
        <div className="image-layout">
          {/* Thumbnail Column */}
          <div className="thumbnail-column">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((img) => img.image_id)}
                strategy={rectSortingStrategy}
              >
                {images.map((image, index) => (
                  <SortableThumbnail
                    key={image.image_id}
                    image={image}
                    index={index}
                    isSelected={selectedImage?.image_id === image.image_id}
                    onClick={handleThumbnailClick}
                    onSetPrimary={handleSetPrimary}
                    onDelete={handleDeleteImage}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
                  <span className="main-image-empty">No images available</span>
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

      <div className="upload-section">
        <button type="button" className="btn-upload" onClick={onUpload}>
          <Upload size={20} />
          Upload Product Image
        </button>
      </div>
    </div>
  );
};

export default ImageManager;
