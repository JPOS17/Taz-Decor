import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Save, X } from "lucide-react";
import {
  fetchProductTypes,
  createProductType,
  updateProductType,
  type ProductType,
} from "../../../api/productTypes";

import { ToastNotification } from "../../../components/managerInterface/universal/ToastNotifications";
import ConfirmationModal from "../../../components/managerInterface/universal/ConfirmationModal";

import { useConfirmationModal } from "../../../hooks/useConfirmationModal";
import { formatName } from "../../../utils/nameFormatter";

import "../../../styles/pages/manager/ManagerShared.css";
import "../../../styles/pages/manager/ManageProductType.css";

interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

type EditMode = "none" | "edit" | "create";

interface EditingType {
  product_type_id?: number;
  type_name: string;
  sku_prefix: string;
  description: string;
}

// ============================================================================
// MANAGE PRODUCT TYPES COMPONENT
// ============================================================================

const ManageProductTypes = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Product type data
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("none");

  // Form state
  const [editingType, setEditingType] = useState<EditingType | null>(null);
  const [formData, setFormData] = useState({
    type_name: "",
    sku_prefix: "",
    description: "",
  });

  // Confirmation modals
  const saveConfirmation = useConfirmationModal();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadProductTypes();
  }, []);

  const loadProductTypes = async () => {
    setLoading(true);
    try {
      const data = await fetchProductTypes();
      setProductTypes(data);
    } catch (error) {
      console.error("Error fetching product types:", error);
      showMessage("Failed to fetch product types", "error");
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
  // EVENT HANDLERS
  // ============================================================================

  const handleCreateNew = () => {
    setEditMode("create");
    setFormData({
      type_name: "",
      sku_prefix: "",
      description: "",
    });
    setEditingType(null);
  };

  const handleEdit = (productType: ProductType) => {
    setEditMode("edit");
    setEditingType({
      product_type_id: productType.product_type_id,
      type_name: productType.type_name,
      sku_prefix: productType.sku_prefix,
      description: productType.description,
    });
    setFormData({
      type_name: productType.type_name,
      sku_prefix: productType.sku_prefix,
      description: productType.description,
    });
  };

  const handleCancelEdit = () => {
    setEditMode("none");
    setEditingType(null);
    setFormData({
      type_name: "",
      sku_prefix: "",
      description: "",
    });
  };

  const handleRequestSave = () => {
    if (
      !formData.type_name.trim() ||
      !formData.sku_prefix.trim() ||
      !formData.description.trim()
    ) {
      showMessage("All fields are required", "warning");
      return;
    }

    if (editMode === "create" && formData.sku_prefix.length !== 3) {
      showMessage("SKU prefix must be exactly 3 characters", "warning");
      return;
    }

    saveConfirmation.showConfirmation({
      title:
        editMode === "create" ? "Create Product Type" : "Update Description",
      message:
        editMode === "create"
          ? `Are you sure you want to create product type "${formatName(
              formData.type_name,
            )}" with SKU prefix "${formData.sku_prefix.toUpperCase()}"?`
          : `Are you sure you want to update the description for "${formData.type_name}"?`,
      confirmText: editMode === "create" ? "Create" : "Save Changes",
      cancelText: "Cancel",
      onConfirm: handleSave,
    });
  };

  const handleSave = async () => {
    const formattedTypeName = formatName(formData.type_name);
    const formattedDescription = formatName(formData.description);
    const formattedSkuPrefix = formData.sku_prefix.toUpperCase();

    setLoading(true);
    try {
      if (editMode === "create") {
        await createProductType({
          type_name: formattedTypeName,
          sku_prefix: formattedSkuPrefix,
          description: formattedDescription,
        });

        showMessage(
          `Product type "${formattedTypeName}" created successfully!`,
          "success",
        );
      } else if (editMode === "edit" && editingType?.product_type_id) {
        await updateProductType(editingType.product_type_id, {
          description: formattedDescription,
        });

        showMessage("Description updated successfully!", "success");
      }

      await loadProductTypes();
      handleCancelEdit();
    } catch (error: any) {
      console.error("Error saving product type:", error);
      showMessage(error.message || "Failed to save product type", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <button
            className="dashboard-back-button"
            onClick={() => navigate("/manager/inventory")}
          >
            <ArrowLeft size={16} />
            Back to Product Management
          </button>
          <h1 className="dashboard-title">Manage Product Types</h1>
          <p className="dashboard-subtitle">
            Create and manage product type classifications and SKU prefixes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="body">
          <div className="mpt-panel">
            {/* Actions bar */}
            <div className="mpt-actions-bar">
              <h2 className="mpt-section-title">Product Types</h2>
              {editMode === "none" && (
                <button
                  className="mpt-btn mpt-btn-primary"
                  onClick={handleCreateNew}
                  disabled={loading}
                >
                  <Plus size={16} />
                  New Product Type
                </button>
              )}
            </div>

            {/* Create / Edit form */}
            {editMode !== "none" && (
              <div className="mpt-form">
                <h3 className="mpt-form-title">
                  {editMode === "create"
                    ? "Create New Product Type"
                    : "Edit Product Type"}
                </h3>

                <div className="mpt-form-group">
                  <label className="mpt-form-label">
                    SKU Prefix * {editMode === "edit" && "(Read-only)"}
                  </label>
                  <input
                    type="text"
                    className="mpt-form-input"
                    value={formData.sku_prefix}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().slice(0, 3);
                      setFormData({ ...formData, sku_prefix: value });
                    }}
                    placeholder="e.g., JRN"
                    disabled={loading || editMode === "edit"}
                    maxLength={3}
                  />
                  <p className="mpt-form-helper">
                    Must be exactly 3 uppercase letters
                  </p>
                </div>

                <div className="mpt-form-group">
                  <label className="mpt-form-label">
                    Type Name * {editMode === "edit" && "(Read-only)"}
                  </label>
                  <input
                    type="text"
                    className="mpt-form-input"
                    value={formData.type_name}
                    onChange={(e) =>
                      setFormData({ ...formData, type_name: e.target.value })
                    }
                    placeholder="Enter type name"
                    disabled={loading || editMode === "edit"}
                  />
                  {editMode === "create" &&
                    formData.type_name.trim() &&
                    formData.type_name.trim() !==
                      formatName(formData.type_name) && (
                      <div className="mpt-format-preview">
                        <strong>Will be saved as:</strong>{" "}
                        <span>{formatName(formData.type_name)}</span>
                      </div>
                    )}
                </div>

                <div className="mpt-form-group">
                  <label className="mpt-form-label">Description *</label>
                  <textarea
                    className="mpt-form-textarea"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter description"
                    disabled={loading}
                    rows={3}
                  />
                  {formData.description.trim() &&
                    formData.description.trim() !==
                      formatName(formData.description) && (
                      <div className="mpt-format-preview">
                        <strong>Will be saved as:</strong>{" "}
                        <span>{formatName(formData.description)}</span>
                      </div>
                    )}
                  <p className="mpt-form-helper">
                    Note: Words like "of", "in", "on", "the", "and" will be
                    lowercase (except at start/end)
                  </p>
                </div>

                <div className="mpt-form-actions">
                  <button
                    className="mpt-btn mpt-btn-success"
                    onClick={handleRequestSave}
                    disabled={
                      loading ||
                      !formData.type_name.trim() ||
                      !formData.sku_prefix.trim() ||
                      !formData.description.trim() ||
                      (editMode === "create" &&
                        formData.sku_prefix.length !== 3)
                    }
                  >
                    <Save size={16} />
                    {editMode === "create" ? "Create" : "Save Changes"}
                  </button>
                  <button
                    className="mpt-btn mpt-btn-secondary"
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
            {loading && productTypes.length === 0 ? (
              <div className="mpt-loading">
                <div className="mpt-spinner" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="mpt-table-container">
                <table className="mpt-table">
                  <thead>
                    <tr>
                      <th>SKU Prefix</th>
                      <th>Type Name</th>
                      <th>Description</th>
                      <th className="mpt-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productTypes.map((productType) => (
                      <tr
                        key={productType.product_type_id}
                        className={
                          editingType?.product_type_id ===
                          productType.product_type_id
                            ? "mpt-row-editing"
                            : ""
                        }
                      >
                        <td className="mpt-sku-cell" data-label="SKU Prefix">
                          <span className="mpt-sku-badge">
                            {productType.sku_prefix}
                          </span>
                        </td>
                        <td className="mpt-name-cell" data-label="Type Name">
                          {productType.type_name}
                        </td>
                        <td
                          className="mpt-description-cell"
                          data-label="Description"
                        >
                          {productType.description}
                        </td>
                        <td className="mpt-actions-cell" data-label="Actions">
                          <button
                            className="mpt-btn mpt-btn-primary mpt-btn-sm"
                            onClick={() => handleEdit(productType)}
                            disabled={loading || editMode !== "none"}
                            title="Edit description"
                          >
                            <Edit2 size={15} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty state */}
            {!loading && productTypes.length === 0 && (
              <div className="mpt-empty">
                <p>
                  No product types found. Create your first product type to get
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

      {/* Save Confirmation */}
      {saveConfirmation.isOpen && saveConfirmation.config && (
        <ConfirmationModal
          title={saveConfirmation.config.title}
          message={saveConfirmation.config.message}
          confirmText={saveConfirmation.config.confirmText}
          cancelText={saveConfirmation.config.cancelText}
          onConfirm={saveConfirmation.handleConfirm}
          onCancel={saveConfirmation.handleCancel}
        />
      )}
    </div>
  );
};

export default ManageProductTypes;
