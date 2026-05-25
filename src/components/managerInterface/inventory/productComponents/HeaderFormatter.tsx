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

export const HeaderFormatter = ({
  viewMode,
  ...buttonProps
}: DetailsHeaderProps) => {
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

  return (
    <div className="mi-details-header">
      <h2 className="mi-details-title">{getTitle()}</h2>
      <ActionButtons viewMode={viewMode} {...buttonProps} />
    </div>
  );
};
