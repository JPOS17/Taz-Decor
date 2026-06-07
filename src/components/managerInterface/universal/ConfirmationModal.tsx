interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

// Renders a modal dialog prompting the user to confirm or cancel a destructive action
const ConfirmationModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmationModalProps) => {
  return (
    <div className="confirmation-modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>

        {/* Action buttons — cancel always appears first (left) */}
        <div className="confirmation-modal-buttons">
          <button className="btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
