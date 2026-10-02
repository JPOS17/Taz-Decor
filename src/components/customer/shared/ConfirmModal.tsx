import { useEffect, useId, useRef } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

// Generic confirmation dialog
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const titleId = useId();
  const messageId = useId();
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // While open: focus the safe action (Cancel) and let Escape dismiss the dialog
  useEffect(() => {
    if (!isOpen) return;

    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  // Render nothing when the modal is closed
  if (!isOpen) return null;

  // Maps variant to the corresponding confirm button modifier class
  const confirmBtnVariantClass = {
    danger: "confirm-modal-btn-confirm--danger",
    warning: "confirm-modal-btn-confirm--warning",
    info: "confirm-modal-btn-confirm--info",
  }[variant];

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      {/* Stop propagation so clicking inside the modal doesn't close it */}
      <div
        className={`confirm-modal confirm-modal--${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-icon" aria-hidden="true">
          <FaExclamationTriangle size={26} />
        </div>
        <h3 id={titleId} className="confirm-modal-title">
          {title}
        </h3>
        <p id={messageId} className="confirm-modal-message">
          {message}
        </p>

        {/* Action buttons */}
        <div className="confirm-modal-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="confirm-modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn-confirm ${confirmBtnVariantClass}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;