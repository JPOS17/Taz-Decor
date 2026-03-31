import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Package } from "lucide-react";
import { fetchCategories, type Category } from "../../../api/categories";
import { fetchProductTypes, type ProductType } from "../../../api/productTypes";
import {
  fetchWarehouseLocations,
  type Location,
} from "../../../api/sellerLocation";
import {
  fetchProductsForManagement,
  fetchVariantDetails,
  fetchProductVariants,
  updateVariant,
  deleteVariant,
  addImageToVariant,
  deleteImage,
  setPrimaryImage,
  updateImageOrder,
  createNewProduct,
  createNewVariant,
  toggleVariantStatus,
  type ProductVariantForManagement,
  type VariantDetails,
  type VariantImage,
  type VariantOption,
} from "../../../api/inventory";
import {
  fetchProductCategories,
  addProductCategory,
  removeProductCategory,
  updateProductCategory,
  type ProductCategory,
} from "../../../api/categoriesAssignments";

import ProductOverlayForm from "../../../components/managerInterface/inventory/forms/ProductOverlayForm";
import CreateNewProductForm from "../../../components/managerInterface/inventory/forms/CreateNewProductForm";
import CreateNewVariantForm from "../../../components/managerInterface/inventory/forms/CreateNewVariantForm";

import InventoryFilters from "../../../components/managerInterface/inventory/productComponents/InventoryFilters";
import ItemListings from "../../../components/managerInterface/inventory/productInfo/ItemListings";
import { HeaderFormatter } from "../../../components/managerInterface/inventory/productComponents/HeaderFormatter";
import VariantSelector from "../../../components/managerInterface/inventory/productComponents/VariantSelector";
import ImageManager from "../../../components/managerInterface/inventory/productComponents/ImageManager";

import ConfirmationModal from "../../../components/managerInterface/universal/ConfirmationModal";
import { ToastNotification } from "../../../components/managerInterface/universal/ToastNotifications";

import { useCloudinaryWidget } from "../../../hooks/useCloudinaryWidget";
import { useConfirmationModal } from "../../../hooks/useConfirmationModal";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { sanitizeFolderName } from "../../../utils/folderNameFormatter";

import "../../../styles/pages/manager/ManageInventory.css";

interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

type ViewMode = "edit" | "create-product" | "create-variant";

// ============================================================================
// MANAGE PRODUCTS COMPONENT
// ============================================================================

