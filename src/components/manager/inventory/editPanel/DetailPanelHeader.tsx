import { ActionButtons } from "./ActionButtons";

type ViewMode = "edit" | "create-product" | "create-variant";

interface DetailsHeaderProps {
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

// Renders the sticky detail panel header: title, status chips and action buttons
export const HeaderFormatter = ({
  viewMode,
  ...buttonProps
}: DetailsHeaderProps) => {
  // Returns the panel title string based on the current view mode
  const getTitle = () => {
    switch (viewMode) {
      case "create-product":
        return "Create New Product";
      case "create-variant":
        return "Create New Variant";
      case "edit":
        return "Edit Product";
      default:
        return "";
    }
  };

  const { isActive, hasUnsavedChanges } = buttonProps;
  const isEditing = viewMode === "edit";

  return (
    <div className="detail-panel-header">
      <div className="detail-panel-header-heading">
        <h2 className="detail-panel-header-title">{getTitle()}</h2>

        {/* Status chips — only meaningful while editing an existing product */}
        {isEditing && isActive !== undefined && (
          <span
            className={`detail-panel-header-chip ${
              isActive
                ? "detail-panel-header-chip--active"
                : "detail-panel-header-chip--inactive"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        )}
        {isEditing && hasUnsavedChanges && (
          <span className="detail-panel-header-chip detail-panel-header-chip--unsaved">
            Unsaved changes
          </span>
        )}
      </div>

      {/* All remaining props forwarded directly to ActionButtons */}
      <ActionButtons viewMode={viewMode} {...buttonProps} />
    </div>
  );
};
