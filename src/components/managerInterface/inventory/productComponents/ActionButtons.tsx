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
  if (viewMode === "create-product") {
    return (
      <div className="action-buttons">
        <button
          className="btn btn-save"
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
          className="btn-cancel-inline"
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
      <div className="action-buttons">
        <button
          className="btn btn-save"
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
          className="btn-cancel-inline"
          onClick={onCancel}
          disabled={loading}
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="action-buttons">
      <button
        className="btn btn-new-variant"
        onClick={onNewVariant}
        disabled={loading || hasUnsavedChanges}
      >
        <Plus size={18} />
        New Variant
      </button>
      <button
        className={`btn ${isActive ? "btn-deactivate" : "btn-activate"}`}
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
      <button
        className="btn btn-save"
        onClick={onSave}
        disabled={loading || !hasUnsavedChanges || !isFormValid}
      >
        <Save size={18} />
        Save Changes
      </button>
      <button className="btn btn-delete" onClick={onDelete} disabled={loading}>
        <Trash2 size={18} />
        Delete
      </button>
    </div>
  );
};
