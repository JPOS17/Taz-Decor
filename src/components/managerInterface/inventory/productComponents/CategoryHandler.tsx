import { useState } from "react";
import { Plus, X, Star, ChevronDown } from "lucide-react";
import type { Category } from "../../../../api/categories";
import type { ProductCategory } from "../../../../api/categoriesAssignments";
import { FormField } from "../../universal/FormField";
import { SelectInput } from "../../universal/SelectInput";
import ConfirmationModal from "../../universal/ConfirmationModal";

interface CategoryHandlerProps {
  productCategories: ProductCategory[];
  availableCategories: Category[];
  onAdd: (categoryId: number) => Promise<void>;
  onRemove: (categoryId: number) => Promise<void>;
  onSetPrimary: (categoryId: number) => Promise<void>;
  disabled?: boolean;
  error?: string;
}

// Manages product category assignments
const CategoryHandler = ({
  productCategories,
  availableCategories,
  onAdd,
  onRemove,
  onSetPrimary,
  disabled = false,
  error,
}: CategoryHandlerProps) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showQuickSwitch, setShowQuickSwitch] = useState(false);

  const [pendingAction, setPendingAction] = useState<{
    type: "remove" | "setPrimary" | "switchPrimary";
    categoryId: number;
    categoryName: string;
    needsAdd?: boolean;
  } | null>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Only unassigned, active categories are offered in the add dropdown
  const unassignedCategories = availableCategories.filter(
    (cat) =>
      !productCategories.some((pc) => pc.category_id === cat.category_id) &&
      cat.is_active,
  );

  const primaryCategory = productCategories.find((pc) => pc.is_primary);

  // All active categories except the current primary
  const switchableCategories = availableCategories.filter(
    (cat) => cat.is_active && cat.category_id !== primaryCategory?.category_id,
  );

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Calls onAdd with the selected category and resets the add dropdown state
  const handleAdd = async () => {
    if (!selectedCategoryId) return;

    await onAdd(parseInt(selectedCategoryId));
    setSelectedCategoryId("");
    setShowAddDropdown(false);
  };

  // Stages a remove action for confirmation before executing
  const handleRemoveClick = (categoryId: number, categoryName: string) => {
    setPendingAction({ type: "remove", categoryId, categoryName });
  };

  // Stages a set-primary action for confirmation before executing
  const handleSetPrimaryClick = (categoryId: number, categoryName: string) => {
    setPendingAction({ type: "setPrimary", categoryId, categoryName });
  };

  // Stages a quick-switch action — flags needsAdd if the target isn't already assigned
  const handleQuickSwitchClick = (categoryId: number, categoryName: string) => {
    if (categoryId === primaryCategory?.category_id) {
      setShowQuickSwitch(false);
      return;
    }

    const isAlreadyAssigned = productCategories.some(
      (pc) => pc.category_id === categoryId,
    );

    setPendingAction({
      type: "switchPrimary",
      categoryId,
      categoryName,
      needsAdd: !isAlreadyAssigned,
    });
  };

  // Executes the pending action after user confirmation
  const handleConfirm = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "remove") {
        await onRemove(pendingAction.categoryId);
      } else if (pendingAction.type === "setPrimary") {
        await onSetPrimary(pendingAction.categoryId);
      } else if (pendingAction.type === "switchPrimary") {
        const oldPrimaryCategoryId = primaryCategory?.category_id;

        // Add the new category first if it isn't already assigned
        if (pendingAction.needsAdd) {
          await onAdd(pendingAction.categoryId);
        }

        await onSetPrimary(pendingAction.categoryId);

        // If the old primary was the only category and a new one was added, remove the old one
        if (oldPrimaryCategoryId && pendingAction.needsAdd) {
          const wasOnlyCategory = productCategories.length === 1;
          if (wasOnlyCategory) {
            await onRemove(oldPrimaryCategoryId);
          }
        }
      }

      if (pendingAction.type === "switchPrimary") {
        setShowQuickSwitch(false);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Builds the confirmation modal message based on the pending action type
  const getModalMessage = () => {
    if (!pendingAction) return "";

    if (pendingAction.type === "remove") {
      return `Are you sure you want to remove ${pendingAction.categoryName} from this product?`;
    }

    if (pendingAction.type === "setPrimary") {
      const currentPrimary = primaryCategory
        ? ` This will replace ${primaryCategory.category_name} as the primary category.`
        : "";
      return `Are you sure you want to set ${pendingAction.categoryName} as the primary category?${currentPrimary}`;
    }

    if (pendingAction.type === "switchPrimary") {
      let message = `Are you sure you want to switch the primary category to ${pendingAction.categoryName}?`;
      if (primaryCategory) {
        message += ` Current primary: ${primaryCategory.category_name}.`;
        // Warn the user if the old primary will be removed as a result of the switch
        if (pendingAction.needsAdd && productCategories.length === 1) {
          message += ` Note: ${primaryCategory.category_name} will be removed from the product.`;
        }
      }
      return message;
    }

    return "";
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <FormField
      label="Categories"
      error={error}
      helperText={
        !error
          ? "Click the primary category to quickly switch to another category. Products must have at least one category."
          : undefined
      }
    >
      <div className="category-handler">
        {/* Primary category button */}
        {primaryCategory && (
          <div className="category-primary-container">
            <button
              type="button"
              onClick={() => setShowQuickSwitch(!showQuickSwitch)}
              disabled={disabled}
              className="category-primary-button"
            >
              <div className="category-primary-content">
                <span>{primaryCategory.category_name}</span>
                <span className="category-badge category-badge-primary">
                  PRIMARY
                </span>
                {/* Inactive badge shown when the assigned category has been deactivated */}
                {!primaryCategory.category_is_active && (
                  <span className="category-badge category-badge-inactive">
                    INACTIVE
                  </span>
                )}
              </div>
              <ChevronDown
                size={20}
                className={`category-chevron ${
                  showQuickSwitch ? "rotated" : ""
                }`}
              />
            </button>

            {/* Quick-switch dropdown */}
            {showQuickSwitch && (
              <div className="category-dropdown">
                {switchableCategories.length === 0 ? (
                  <div className="category-dropdown-empty">
                    No other categories available
                  </div>
                ) : (
                  switchableCategories.map((cat) => (
                    <button
                      key={cat.category_id}
                      type="button"
                      onClick={() =>
                        handleQuickSwitchClick(
                          cat.category_id,
                          cat.category_name,
                        )
                      }
                      disabled={disabled}
                      className="category-dropdown-item"
                    >
                      <span>{cat.category_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Additional (non-primary) categories */}
        {productCategories.filter((pc) => !pc.is_primary).length > 0 && (
          <div className="category-additional-container">
            <div className="category-additional-label">
              Additional Categories:
            </div>
            {productCategories
              .filter((pc) => !pc.is_primary)
              .map((pc) => (
                <div key={pc.category_id} className="category-item">
                  <div className="category-item-content">
                    <span>{pc.category_name}</span>
                    {!pc.category_is_active && (
                      <span className="category-badge category-badge-inactive">
                        INACTIVE
                      </span>
                    )}
                  </div>

                  <div className="category-item-actions">
                    <button
                      type="button"
                      onClick={() =>
                        handleSetPrimaryClick(pc.category_id, pc.category_name)
                      }
                      disabled={disabled}
                      className="category-action-button category-action-primary"
                      title="Set as primary category"
                    >
                      <Star size={14} />
                      Set Primary
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveClick(pc.category_id, pc.category_name)
                      }
                      disabled={disabled}
                      className="category-action-button category-action-remove"
                      title="Remove category"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Add Category */}
        {unassignedCategories.length > 0 && (
          <div className="category-add-container">
            {!showAddDropdown ? (
              <button
                type="button"
                onClick={() => setShowAddDropdown(true)}
                disabled={disabled}
                className="category-add-button"
              >
                <Plus size={16} />
                Add Category
              </button>
            ) : (
              // Inline select + confirm/cancel
              <div className="category-add-controls">
                <SelectInput
                  value={selectedCategoryId}
                  onChange={(value) => setSelectedCategoryId(value)}
                  options={unassignedCategories.map((cat) => ({
                    value: cat.category_id,
                    label: cat.category_name,
                  }))}
                  placeholder="-- Select Category --"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!selectedCategoryId || disabled}
                  className="category-add-confirm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDropdown(false);
                    setSelectedCategoryId("");
                  }}
                  disabled={disabled}
                  className="category-add-cancel"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation modal */}
        {pendingAction && (
          <ConfirmationModal
            title="Confirm Category Change"
            message={getModalMessage()}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            confirmText="Confirm"
            cancelText="Cancel"
          />
        )}
      </div>
    </FormField>
  );
};

export default CategoryHandler;
