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
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  type Category,
} from "../../../api/categories";

import { ToastNotification } from "../../../components/managerInterface/universal/ToastNotifications";
import ConfirmationModal from "../../../components/managerInterface/universal/ConfirmationModal";

import { useConfirmationModal } from "../../../hooks/useConfirmationModal";

import { formatName } from "../../../utils/nameFormatter";

import "../../../styles/pages/manager/InventoryDashboard.css";

interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

type EditMode = "none" | "edit" | "create";

// ============================================================================
// MANAGE CATEGORIES COMPONENT
// ============================================================================

const ManageCategories = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Category data
  const [categories, setCategories] = useState<Category[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [hasOrderChanged, setHasOrderChanged] = useState(false);

  // Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Confirmation modals
  const deleteConfirmation = useConfirmationModal();
  const saveOrderConfirmation = useConfirmationModal();
  const toggleActiveConfirmation = useConfirmationModal();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      // Load all categories including inactive ones for management
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
      message: `Are you sure you want to ${action} "${
        category.category_name
      }"? ${
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
  // EVENT HANDLERS — DRAG AND DROP
  // ============================================================================

  const handleDragStart = (categoryId: number) => {
    setDraggedItem(categoryId);
  };

  const handleDragOver = (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === targetCategoryId) return;

    const draggedIndex = categories.findIndex(
      (cat) => cat.category_id === draggedItem,
    );
    const targetIndex = categories.findIndex(
      (cat) => cat.category_id === targetCategoryId,
    );

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    // Update display_order based on new positions
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      display_order: index + 1,
    }));

    setCategories(updatedCategories);
    setHasOrderChanged(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
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
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <button
            onClick={() => navigate("/manager/inventory")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              marginBottom: "0.5rem",
              padding: "0.5rem",
            }}
          >
            <ArrowLeft size={20} />
            Back to Product Management
          </button>
          <h1 className="dashboard-title">Manage Categories</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Create, edit, and organize product categories
          </p>
        </div>
      </div>

      <div className="container">
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            padding: "1.5rem",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <h2 style={{ margin: 0, color: "#753a1e" }}>Categories</h2>
            <div
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              {hasOrderChanged && (
                <>
                  <button
                    onClick={handleCancelOrder}
                    disabled={loading}
                    style={{
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.75rem 1.5rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    <X size={18} />
                    Cancel Order
                  </button>
                  <button
                    onClick={handleSaveOrder}
                    disabled={loading}
                    style={{
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.75rem 1.5rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    <Save size={18} />
                    Save Order
                  </button>
                </>
              )}
              {editMode === "none" && !hasOrderChanged && (
                <button
                  onClick={handleCreateNew}
                  disabled={loading}
                  style={{
                    backgroundColor: "#753a1e",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.75rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#5c2e1a";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#753a1e";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Plus size={18} />
                  New Category
                </button>
              )}
            </div>
          </div>

          {editMode !== "none" && (
            <div
              style={{
                backgroundColor: "#f8f9fa",
                border: "2px solid #753a1e",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem 0",
                  color: "#753a1e",
                  fontSize: "1.1rem",
                }}
              >
                {editMode === "create"
                  ? "Create New Category"
                  : "Edit Category"}
              </h3>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "#333",
                  }}
                >
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #dee2e6",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    } else if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                />
                {categoryName.trim() &&
                  categoryName.trim() !== formatName(categoryName) && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.75rem",
                        backgroundColor: "#e7f3ff",
                        border: "1px solid #2196F3",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                      }}
                    >
                      <strong style={{ color: "#1565C0" }}>
                        Will be saved as:
                      </strong>{" "}
                      <span style={{ color: "#0D47A1", fontWeight: 600 }}>
                        {formatName(categoryName)}
                      </span>
                    </div>
                  )}
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    fontSize: "0.75rem",
                    color: "#6c757d",
                    fontStyle: "italic",
                  }}
                >
                  Note: Words like "of", "in", "on", "the", "and" will be
                  lowercase (except at start/end)
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={handleSave}
                  disabled={loading || !categoryName.trim()}
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.75rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 600,
                    opacity: loading || !categoryName.trim() ? 0.6 : 1,
                  }}
                >
                  <Save size={18} />
                  {editMode === "create" ? "Create" : "Save Changes"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.75rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading && categories.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "#6c757d",
              }}
            >
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  draggable={editMode === "none" && !loading}
                  onDragStart={() => handleDragStart(category.category_id)}
                  onDragOver={(e) => handleDragOver(e, category.category_id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor:
                      editingCategory?.category_id === category.category_id
                        ? "#fff3cd"
                        : draggedItem === category.category_id
                          ? "#e3f2fd"
                          : !category.is_active
                            ? "#f8f9fa"
                            : "white",
                    opacity: !category.is_active ? 0.7 : 1,
                    transition: "all 0.3s ease",
                    cursor:
                      editMode === "none" && !loading ? "grab" : "default",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      flex: 1,
                    }}
                  >
                    {editMode === "none" && !loading && (
                      <div
                        style={{
                          cursor: "grab",
                          color: "#753a1e",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <GripVertical size={24} />
                      </div>
                    )}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 0.25rem 0",
                            color: "#333",
                            fontSize: "1.1rem",
                          }}
                        >
                          {category.category_name}
                        </h4>
                        {!category.is_active && (
                          <span
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            DISABLED
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: "#6c757d",
                          fontSize: "0.875rem",
                        }}
                      >
                        Display Order: {category.display_order}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <button
                      onClick={() => handleRequestToggleActive(category)}
                      disabled={
                        loading || editMode !== "none" || hasOrderChanged
                      }
                      style={{
                        backgroundColor: category.is_active
                          ? "#ffc107"
                          : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.5rem 1rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontWeight: 600,
                        opacity:
                          loading || editMode !== "none" || hasOrderChanged
                            ? 0.6
                            : 1,
                      }}
                      title={
                        category.is_active
                          ? "Disable category"
                          : "Enable category"
                      }
                    >
                      {category.is_active ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                      {category.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      disabled={
                        loading || editMode !== "none" || hasOrderChanged
                      }
                      style={{
                        backgroundColor: "#753a1e",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.5rem 1rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontWeight: 600,
                        opacity:
                          loading || editMode !== "none" || hasOrderChanged
                            ? 0.6
                            : 1,
                      }}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleRequestDelete(category)}
                      disabled={
                        loading || editMode !== "none" || hasOrderChanged
                      }
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.5rem 1rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontWeight: 600,
                        opacity:
                          loading || editMode !== "none" || hasOrderChanged
                            ? 0.6
                            : 1,
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && categories.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1.5rem",
                color: "#6c757d",
              }}
            >
              <p style={{ fontSize: "1.25rem", margin: 0 }}>
                No categories found. Create your first category to get started!
              </p>
            </div>
          )}
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
