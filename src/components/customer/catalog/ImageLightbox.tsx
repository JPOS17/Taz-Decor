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
  const hasMultipleImages = images.length > 1;

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

  // Prevent the page behind the lightbox from scrolling while it is open
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className="image-lightbox-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} image viewer`}
    >
      {/* Row 1 — counter and close button */}
      <div className="image-lightbox-row-top">
        <span className="image-lightbox-counter" aria-live="polite">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          type="button"
          className="image-lightbox-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close image viewer"
        >
          <FaTimes />
        </button>
      </div>

      {/* Row 2 — previous, main image, next */}
      <div className="image-lightbox-row-middle">
        {hasMultipleImages && (
          <button
            type="button"
            className="image-lightbox-nav-button image-lightbox-nav-prev"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous image"
          >
            <FaChevronLeft />
          </button>
        )}

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

        {hasMultipleImages && (
          <button
            type="button"
            className="image-lightbox-nav-button image-lightbox-nav-next"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next image"
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      {/* Row 3 — thumbnail strip */}
      {hasMultipleImages && (
        <div className="image-lightbox-row-thumbnails">
          <div
            className="image-lightbox-thumbnails-strip"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, index) => (
              <button
                key={index}
                type="button"
                className={`image-lightbox-thumbnail${currentIndex === index ? " image-lightbox-thumbnail-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIndex(index);
                }}
                aria-label={`Show image ${index + 1}`}
                aria-current={currentIndex === index ? "true" : undefined}
              >
                <img src={img} alt="" className="image-lightbox-thumbnail-img" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Lightbox;