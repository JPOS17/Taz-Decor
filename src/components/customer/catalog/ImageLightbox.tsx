import { useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface LightboxProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  productName: string;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectIndex: (index: number) => void;
}

const Lightbox = ({
  isOpen,
  images,
  currentIndex,
  productName,
  onClose,
  onNext,
  onPrev,
  onSelectIndex,
}: LightboxProps) => {
  // Keyboard navigation — Escape closes, arrow keys step through images
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="image-lightbox-overlay" onClick={onClose}>
      {/* Row 1 — close button */}
      <div className="image-lightbox-row-top">
        <button
          className="image-lightbox-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <FaTimes />
        </button>
      </div>

      {/* Row 2 — main image */}
      <div className="image-lightbox-row-middle">
        <div
          className="image-lightbox-main-image-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex]}
            alt={`${productName} view ${currentIndex + 1}`}
            className="image-lightbox-image"
          />
        </div>
      </div>

      {/* Row 3 — thumbnail strip */}
      <div className="image-lightbox-row-thumbnails">
        <div
          className="image-lightbox-thumbnails-strip"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className={`image-lightbox-thumbnail${currentIndex === index ? " image-lightbox-thumbnail-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIndex(index);
              }}
            />
          ))}
        </div>
      </div>

      {/* Row 4 — prev / counter / next */}
      <div className="image-lightbox-row-bottom">
        <div className="image-lightbox-controls" onClick={(e) => e.stopPropagation()}>
          <button
            className="image-lightbox-nav-button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <FaChevronLeft />
          </button>
          <div className="image-lightbox-counter">
            {currentIndex + 1} / {images.length}
          </div>
          <button
            className="image-lightbox-nav-button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