const ManageProducts = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Dropdown / filter data
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Filter & sort state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [productStatus, setProductStatus] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<string | null>(null);
  const [categoryStatus, setCategoryStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);

  // Product & variant data
  const [products, setProducts] = useState<ProductVariantForManagement[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantForManagement | null>(null);
  const [variantDetails, setVariantDetails] = useState<VariantDetails | null>(
    null,
  );
  const [originalVariantDetails, setOriginalVariantDetails] =
    useState<VariantDetails | null>(null);
  const [availableVariants, setAvailableVariants] = useState<VariantOption[]>(
    [],
  );
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    [],
  );

  // Form state
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [isCreateFormDirty, setIsCreateFormDirty] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
  const [parentVariantForNewVariant, setParentVariantForNewVariant] =
    useState<ProductVariantForManagement | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Refs & hooks
  const detailsColumnRef = useRef<HTMLDivElement>(null);
  const { openWidget } = useCloudinaryWidget();

  // Confirmation modals
  const saveConfirmation = useConfirmationModal();
  const deleteConfirmation = useConfirmationModal();
  const toggleConfirmation = useConfirmationModal();
  const createConfirmation = useConfirmationModal();
  const cancelCreateConfirmation = useConfirmationModal();
  const unsavedChanges = useUnsavedChanges();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadCategories();
    loadProductTypes();
    loadLocations();
  }, []);

  useEffect(() => {
    loadProducts(selectedCategory, selectedLocation);
  }, [
    selectedCategory,
    selectedLocation,
    productStatus,
    stockStatus,
    categoryStatus,
    sortBy,
  ]);

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

  const loadLocations = async () => {
    try {
      const data = await fetchWarehouseLocations();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
      showMessage("Failed to fetch locations", "error");
    }
  };

  const loadProducts = async (
    categoryId: number | null,
    locationId: number | null,
  ) => {
    setLoading(true);
    try {
      const data = await fetchProductsForManagement(
        categoryId,
        locationId,
        productStatus,
        stockStatus,
        categoryStatus,
        sortBy,
      );
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      showMessage("Failed to fetch products", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadVariantDetails = async (variantId: number) => {
    setLoading(true);
    try {
      const data = await fetchVariantDetails(variantId);
      setVariantDetails(data);
      setOriginalVariantDetails(JSON.parse(JSON.stringify(data)));

      const variants = await fetchProductVariants(data.product_id);
      setAvailableVariants(variants);

      await loadProductCategories(data.product_id);

      setIsFormValid(true);
    } catch (error) {
      console.error("Error fetching variant details:", error);
      showMessage("Failed to fetch variant details", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProductCategories = async (productId: number) => {
    try {
      const data = await fetchProductCategories(productId);
      setProductCategories(data);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      showMessage("Failed to fetch product categories", "error");
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const getUpdatedFields = (
    current: VariantDetails,
    original: VariantDetails,
  ): string[] => {
    const updated: string[] = [];

    if (current.name !== original.name) updated.push("name");
    if (current.price !== original.price) updated.push("price");
    if (current.stock_quantity !== original.stock_quantity)
      updated.push("stock quantity");
    if (current.color !== original.color) updated.push("color");
    if (current.size !== original.size) updated.push("size");
    if (current.sku !== original.sku) updated.push("SKU");
    if (current.category_id !== original.category_id) updated.push("category");
    if (current.weight_oz !== original.weight_oz) updated.push("weight");
    if (current.length_in !== original.length_in) updated.push("length");
    if (current.width_in !== original.width_in) updated.push("width");
    if (current.height_in !== original.height_in) updated.push("height");
    if (current.description !== original.description)
      updated.push("description");
    if (current.location_id !== original.location_id) updated.push("location");

    return updated;
  };

  const getActiveItemId = () => {
    if (viewMode === "create-product") return "create-new-product";
    if (viewMode === "create-variant" && parentVariantForNewVariant) {
      return parentVariantForNewVariant.variant_id;
    }
    return selectedVariant?.variant_id;
  };

  const handleSubmitForm = () => {
    const form = document.querySelector(".product-form") as HTMLFormElement;
    if (form) {
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  const scrollToDetails = () => {
    setTimeout(() => {
      if (window.innerWidth < 992 && detailsColumnRef.current) {
        detailsColumnRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  // ============================================================================
  // UNSAVED CHANGES DETECTION
  // ============================================================================

  const hasUnsavedChanges = (): boolean => {
    if (viewMode === "create-product" || viewMode === "create-variant")
      return false;
    if (!variantDetails || !originalVariantDetails) return false;

    return (
      variantDetails.name !== originalVariantDetails.name ||
      variantDetails.price !== originalVariantDetails.price ||
      variantDetails.color !== originalVariantDetails.color ||
      variantDetails.size !== originalVariantDetails.size ||
      variantDetails.stock_quantity !== originalVariantDetails.stock_quantity ||
      variantDetails.sku !== originalVariantDetails.sku ||
      variantDetails.category_id !== originalVariantDetails.category_id ||
      variantDetails.weight_oz !== originalVariantDetails.weight_oz ||
      variantDetails.length_in !== originalVariantDetails.length_in ||
      variantDetails.width_in !== originalVariantDetails.width_in ||
      variantDetails.height_in !== originalVariantDetails.height_in ||
      variantDetails.description !== originalVariantDetails.description ||
      variantDetails.location_id !== originalVariantDetails.location_id ||
      JSON.stringify(variantDetails.images) !==
        JSON.stringify(originalVariantDetails.images)
    );
  };

  const handleNavigationWithUnsavedCheck = (navigationFn: () => void) => {
    const hasChanges =
      viewMode === "create-product" || viewMode === "create-variant"
        ? isCreateFormDirty
        : hasUnsavedChanges();

    unsavedChanges.checkUnsavedChanges(hasChanges, navigationFn);
  };

  // ============================================================================
  // EVENT HANDLERS — NAVIGATION
  // ============================================================================

  const handleVariantSelect = (variant: ProductVariantForManagement) => {
    handleNavigationWithUnsavedCheck(() => {
      setViewMode("edit");
      setSelectedVariant(variant);
      setParentVariantForNewVariant(null);
      loadVariantDetails(variant.variant_id);
      scrollToDetails();
    });
  };

  const handleVariantSwitch = (newVariantId: number) => {
    handleNavigationWithUnsavedCheck(() => {
      const newVariant = products.find((p) => p.variant_id === newVariantId);
      if (newVariant) {
        setSelectedVariant(newVariant);
        loadVariantDetails(newVariantId);
      }
    });
  };

  const handleCategoryChange = (categoryId: number | null) => {
    handleNavigationWithUnsavedCheck(() => {
      setSelectedCategory(categoryId);
      setSelectedVariant(null);
      setVariantDetails(null);
      setOriginalVariantDetails(null);
      setViewMode("edit");
      setParentVariantForNewVariant(null);
    });
  };

  const handleLocationChange = (locationId: number | null) => {
    handleNavigationWithUnsavedCheck(() => {
      setSelectedLocation(locationId);
      setSelectedVariant(null);
      setVariantDetails(null);
      setOriginalVariantDetails(null);
      setViewMode("edit");
      setParentVariantForNewVariant(null);
    });
  };

  const handleNewProduct = () => {
    handleNavigationWithUnsavedCheck(() => {
      setViewMode("create-product");
      setSelectedVariant(null);
      setVariantDetails(null);
      setOriginalVariantDetails(null);
      setParentVariantForNewVariant(null);
      setIsCreateFormDirty(false);
      scrollToDetails();
    });
  };

  const handleNewVariant = () => {
    handleNavigationWithUnsavedCheck(() => {
      if (selectedVariant) {
        setViewMode("create-variant");
        setParentVariantForNewVariant(selectedVariant);
        setIsCreateFormDirty(false);
        scrollToDetails();
      }
    });
  };

  const handleClearFilters = () => {
    setProductStatus(null);
    setStockStatus(null);
    setCategoryStatus(null);
    setSortBy(null);
    setSelectedLocation(null);
  };

  // ============================================================================
  // EVENT HANDLERS — CREATE & CANCEL
  // ============================================================================

  const handleCancelCreate = () => {
    if (isCreateFormDirty) {
      cancelCreateConfirmation.showConfirmation({
        title:
          viewMode === "create-product"
            ? "Cancel Product Creation?"
            : "Cancel Variant Creation?",
        message:
          viewMode === "create-product"
            ? "You have unsaved changes. Are you sure you want to cancel creating this product?"
            : "You have unsaved changes. Are you sure you want to cancel creating this variant?",
        confirmText: "Discard Changes",
        cancelText: "Keep Editing",
        onConfirm: executeCancelCreate,
      });
    } else {
      executeCancelCreate();
    }
  };

  const executeCancelCreate = () => {
    if (viewMode === "create-variant" && parentVariantForNewVariant) {
      setViewMode("edit");
      setSelectedVariant(parentVariantForNewVariant);
      loadVariantDetails(parentVariantForNewVariant.variant_id);
      setParentVariantForNewVariant(null);
    } else {
      setViewMode("edit");
      setSelectedVariant(null);
      setVariantDetails(null);
      setParentVariantForNewVariant(null);
    }
    setIsCreateFormDirty(false);
  };

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

      if (selectedCategory) {
        await loadProducts(selectedCategory, selectedLocation);
      }

      setViewMode("edit");
      setSelectedVariant(newVariant);
      loadVariantDetails(newVariant.variant_id);
    } catch (error) {
      console.error("Error creating product:", error);
      showMessage("Failed to create product. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCreateVariant = () => {
    createConfirmation.showConfirmation({
      title: "Confirm Create Variant",
      message:
        "Are you sure you want to create this variant? This will add a new variant to the product.",
      confirmText: "Create",
      cancelText: "Cancel",
      onConfirm: confirmCreateVariant,
    });
  };

  const confirmCreateVariant = async () => {
    if ((window as any).__executeVariantFormSubmit) {
      (window as any).__executeVariantFormSubmit();
    }
  };

  const handleCreateVariant = async (variantData: any) => {
    setLoading(true);
    try {
      const newVariant = await createNewVariant(variantData);
      showMessage(
        `Variant created successfully! Generated SKU: ${newVariant.sku}`,
        "success",
      );

      if (selectedCategory) {
        await loadProducts(selectedCategory, selectedLocation);
      }

      setViewMode("edit");
      setSelectedVariant(newVariant);
      setParentVariantForNewVariant(null);
      loadVariantDetails(newVariant.variant_id);
    } catch (error) {
      console.error("Error creating variant:", error);
      showMessage("Failed to create variant. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS — CATEGORY ASSIGNMENTS
  // ============================================================================

  const handleSetPrimaryCategory = async (categoryId: number) => {
    if (!variantDetails) return;

    setLoading(true);
    try {
      await updateProductCategory(variantDetails.product_id, categoryId, {
        is_primary: true,
      });
      showMessage("Primary category updated successfully!", "success");
      await loadProductCategories(variantDetails.product_id);

      // Reload variant details to update the display
      await loadVariantDetails(variantDetails.variant_id);
    } catch (error: any) {
      console.error("Error setting primary category:", error);
      showMessage(error.message || "Failed to set primary category", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (categoryId: number) => {
    if (!variantDetails) return;

    setLoading(true);
    try {
      await addProductCategory(variantDetails.product_id, {
        category_id: categoryId,
        is_primary: false,
      });
      showMessage("Category added successfully!", "success");
      await loadProductCategories(variantDetails.product_id);
    } catch (error: any) {
      console.error("Error adding category:", error);
      showMessage(error.message || "Failed to add category", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCategory = async (categoryId: number) => {
    if (!variantDetails) return;

    setLoading(true);
    try {
      await removeProductCategory(variantDetails.product_id, categoryId);
      showMessage("Category removed successfully!", "success");
      await loadProductCategories(variantDetails.product_id);

      // Reload variant details to update the primary category if it changed
      await loadVariantDetails(variantDetails.variant_id);
    } catch (error: any) {
      console.error("Error removing category:", error);
      showMessage(error.message || "Failed to remove category", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS — EDIT, SAVE & DELETE
  // ============================================================================

  const handleToggleStatus = () => {
    if (!variantDetails) return;

    toggleConfirmation.showConfirmation({
      title: variantDetails.is_active
        ? "Deactivate Product"
        : "Activate Product",
      message: variantDetails.is_active
        ? `Are you sure you want to deactivate "${variantDetails.name}"? This will hide the product from customers.`
        : `Are you sure you want to activate "${variantDetails.name}"? This will make the product visible to customers.`,
      confirmText: variantDetails.is_active ? "Deactivate" : "Activate",
      onConfirm: confirmToggleStatus,
    });
  };

  const confirmToggleStatus = async () => {
    if (!variantDetails) return;

    setLoading(true);
    try {
      const newStatus = !variantDetails.is_active;
      await toggleVariantStatus(variantDetails.variant_id, newStatus);

      showMessage(
        `Product ${newStatus ? "activated" : "deactivated"} successfully!`,
        "success",
      );

      setVariantDetails((prev) =>
        prev ? { ...prev, is_active: newStatus } : null,
      );
      setOriginalVariantDetails((prev) =>
        prev ? { ...prev, is_active: newStatus } : null,
      );

      if (selectedCategory) {
        await loadProducts(selectedCategory, selectedLocation);
      }
    } catch (error) {
      console.error("Error toggling variant status:", error);
      showMessage("Failed to toggle product status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVariant = () => {
    if ((window as any).__validateProductForm) {
      const isValid = (window as any).__validateProductForm();

      if (!isValid) {
        showMessage(
          "Please fix all validation errors before saving",
          "warning",
        );
        return;
      }
    }

    saveConfirmation.showConfirmation({
      title: "Confirm Changes",
      message:
        "Are you sure you want to save these changes? This will update the product information.",
      onConfirm: confirmSaveVariant,
    });
  };

  const confirmSaveVariant = async () => {
    if (!variantDetails || !originalVariantDetails) return;

    // Get list of updated fields
    const updatedFields = getUpdatedFields(
      variantDetails,
      originalVariantDetails,
    );

    setLoading(true);
    try {
      await updateVariant(variantDetails.variant_id, {
        name: variantDetails.name,
        price: variantDetails.price,
        color: variantDetails.color || null,
        size: variantDetails.size || null,
        stock_quantity: variantDetails.stock_quantity,
        sku: variantDetails.sku || "",
        category_id: variantDetails.category_id,
        description: variantDetails.description || null,
        location_id: variantDetails.location_id || 1,
        weight_oz: variantDetails.weight_oz ?? null,
        length_in: variantDetails.length_in ?? null,
        width_in: variantDetails.width_in ?? null,
        height_in: variantDetails.height_in ?? null,
      });

      // Handle image order changes
      const imageOrderChanged =
        JSON.stringify(
          variantDetails.images.map((img) => ({
            image_id: img.image_id,
            display_order: img.display_order,
          })),
        ) !==
        JSON.stringify(
          originalVariantDetails.images.map((img) => ({
            image_id: img.image_id,
            display_order: img.display_order,
          })),
        );

      if (imageOrderChanged) {
        const imageOrders = variantDetails.images.map((img, index) => ({
          image_id: img.image_id,
          display_order: index + 1,
        }));
        await updateImageOrder(variantDetails.variant_id, imageOrders);
        updatedFields.push("image order");
      }

      // Handle primary image changes
      const currentPrimary = variantDetails.images.find(
        (img) => img.is_primary,
      );
      const originalPrimary = originalVariantDetails.images.find(
        (img) => img.is_primary,
      );

      if (
        currentPrimary &&
        (!originalPrimary ||
          currentPrimary.image_id !== originalPrimary.image_id)
      ) {
        await setPrimaryImage(currentPrimary.image_id);
        updatedFields.push("primary image");
      }

      // Handle deleted images
      const deletedImages = originalVariantDetails.images.filter(
        (origImg) =>
          !variantDetails.images.some(
            (img) => img.image_id === origImg.image_id,
          ),
      );

      if (deletedImages.length > 0) {
        for (const img of deletedImages) {
          await deleteImage(img.image_id);
        }
        updatedFields.push(`${deletedImages.length} image(s) removed`);
      }

      // Create success message with updated fields
      let successMessage = "Product updated successfully!";
      if (updatedFields.length > 0) {
        successMessage += "\nUpdated fields:\n• " + updatedFields.join("\n• ");
      }

      showMessage(successMessage, "success");

      if (selectedCategory) {
        await loadProducts(selectedCategory, selectedLocation);
      }
      await loadVariantDetails(variantDetails.variant_id);
    } catch (error) {
      console.error("Error updating variant:", error);
      showMessage("Failed to update product. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = () => {
    deleteConfirmation.showConfirmation({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete "${variantDetails?.name}"? This action cannot be undone.`,
      onConfirm: confirmDeleteVariant,
    });
  };

  const confirmDeleteVariant = async () => {
    if (!variantDetails) return;

    setLoading(true);
    try {
      await deleteVariant(variantDetails.variant_id);

      // Check if this was the last variant (product completely deleted)
      // by seeing if there are still other variants for this product
      const remainingVariants = availableVariants.filter(
        (v) => v.variant_id !== variantDetails.variant_id,
      );

      const wasLastVariant = remainingVariants.length === 0;

      if (wasLastVariant) {
        showMessage("Product deleted successfully!", "success");
      } else {
        showMessage("Variant deleted successfully!", "success");
      }

      // Clear current selection
      setVariantDetails(null);
      setOriginalVariantDetails(null);
      setSelectedVariant(null);
      setViewMode("edit");

      // Reload product list
      if (selectedCategory) {
        loadProducts(selectedCategory, selectedLocation);
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete product";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS — IMAGES
  // ============================================================================

  const handleInputChange = (
    field: keyof VariantDetails,
    value: string | number | null,
  ) => {
    setVariantDetails((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleImageReorder = (newOrder: VariantImage[]) => {
    setVariantDetails((prev) => {
      if (!prev) return prev;
      return { ...prev, images: newOrder };
    });
  };

  const handleSetPrimaryImage = (imageId: number) => {
    setVariantDetails((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        images: prev.images.map((img) => ({
          ...img,
          is_primary: img.image_id === imageId,
        })),
      };
    });
  };

  const handleDeleteImageLocal = (imageId: number) => {
    setVariantDetails((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        images: prev.images.filter((img) => img.image_id !== imageId),
      };
    });
  };

  const openCloudinaryWidget = () => {
    if (!variantDetails) return;

    const category = categories.find(
      (c) => c.category_id === variantDetails.category_id,
    );
    const categoryFolder = category
      ? sanitizeFolderName(category.category_name)
      : "uncategorized";
    const productFolder = variantDetails.sku || "unknown_sku";

    openWidget({
      folder: `${categoryFolder}/${productFolder}`,
      multiple: false,
      onSuccess: handleAddImage,
      onError: (error) => {
        showMessage("Failed to upload image", error);
      },
    });
  };

  const handleAddImage = async (imgUrl: string) => {
    if (!variantDetails) return;

    try {
      const newImage = await addImageToVariant(
        variantDetails.variant_id,
        imgUrl,
      );

      setVariantDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: [...prev.images, newImage],
        };
      });

      setOriginalVariantDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: [...prev.images, newImage],
        };
      });

      showMessage("Image added successfully!", "success");
    } catch (error) {
      console.error("Error adding image:", error);
      showMessage("Failed to add image", "error");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="if-page">
      {/* Header Section */}
      <div className="if-header">
        <div className="if-container">
          <button
            className="if-back-button"
            onClick={() => navigate("/manager/inventory")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="if-title">Product Management</h1>
          <p className="mpt-subtitle">
            Manage existing products, variants, images, and inventory
          </p>
        </div>
      </div>

      <div className="if-container">
        {/* Warehouse Location Selector */}
        <div className="category-section">
          <label className="category-label">Select Warehouse</label>
          <select
            className="category-select"
            value={selectedLocation === null ? "" : selectedLocation}
            onChange={(e) => {
              const value = e.target.value;
              handleLocationChange(value === "" ? null : Number(value));
            }}
          >
            <option value="">All Warehouses</option>
            {locations.map((location) => (
              <option key={location.location_id} value={location.location_id}>
                {location.location_name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div className="category-section">
          <label className="category-label">Select Category</label>
          <select
            className="category-select"
            value={selectedCategory === null ? "" : selectedCategory}
            onChange={(e) => {
              const value = e.target.value;
              handleCategoryChange(value === "" ? null : Number(value));
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name} {!cat.is_active ? "(Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Bar */}
        <InventoryFilters
          onStatusChange={setProductStatus}
          onStockChange={setStockStatus}
          onCategoryStatusChange={setCategoryStatus}
          onSortChange={setSortBy}
          currentStatus={productStatus}
          currentStockStatus={stockStatus}
          currentCategoryStatus={categoryStatus}
          currentSortBy={sortBy}
          onClearFilters={handleClearFilters}
        />

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Left Column - Product List */}
          <div className="products-column">
            <h2>Products</h2>
            {loading && !variantDetails && viewMode === "edit" ? (
              <div className="loading-spinner">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="products-list">
                {/* Create New Product Card */}
                <div
                  className={`add-new-product-card ${
                    viewMode === "create-product" ? "active" : ""
                  }`}
                  onClick={handleNewProduct}
                >
                  <Plus className="add-new-icon" size={48} />
                  <p className="add-new-text">Create New Product</p>
                </div>

                {/* Existing Product List */}
                {products.map((product) => (
                  <ItemListings
                    key={product.variant_id}
                    product={product}
                    isActive={getActiveItemId() === product.variant_id}
                    onClick={() => handleVariantSelect(product)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Forms */}
          <div className="details-column" ref={detailsColumnRef}>
            {/* Create Product View */}
            {viewMode === "create-product" && (
              <>
                <HeaderFormatter
                  viewMode={viewMode}
                  loading={loading}
                  onCancel={handleCancelCreate}
                  onSubmitForm={handleSubmitForm}
                />
                <CreateNewProductForm
                  categoryId={selectedCategory === null ? 0 : selectedCategory}
                  categories={categories}
                  productTypes={productTypes}
                  onSubmit={handleCreateProduct}
                  onDirtyChange={setIsCreateFormDirty}
                  loading={loading}
                  onFormValidChange={setIsFormValid}
                  onRequestSubmit={handleRequestCreateProduct}
                />
              </>
            )}

            {/* Create Variant View */}
            {viewMode === "create-variant" &&
              parentVariantForNewVariant &&
              variantDetails && (
                <>
                  <HeaderFormatter
                    viewMode={viewMode}
                    loading={loading}
                    onCancel={handleCancelCreate}
                    onSubmitForm={handleSubmitForm}
                  />
                  <CreateNewVariantForm
                    productId={variantDetails.product_id}
                    productName={variantDetails.name}
                    categoryId={variantDetails.category_id}
                    description={variantDetails.description}
                    categories={categories}
                    parentPrice={variantDetails.price}
                    parentWeightOz={variantDetails.weight_oz}
                    parentLengthIn={variantDetails.length_in}
                    parentWidthIn={variantDetails.width_in}
                    parentHeightIn={variantDetails.height_in}
                    onSubmit={handleCreateVariant}
                    onDirtyChange={setIsCreateFormDirty}
                    loading={loading}
                    onFormValidChange={setIsFormValid}
                    onRequestSubmit={handleRequestCreateVariant}
                  />
                </>
              )}

            {/* Edit View */}
            {viewMode === "edit" && variantDetails && (
              <>
                <HeaderFormatter
                  viewMode={viewMode}
                  loading={loading}
                  isActive={variantDetails.is_active}
                  hasUnsavedChanges={hasUnsavedChanges()}
                  isFormValid={isFormValid}
                  onNewVariant={handleNewVariant}
                  onToggleStatus={handleToggleStatus}
                  onSave={handleSaveVariant}
                  onDelete={handleDeleteVariant}
                />

                {availableVariants.length > 1 && (
                  <VariantSelector
                    variants={availableVariants}
                    currentVariantId={variantDetails.variant_id}
                    onVariantChange={handleVariantSwitch}
                    disabled={loading || hasUnsavedChanges()}
                  />
                )}

                <ImageManager
                  images={variantDetails.images}
                  onReorder={handleImageReorder}
                  onSetPrimary={handleSetPrimaryImage}
                  onDelete={handleDeleteImageLocal}
                  onUpload={openCloudinaryWidget}
                />

                <ProductOverlayForm
                  variant={variantDetails}
                  categories={categories}
                  productCategories={productCategories}
                  onChange={handleInputChange}
                  onValidationChange={setIsFormValid}
                  onAddCategory={handleAddCategory}
                  onRemoveCategory={handleRemoveCategory}
                  onSetPrimaryCategory={handleSetPrimaryCategory}
                />
              </>
            )}

            {/* Empty State */}
            {viewMode === "edit" && !variantDetails && (
              <div className="empty-state">
                <Package className="empty-state-icon" size={80} />
                <p className="empty-state-text">Select a product to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {message && (
        <ToastNotification message={message.text} type={message.type} />
      )}

      {/* Unsaved Changes Modal */}
      {unsavedChanges.showModal && (
        <ConfirmationModal
          title={
            viewMode === "create-product"
              ? "Discard New Product?"
              : viewMode === "create-variant"
                ? "Discard New Variant?"
                : "Unsaved Changes"
          }
          message={
            viewMode === "create-product"
              ? "You have started creating a new product. Do you want to discard it and continue?"
              : viewMode === "create-variant"
                ? "You have started creating a new variant. Do you want to discard it and continue?"
                : "You have unsaved changes. Do you want to discard them and continue?"
          }
          onConfirm={unsavedChanges.confirmDiscard}
          onCancel={unsavedChanges.cancelDiscard}
          confirmText="Discard"
          cancelText="Stay"
        />
      )}

      {/* Save Changes Confirmation */}
      {saveConfirmation.isOpen && saveConfirmation.config && (
        <ConfirmationModal
          title={saveConfirmation.config.title}
          message={saveConfirmation.config.message}
          onConfirm={saveConfirmation.handleConfirm}
          onCancel={saveConfirmation.handleCancel}
        />
      )}

      {/* Delete Product Confirmation */}
      {deleteConfirmation.isOpen && deleteConfirmation.config && (
        <ConfirmationModal
          title={deleteConfirmation.config.title}
          message={deleteConfirmation.config.message}
          onConfirm={deleteConfirmation.handleConfirm}
          onCancel={deleteConfirmation.handleCancel}
        />
      )}

      {/* Toggle Active/Inactive Confirmation */}
      {toggleConfirmation.isOpen && toggleConfirmation.config && (
        <ConfirmationModal
          title={toggleConfirmation.config.title}
          message={toggleConfirmation.config.message}
          confirmText={toggleConfirmation.config.confirmText}
          onConfirm={toggleConfirmation.handleConfirm}
          onCancel={toggleConfirmation.handleCancel}
        />
      )}

      {/* Create Product/Variant Confirmation */}
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

      {/* Cancel Create Confirmation */}
      {cancelCreateConfirmation.isOpen && cancelCreateConfirmation.config && (
        <ConfirmationModal
          title={cancelCreateConfirmation.config.title}
          message={cancelCreateConfirmation.config.message}
          confirmText={cancelCreateConfirmation.config.confirmText}
          cancelText={cancelCreateConfirmation.config.cancelText}
          onConfirm={cancelCreateConfirmation.handleConfirm}
          onCancel={cancelCreateConfirmation.handleCancel}
        />
      )}
    </div>
  );
};

export default ManageProducts;
