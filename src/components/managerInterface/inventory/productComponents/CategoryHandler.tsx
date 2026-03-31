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

const CategoryHandler = ({
  productCategories,
  availableCategories,
  onAdd,
  onRemove,
  onSetPrimary,
  disabled = false,
  error,
}: CategoryHandlerProps) => {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showQuickSwitch, setShowQuickSwitch] = useState(false);

  // Confirmation states
  const [pendingAction, setPendingAction] = useState<{
    type: "remove" | "setPrimary" | "switchPrimary";
    categoryId: number;
    categoryName: string;
    needsAdd?: boolean;
  } | null>(null);

  // Get categories not yet assigned
  const unassignedCategories = availableCategories.filter(
    (cat) =>
      !productCategories.some((pc) => pc.category_id === cat.category_id) &&
      cat.is_active,
  );

  // Get primary category
  const primaryCategory = productCategories.find((pc) => pc.is_primary);

  // Get all active categories for quick switch (excluding current primary)
  const switchableCategories = availableCategories.filter(
    (cat) => cat.is_active && cat.category_id !== primaryCategory?.category_id,
  );

  const handleAdd = async () => {
    if (!selectedCategoryId) return;

    await onAdd(parseInt(selectedCategoryId));
    setSelectedCategoryId("");
    setShowAddDropdown(false);
  };

  const handleRemoveClick = (categoryId: number, categoryName: string) => {
    setPendingAction({ type: "remove", categoryId, categoryName });
  };

  const handleSetPrimaryClick = (categoryId: number, categoryName: string) => {
    setPendingAction({ type: "setPrimary", categoryId, categoryName });
  };

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

  const handleConfirm = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "remove") {
        await onRemove(pendingAction.categoryId);
      } else if (pendingAction.type === "setPrimary") {
        await onSetPrimary(pendingAction.categoryId);
      } else if (pendingAction.type === "switchPrimary") {
        const oldPrimaryCategoryId = primaryCategory?.category_id;

        if (pendingAction.needsAdd) {
          await onAdd(pendingAction.categoryId);
        }

        await onSetPrimary(pendingAction.categoryId);

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

  // Generate modal message based on action type
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
        if (pendingAction.needsAdd && productCategories.length === 1) {
          message += ` Note: ${primaryCategory.category_name} will be removed from the product.`;
        }
      }
      return message;
    }

    return "";
  };

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
        {/* Quick Switch Dropdown */}
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

        {/* Current Categories (non-primary) */}
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

        {/* Confirmation Modal */}
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
