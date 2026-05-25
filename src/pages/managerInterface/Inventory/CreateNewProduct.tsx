import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchCategories, type Category } from "../../../api/categories";
import { fetchProductTypes, type ProductType } from "../../../api/productTypes";
import { createNewProduct } from "../../../api/inventory";

import { useConfirmationModal } from "../../../hooks/useConfirmationModal";
import CreateNewProductForm from "../../../components/managerInterface/inventory/forms/CreateNewProductForm";

import { ToastNotification } from "../../../components/managerInterface/universal/ToastNotifications";
import ConfirmationModal from "../../../components/managerInterface/universal/ConfirmationModal";

import { HeaderFormatter } from "../../../components/managerInterface/inventory/productComponents/HeaderFormatter";

import "../../../styles/pages/managerInterface/ManageInventory.css";
import "../../../styles/components/managerInterface/ProductForms.css";

interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

// ============================================================================
// CREATE PRODUCT COMPONENT
// ============================================================================

const CreateProduct = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const createConfirmation = useConfirmationModal();
  const cancelConfirmation = useConfirmationModal();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadCategories();
    loadProductTypes();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories(true);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showMessage("Failed to fetch categories", "error");
    }
  };

  const loadProductTypes = async () => {
    try {
      const data = await fetchProductTypes();
      setProductTypes(data);
    } catch (error) {
      console.error("Error fetching product types:", error);
      showMessage("Failed to fetch product types", "error");
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

  const handleRequestCreateProduct = () => {
    createConfirmation.showConfirmation({
      title: "Confirm Create Product",
      message:
        "Are you sure you want to create this product? This will add a new product to your inventory.",
      confirmText: "Create",
      cancelText: "Cancel",
      onConfirm: confirmCreateProduct,
    });
  };

  const confirmCreateProduct = async () => {
    if ((window as any).__executeProductFormSubmit) {
      (window as any).__executeProductFormSubmit();
    }
  };

  const handleCreateProduct = async (productData: any) => {
    setLoading(true);
    try {
      const newVariant = await createNewProduct(productData);
      showMessage(
        `Product "${productData.name}" created successfully! Generated SKU: ${newVariant.sku}`,
        "success",
      );
      setTimeout(() => {
        navigate("/manager/inventory/edit");
      }, 2000);
    } catch (error) {
      console.error("Error creating product:", error);
      showMessage("Failed to create product. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isFormDirty) {
      cancelConfirmation.showConfirmation({
        title: "Cancel Product Creation?",
        message:
          "You have unsaved changes. Are you sure you want to cancel creating this product?",
        confirmText: "Discard Changes",
        cancelText: "Keep Editing",
        onConfirm: () => navigate("/manager/inventory/create"),
      });
    } else {
      navigate("/manager/inventory/create");
    }
  };

  const handleSubmitForm = () => {
    const form = document.querySelector(".product-form") as HTMLFormElement;
    if (form) {
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  const handleValidationError = (errorMessage: string) => {
    showMessage(errorMessage, "warning");
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
            <h1 className="mgr-header-title">Create New Product</h1>
            <p className="mgr-header-subtitle">
              Add a new product to your inventory
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mi-container">
        <div className="mi-cnp-content">
          <div className="mi-details-column">
            <HeaderFormatter
              viewMode="create-product"
              loading={loading}
              onCancel={handleCancel}
              onSubmitForm={handleSubmitForm}
            />
            <CreateNewProductForm
              categoryId={0}
              categories={categories}
              productTypes={productTypes}
              onSubmit={handleCreateProduct}
              onDirtyChange={setIsFormDirty}
              loading={loading}
              onRequestSubmit={handleRequestCreateProduct}
              onValidationError={handleValidationError}
            />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {message && (
        <ToastNotification message={message.text} type={message.type} />
      )}

      {/* Create Product Confirmation */}
      {createConfirmation.isOpen && createConfirmation.config && (
        <ConfirmationModal
          title={createConfirmation.config.title}
          message={createConfirmation.config.message}
          confirmText={createConfirmation.config.confirmText}
          cancelText={createConfirmation.config.cancelText}
          onConfirm={createConfirmation.handleConfirm}
          onCancel={createConfirmation.handleCancel}
        />
      )}

      {/* Cancel Creation Confirmation */}
      {cancelConfirmation.isOpen && cancelConfirmation.config && (
        <ConfirmationModal
          title={cancelConfirmation.config.title}
          message={cancelConfirmation.config.message}
          confirmText={cancelConfirmation.config.confirmText}
          cancelText={cancelConfirmation.config.cancelText}
          onConfirm={cancelConfirmation.handleConfirm}
          onCancel={cancelConfirmation.handleCancel}
        />
      )}
    </div>
  );
};

export default CreateProduct;
