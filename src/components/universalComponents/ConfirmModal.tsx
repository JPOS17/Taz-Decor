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

  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div
        className={`cm-modal cm-modal--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cm-icon">
          <FaExclamationTriangle size={40} />
        </div>
        <h3 className="cm-title">{title}</h3>
        <p className="cm-message">{message}</p>
        <div className="cm-actions">
          <button className="cm-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`cm-btn-confirm cm-btn-confirm--${variant}`}
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
