import { useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

import "../../../styles/components/customerInterface/items/ImageLightbox.css";

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
    <div className="lightbox-overlay" onClick={onClose}>
      {/* Row 1 — close button */}
      <div className="lightbox-row-top">
        <button
          className="lightbox-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <FaTimes />
        </button>
      </div>

      {/* Row 2 — main image */}
      <div className="lightbox-row-middle">
        <div
          className="lightbox-main-image-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex]}
            alt={`${productName} view ${currentIndex + 1}`}
            className="lightbox-image"
          />
        </div>
      </div>

      {/* Row 3 — thumbnail strip */}
      <div className="lightbox-row-thumbnails">
        <div
          className="lightbox-thumbnails-strip"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className={`lightbox-thumbnail${currentIndex === index ? " lightbox-thumbnail-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIndex(index);
              }}
            />
          ))}
        </div>
      </div>

      {/* Row 4 — prev / counter / next */}
      <div className="lightbox-row-bottom">
        <div className="lightbox-controls" onClick={(e) => e.stopPropagation()}>
          <button
            className="lightbox-nav-button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <FaChevronLeft />
          </button>
          <div className="lightbox-counter">
            {currentIndex + 1} / {images.length}
          </div>
          <button
            className="lightbox-nav-button"
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
