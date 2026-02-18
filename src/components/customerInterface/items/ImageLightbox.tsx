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
      {/* Exit button */}
      <button className="lightbox-close" onClick={onClose}>
        <FaTimes />
      </button>

      <div className="lightbox-layout" onClick={(e) => e.stopPropagation()}>
        {/* Thumbnail strip on the left */}
        <div className="lightbox-thumbnails-vertical">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className={`lightbox-thumbnail ${
                currentIndex === index ? "active" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIndex(index);
              }}
            />
          ))}
        </div>

        {/* Main image section with arrows */}
        <div className="lightbox-main-section">
          {/* Left arrow */}
          <button
            className="lightbox-nav lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <FaChevronLeft />
          </button>

          {/* Main image with counter */}
          <div className="lightbox-content">
            <div className="lightbox-image-container">
              <img
                src={images[currentIndex]}
                alt={`${productName} view ${currentIndex + 1}`}
                className="lightbox-image"
              />
            </div>
            <div className="lightbox-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Right arrow */}
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
