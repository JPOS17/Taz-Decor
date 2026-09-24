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

// Renders the correct set of action buttons based on the current view mode
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
  if (viewMode === "create-product") {
    return (
      <div className="mi-action-buttons">
        <button
          className="mi-btn-save"
          onClick={(e) => {
            e.preventDefault();
            onSubmitForm?.();
          }}
          disabled={loading}
        >
          <Save size={18} />
          Create Product
        </button>
        <button
          className="mi-btn-cancel-inline"
          onClick={onCancel}
          disabled={loading}
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    );
  }

  if (viewMode === "create-variant") {
    return (
      <div className="mi-action-buttons">
        <button
          className="mi-btn-save"
          onClick={(e) => {
            e.preventDefault();
            onSubmitForm?.();
          }}
          disabled={loading}
        >
          <Save size={18} />
          Create Variant
        </button>
        <button
          className="mi-btn-cancel-inline"
          onClick={onCancel}
          disabled={loading}
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    );
  }

  // Default edit mode
  return (
    <div className="mi-action-buttons">
      {/* New Variant */}
      <button
        className="mi-btn-new-variant"
        onClick={onNewVariant}
        disabled={loading || hasUnsavedChanges}
      >
        <Plus size={18} />
        New Variant
      </button>

      {/* Toggle button label and style swap based on current active state */}
      <button
        className={isActive ? "mi-btn-deactivate" : "mi-btn-activate"}
        onClick={onToggleStatus}
        disabled={loading}
      >
        {isActive ? (
          <>
            <EyeOff size={18} />
            Deactivate
          </>
        ) : (
          <>
            <Eye size={18} />
            Activate
          </>
        )}
      </button>

      {/* Save */}
      <button
        className="mi-btn-save"
        onClick={onSave}
        disabled={loading || !hasUnsavedChanges || !isFormValid}
      >
        <Save size={18} />
        Save Changes
      </button>

      <button className="mi-btn-delete" onClick={onDelete} disabled={loading}>
        <Trash2 size={18} />
        Delete
      </button>
    </div>
  );
};
