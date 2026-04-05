import { useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../../styles/pages/main/Listing.css";

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

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      {/* ── ROW 1: Top bar with close button ── */}
      <div className="lightbox-row-top" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* ── ROW 2: Main image only ── */}
      <div className="lightbox-row-middle" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-main-image-wrap">
          <img
            src={images[currentIndex]}
            alt={`${productName} view ${currentIndex + 1}`}
            className="lightbox-image"
          />
        </div>
      </div>

      {/* ── ROW 3: Thumbnail strip (horizontal, below image) ── */}
      <div
        className="lightbox-row-thumbnails"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightbox-thumbnails-vertical">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className={`lightbox-thumbnail ${currentIndex === index ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIndex(index);
              }}
            />
          ))}
        </div>
      </div>

      {/* ── ROW 4: < counter > — centered to main image column width ── */}
      <div className="lightbox-row-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-controls">
          <button
            className="lightbox-nav lightbox-prev"
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
            className="lightbox-nav lightbox-next"
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
