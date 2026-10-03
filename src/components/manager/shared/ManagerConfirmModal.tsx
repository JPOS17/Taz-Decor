import { useEffect, useId } from "react";

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  // "danger" turns the confirm button red (use for deletes and other destructive actions)
  tone?: "default" | "danger";
}

// Renders a modal dialog prompting the user to confirm or cancel an action
const ConfirmationModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "default",
}: ConfirmationModalProps) => {
  const titleId = useId();

  // Close the dialog when Escape is pressed
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="manager-confirm-modal-overlay" onClick={onCancel}>
      <div
        className="manager-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="manager-confirm-modal-title">
          {title}
        </h3>
        <p className="manager-confirm-modal-message">{message}</p>

        {/* Action buttons */}
        <div className="manager-confirm-modal-actions">
          <button className="manager-confirm-modal-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`manager-confirm-modal-btn ${
              tone === "danger"
                ? "manager-confirm-modal-btn--danger"
                : "manager-confirm-modal-btn--confirm"
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;