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
  if (!isOpen) return null;

  const confirmBtnVariantClass = {
    danger: "confirm-modal-btn-confirm--danger",
    warning: "confirm-modal-btn-confirm--warning",
    info: "confirm-modal-btn-confirm--info",
  }[variant];

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div
        className={`confirm-modal confirm-modal--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-icon">
          <FaExclamationTriangle size={40} />
        </div>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
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
