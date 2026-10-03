import { Plus, Save, Trash2, Eye, EyeOff, X } from "lucide-react";

type ViewMode = "edit" | "create-product" | "create-variant";

interface ActionButtonsProps {
  viewMode: ViewMode;
  loading: boolean;
  isActive?: boolean;
  hasUnsavedChanges?: boolean;
  isFormValid?: boolean;
  onNewVariant?: () => void;
  onToggleStatus?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onSubmitForm?: () => void;
}

// Renders the correct set of action buttons based on the current view mode.
// Save / Create is always the single filled button; the rest are outlined or ghost.
export const ActionButtons = ({
  viewMode,
  loading,
  isActive,
  hasUnsavedChanges = false,
  isFormValid = true,
  onNewVariant,
  onToggleStatus,
  onSave,
  onDelete,
  onCancel,
  onSubmitForm,
}: ActionButtonsProps) => {
  // Create modes each return their own minimal button set
  if (viewMode === "create-product" || viewMode === "create-variant") {
    const createLabel =
      viewMode === "create-product" ? "Create Product" : "Create Variant";

    return (
      <div className="action-buttons">
        <button
          type="button"
          className="action-buttons-btn-cancel-inline"
          onClick={onCancel}
          disabled={loading}
        >
          <X size={16} aria-hidden="true" />
          Cancel
        </button>
        <button
          type="button"
          className="action-buttons-btn-save"
          onClick={(e) => {
            e.preventDefault();
            onSubmitForm?.();
          }}
          disabled={loading}
        >
          <Save size={16} aria-hidden="true" />
          {createLabel}
        </button>
      </div>
    );
  }

  // Default edit mode
  return (
    <div className="action-buttons">
      {/* New Variant */}
      <button
        type="button"
        className="action-buttons-btn-new-variant"
        onClick={onNewVariant}
        disabled={loading || hasUnsavedChanges}
        title={
          hasUnsavedChanges ? "Save or discard your changes first" : undefined
        }
      >
        <Plus size={16} aria-hidden="true" />
        New Variant
      </button>

      {/* Toggle button label and style swap based on current active state */}
      <button
        type="button"
        className={
          isActive
            ? "action-buttons-btn-deactivate"
            : "action-buttons-btn-activate"
        }
        onClick={onToggleStatus}
        disabled={loading}
      >
        {isActive ? (
          <>
            <EyeOff size={16} aria-hidden="true" />
            Deactivate
          </>
        ) : (
          <>
            <Eye size={16} aria-hidden="true" />
            Activate
          </>
        )}
      </button>

      <button
        type="button"
        className="action-buttons-btn-delete"
        onClick={onDelete}
        disabled={loading}
      >
        <Trash2 size={16} aria-hidden="true" />
        Delete
      </button>

      <span className="action-buttons-divider" aria-hidden="true" />

      {/* Save */}
      <button
        type="button"
        className="action-buttons-btn-save"
        onClick={onSave}
        disabled={loading || !hasUnsavedChanges || !isFormValid}
      >
        <Save size={16} aria-hidden="true" />
        Save Changes
      </button>
    </div>
  );
};
