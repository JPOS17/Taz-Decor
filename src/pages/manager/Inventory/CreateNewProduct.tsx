import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchCategories, type Category } from "../../../api/categories";
import { fetchProductTypes, type ProductType } from "../../../api/productTypes";
import { createNewProduct } from "../../../api/inventory";

import CreateNewProductForm from "../../../components/managerInterface/inventory/forms/CreateNewProductForm";

import { ToastNotification } from "../../../components/managerInterface/universal/ToastNotifications";
import ConfirmationModal from "../../../components/managerInterface/universal/ConfirmationModal";

import { HeaderFormatter } from "../../../components/managerInterface/inventory/productComponents/HeaderFormatter";

import { useConfirmationModal } from "../../../hooks/useConfirmationModal";

import "../../../styles/pages/manager/InventoryDashboard.css";

interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

const CreateProduct = () => {
  // Hooks

  const navigate = useNavigate();

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Confirmation Modals
  const createConfirmation = useConfirmationModal();
  const cancelConfirmation = useConfirmationModal();

  // Effects
  useEffect(() => {
    loadCategories();
    loadProductTypes();
  }, []);

  // Data Loading
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

  // Event Handlers - Create Product
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

      // Navigate to edit page after successful creation
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

  // Event Handlers - Navigation
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

  // Event Handlers - Form Submission
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

  // Utility Functions

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="manager-dashboard">
      {/* Header Section */}
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
          <h1 className="dashboard-title">Create New Product</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Add a new product to your inventory
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="dashboard-content single-column">
          <div className="details-column">
            {/* Header with Action Buttons */}
            <HeaderFormatter
              viewMode="create-product"
              loading={loading}
              onCancel={handleCancel}
              onSubmitForm={handleSubmitForm}
            />
            {/* Create Product Form */}
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

      {/* Confirmation Modal */}

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
