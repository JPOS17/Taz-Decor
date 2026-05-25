import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  type Category,
} from "../../../api/categories";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";
import { ToastNotification } from "../../../components/managerInterface/universal/ToastNotifications";
import ConfirmationModal from "../../../components/managerInterface/universal/ConfirmationModal";

import { useConfirmationModal } from "../../../hooks/useConfirmationModal";
import { formatName } from "../../../utils/nameFormatter";

import "../../../styles/pages/managerInterface/Tokens.css";
import "../../../styles/pages/managerInterface/Components.css";
import "../../../styles/pages/managerInterface/ManagerShared.css";
import "../../../styles/pages/managerInterface/ManageCategories.css";

interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

type EditMode = "none" | "edit" | "create";

// ============================================================================
// SORTABLE ROW — individual draggable category row
// ============================================================================

interface SortableRowProps {
  category: Category;
  editMode: EditMode;
  loading: boolean;
  hasOrderChanged: boolean;
  editingCategory: Category | null;
  onEdit: (category: Category) => void;
  onRequestDelete: (category: Category) => void;
  onRequestToggleActive: (category: Category) => void;
}

const SortableRow = ({
  category,
  editMode,
  loading,
  hasOrderChanged,
  editingCategory,
  onEdit,
  onRequestDelete,
  onRequestToggleActive,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.category_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDragDisabled = editMode !== "none" || loading;

  const rowClasses = [
    "mc-row",
    editingCategory?.category_id === category.category_id
      ? "mc-row--editing"
      : "",
    isDragging ? "mc-row--dragging" : "",
    !category.is_active ? "mc-row--inactive" : "",
    isDragDisabled ? "mc-row--no-drag" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={rowClasses}
      {...(!isDragDisabled ? { ...attributes, ...listeners } : {})}
    >
      <div className="mc-row-left">
        {!isDragDisabled && (
          <div className="mc-drag-handle">
            <GripVertical size={20} />
          </div>
        )}
        <div className="mc-row-info">
          <div className="mc-row-name-row">
            <h4 className="mc-row-name">{category.category_name}</h4>
            {!category.is_active && (
              <span className="mc-badge-disabled">Disabled</span>
            )}
          </div>
          <p className="mc-row-order">
            Display Order: {category.display_order}
          </p>
        </div>
      </div>

      <div className="mc-row-actions">
        <button
          className={`mc-btn ${category.is_active ? "mc-btn-warning" : "mc-btn-success"}`}
          onClick={() => onRequestToggleActive(category)}
          disabled={loading || editMode !== "none" || hasOrderChanged}
          title={category.is_active ? "Disable category" : "Enable category"}
        >
          {category.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
          {category.is_active ? "Disable" : "Enable"}
        </button>
        <button
          className="mc-btn mc-btn-primary"
          onClick={() => onEdit(category)}
          disabled={loading || editMode !== "none" || hasOrderChanged}
        >
          <Edit2 size={15} />
          Edit
        </button>
        <button
          className="mc-btn mc-btn-danger"
          onClick={() => onRequestDelete(category)}
          disabled={loading || editMode !== "none" || hasOrderChanged}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MANAGE CATEGORIES COMPONENT
// ============================================================================

const ManageCategories = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const deleteConfirmation = useConfirmationModal();
  const saveOrderConfirmation = useConfirmationModal();
  const toggleActiveConfirmation = useConfirmationModal();

  // ============================================================================
  // DND-KIT SENSORS
  // Handles mouse, touch, and keyboard all in one
  // ============================================================================

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories(true);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showMessage("Failed to fetch categories", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // ============================================================================
  // EVENT HANDLERS — EDIT FORM
  // ============================================================================

  const handleCreateNew = () => {
    setEditMode("create");
    setCategoryName("");
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditMode("edit");
    setEditingCategory(category);
    setCategoryName(category.category_name);
  };

  const handleCancelEdit = () => {
    setEditMode("none");
    setEditingCategory(null);
    setCategoryName("");
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      showMessage("Category name cannot be empty", "warning");
      return;
    }

    const formattedName = formatName(categoryName);

    setLoading(true);
    try {
      if (editMode === "create") {
        await createCategory({ category_name: formattedName });
        showMessage(
          `Category "${formattedName}" created successfully!`,
          "success",
        );
      } else if (editMode === "edit" && editingCategory) {
        await updateCategory(editingCategory.category_id, {
          category_name: formattedName,
        });
        showMessage(
          `Category updated to "${formattedName}" successfully!`,
          "success",
        );
      }

      await loadCategories();
      handleCancelEdit();
    } catch (error: any) {
      console.error("Error saving category:", error);
      if (error.message?.includes("already exists")) {
        showMessage("A category with this name already exists", "error");
      } else {
        showMessage("Failed to save category", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS — DELETE & TOGGLE
  // ============================================================================

  const handleRequestDelete = (category: Category) => {
    deleteConfirmation.showConfirmation({
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.category_name}"? This action cannot be undone and may affect existing products.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => confirmDelete(category),
    });
  };

  const confirmDelete = async (category: Category) => {
    setLoading(true);
    try {
      await deleteCategory(category.category_id);
      showMessage("Category deleted successfully!", "success");
      await loadCategories();
      setHasOrderChanged(false);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      if (error.message?.includes("existing products")) {
        showMessage("Cannot delete category with existing products", "error");
      } else {
        showMessage("Failed to delete category", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToggleActive = (category: Category) => {
    const action = category.is_active ? "disable" : "enable";
    toggleActiveConfirmation.showConfirmation({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Category`,
      message: `Are you sure you want to ${action} "${category.category_name}"? ${
        category.is_active
          ? "This will hide the category and its products from customers."
          : "This will make the category and its products visible to customers."
      }`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
      onConfirm: () => confirmToggleActive(category),
    });
  };

  const confirmToggleActive = async (category: Category) => {
    setLoading(true);
    try {
      await updateCategory(category.category_id, {
        is_active: !category.is_active,
      });
      const action = category.is_active ? "disabled" : "enabled";
      showMessage(`Category ${action} successfully!`, "success");
      await loadCategories();
    } catch (error: any) {
      console.error("Error toggling category active state:", error);
      showMessage("Failed to update category status", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS — DRAG END (dnd-kit)
  // Called once when the user drops
  // ============================================================================

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(
      (cat) => cat.category_id === active.id,
    );
    const newIndex = categories.findIndex((cat) => cat.category_id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categories, oldIndex, newIndex).map(
      (cat, index) => ({ ...cat, display_order: index + 1 }),
    );

    setCategories(reordered);
    setHasOrderChanged(true);
  };

  // ============================================================================
  // EVENT HANDLERS — ORDER
  // ============================================================================

  const handleSaveOrder = () => {
    saveOrderConfirmation.showConfirmation({
      title: "Save Category Order",
      message:
        "Are you sure you want to save this new category order? This will affect how categories appear to customers.",
      confirmText: "Save Order",
      cancelText: "Cancel",
      onConfirm: confirmSaveOrder,
    });
  };

  const confirmSaveOrder = async () => {
    setLoading(true);
    try {
      const reorderPayload = categories.map((cat) => ({
        category_id: cat.category_id,
        display_order: cat.display_order,
      }));

      await reorderCategories(reorderPayload);
      showMessage("Category order saved successfully!", "success");
      setHasOrderChanged(false);
      await loadCategories();
    } catch (error) {
      console.error("Error saving category order:", error);
      showMessage("Failed to save category order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    loadCategories();
    setHasOrderChanged(false);
    showMessage("Category order changes discarded", "warning");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-page accent-inventory">
      {/* Header */}
      <div className="mgr-header">
        <div className="mgr-header-inner">
          <div>
            <button
              className="mgr-back-button"
              onClick={() => navigate("/manager/inventory")}
            >
              <ArrowLeft size={16} />
              Back to Product Management
            </button>
            <h1 className="mgr-header-title">Manage Categories</h1>
            <p className="mgr-header-subtitle">
              Create, edit, and organize product categories
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mgr-container">
        <div className="mgr-body">
          <div className="mc-panel">
            {/* Panel header */}
            <div className="mc-panel-header">
              <h2 className="mc-panel-title">Categories</h2>
              <div className="mc-header-actions">
                {hasOrderChanged && (
                  <>
                    <button
                      className="mc-btn mc-btn-secondary"
                      onClick={handleCancelOrder}
                      disabled={loading}
                    >
                      <X size={16} />
                      Cancel Order
                    </button>
                    <button
                      className="mc-btn mc-btn-success"
                      onClick={handleSaveOrder}
                      disabled={loading}
                    >
                      <Save size={16} />
                      Save Order
                    </button>
                  </>
                )}
                {editMode === "none" && !hasOrderChanged && (
                  <button
                    className="mc-btn mc-btn-primary"
                    onClick={handleCreateNew}
                    disabled={loading}
                  >
                    <Plus size={16} />
                    New Category
                  </button>
                )}
              </div>
            </div>

            {/* Create / Edit form */}
            {editMode !== "none" && (
              <div className="mc-form">
                <h3 className="mc-form-title">
                  {editMode === "create"
                    ? "Create New Category"
                    : "Edit Category"}
                </h3>
                <div className="mc-form-group">
                  <label className="mc-form-label">Category Name *</label>
                  <input
                    type="text"
                    className="mc-form-input"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      else if (e.key === "Escape") handleCancelEdit();
                    }}
                  />
                  {categoryName.trim() &&
                    categoryName.trim() !== formatName(categoryName) && (
                      <div className="mc-name-preview">
                        <strong>Will be saved as:</strong>{" "}
                        {formatName(categoryName)}
                      </div>
                    )}
                  <p className="mc-form-hint">
                    Note: Words like "of", "in", "on", "the", "and" will be
                    lowercase (except at start/end)
                  </p>
                </div>
                <div className="mc-form-actions">
                  <button
                    className="mc-btn mc-btn-success"
                    onClick={handleSave}
                    disabled={loading || !categoryName.trim()}
                  >
                    <Save size={16} />
                    {editMode === "create" ? "Create" : "Save Changes"}
                  </button>
                  <button
                    className="mc-btn mc-btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && categories.length === 0 ? (
              <LoadingSpinner message="Loading categories..." />
            ) : (
              // DndContext wraps the whole sortable list and handle mouse, touch, and keyboard
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((cat) => cat.category_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mc-list">
                    {categories.map((category) => (
                      <SortableRow
                        key={category.category_id}
                        category={category}
                        editMode={editMode}
                        loading={loading}
                        hasOrderChanged={hasOrderChanged}
                        editingCategory={editingCategory}
                        onEdit={handleEdit}
                        onRequestDelete={handleRequestDelete}
                        onRequestToggleActive={handleRequestToggleActive}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Empty state */}
            {!loading && categories.length === 0 && (
              <div className="mc-empty">
                <p>
                  No categories found. Create your first category to get
                  started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {message && (
        <ToastNotification message={message.text} type={message.type} />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmation.isOpen && deleteConfirmation.config && (
        <ConfirmationModal
          title={deleteConfirmation.config.title}
          message={deleteConfirmation.config.message}
          confirmText={deleteConfirmation.config.confirmText}
          cancelText={deleteConfirmation.config.cancelText}
          onConfirm={deleteConfirmation.handleConfirm}
          onCancel={deleteConfirmation.handleCancel}
        />
      )}

      {/* Save Order Confirmation */}
      {saveOrderConfirmation.isOpen && saveOrderConfirmation.config && (
        <ConfirmationModal
          title={saveOrderConfirmation.config.title}
          message={saveOrderConfirmation.config.message}
          confirmText={saveOrderConfirmation.config.confirmText}
          cancelText={saveOrderConfirmation.config.cancelText}
          onConfirm={saveOrderConfirmation.handleConfirm}
          onCancel={saveOrderConfirmation.handleCancel}
        />
      )}

      {/* Toggle Active Confirmation */}
      {toggleActiveConfirmation.isOpen && toggleActiveConfirmation.config && (
        <ConfirmationModal
          title={toggleActiveConfirmation.config.title}
          message={toggleActiveConfirmation.config.message}
          confirmText={toggleActiveConfirmation.config.confirmText}
          cancelText={toggleActiveConfirmation.config.cancelText}
          onConfirm={toggleActiveConfirmation.handleConfirm}
          onCancel={toggleActiveConfirmation.handleCancel}
        />
      )}
    </div>
  );
};

export default ManageCategories;
