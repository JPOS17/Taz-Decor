import { FaExclamationTriangle } from "react-icons/fa";
import "../../styles/components/universal/ConfirmModal.css";

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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-icon">
          <FaExclamationTriangle size={40} />
        </div>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>

        {/* Action buttons */}
        <div className="confirm-modal-actions">
          <button className="confirm-modal-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
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
