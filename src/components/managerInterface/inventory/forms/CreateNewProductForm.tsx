import { useState, useEffect } from "react";

import type { Category } from "../../../../api/categories";
import type { ProductType } from "../../../../api/productTypes";
import { previewProductSKUByType } from "../../../../api/inventory";
import type { ProductCategory } from "../../../../api/categoriesAssignments";

import { useCloudinaryWidget } from "../../../../hooks/useCloudinaryWidget";
import { useImageManager } from "../../../../hooks/useImageManager";
import { useFormSubmission } from "../../../../hooks/useFormSubmission";
import { useWarehouseLocations } from "../../../../hooks/useWarehouseLocations";
import { useSKUPreview } from "../../../../hooks/useSKUPreview";
import { useFormValidation } from "../../../../hooks/useFormValidation";

import { validateProductForm } from "../../../../utils/formValidator";
import { scrollToFirstErrorSection } from "../../../../utils/scrollToError";
import { sanitizeFolderName } from "../../../../utils/folderNameFormatter";

import { FormField } from "../../universal/FormField";
import { TextInput } from "../../universal/TextInput";
import { SelectInput } from "../../universal/SelectInput";

import SKUPreview from "../productInfo/SKUPreview";
import ShippingFields from "../productInfo/ShippingFields";
import ProductAttributesFields from "../productInfo/ProductAttributesField";

import ImageUploadGrid from "../productComponents/ImageUploadGrid";
import { WarehouseSelector } from "../productComponents/WarehouseSelector";
import CategoryHandler from "../productComponents/CategoryHandler";

import "../../../../styles/components/managerInterface/ProductForms.css";

interface CreateProductFormProps {
  categoryId: number;
  categories: Category[];
  productTypes: ProductType[];
  onSubmit: (productData: {
    name: string;
    category_id: number;
    product_type_id: number;
    price: number;
    stock_quantity: number;
    color?: string;
    size?: string;
    images: string[];
    description?: string;
    location_id: number;
    weight_oz?: number;
    length_in?: number;
    width_in?: number;
    height_in?: number;
    additional_category_ids?: number[];
  }) => void;
  onDirtyChange: (isDirty: boolean) => void;
  loading: boolean;
  onFormValidChange?: (isValid: boolean) => void;
  onRequestSubmit?: () => void;
  onValidationError?: (message: string) => void;
}

interface FormData {
  name: string;
  category_id: string;
  product_type_id: string;
  price: string;
  stock_quantity: string;
  color: string;
  size: string;
  location_id: string;
  description: string;
  weight_oz: string;
  length_in: string;
  width_in: string;
  height_in: string;
  productCategories: ProductCategory[];
}

const CreateProductForm = ({
  categoryId,
  categories,
  productTypes,
  onSubmit,
  onDirtyChange,
  onFormValidChange,
  onRequestSubmit,
  onValidationError,
}: CreateProductFormProps) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // category_id is pre-seeded from the prop when a valid category is provided
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category_id: categoryId > 0 ? categoryId.toString() : "",
    product_type_id: "",
    price: "",
    stock_quantity: "",
    color: "",
    size: "",
    location_id: "",
    description: "",
    weight_oz: "",
    length_in: "",
    width_in: "",
    height_in: "",
    productCategories: [],
  });

  // Gates inline validation display until the user has attempted to submit
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const {
    images,
    primaryImageIndex,
    addImage,
    deleteImage,
    setPrimary,
    getReorderedImages,
  } = useImageManager();

  const { openWidget } = useCloudinaryWidget();

  const { locations } = useWarehouseLocations();

  const { errors, setErrors, clearFieldError } = useFormValidation(
    formData,
    validateProductForm,
    hasAttemptedSubmit,
  );

  // SKU preview is driven by product type — parsed to 0 when unset to avoid an API call
  const parsedProductTypeId = formData.product_type_id
    ? parseInt(formData.product_type_id)
    : 0;

  const { previewSKU, loading: loadingSKU } = useSKUPreview(
    parsedProductTypeId,
    previewProductSKUByType,
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Notify parent whenever any field has been touched (used to gate the unsaved-changes warning)
  useEffect(() => {
    const isDirty =
      formData.name.trim() !== "" ||
      formData.description.trim() !== "" ||
      formData.price !== "" ||
      formData.stock_quantity !== "" ||
      formData.location_id !== "" ||
      formData.color.trim() !== "" ||
      formData.size.trim() !== "" ||
      formData.weight_oz !== "" ||
      formData.length_in !== "" ||
      formData.width_in !== "" ||
      formData.height_in !== "" ||
      formData.product_type_id !== "" ||
      images.length > 0 ||
      formData.productCategories.length > 0;

    onDirtyChange(isDirty);
  }, [formData, images, onDirtyChange]);

  // Notify parent of form validity after the first submit attempt
  useEffect(() => {
    const isValid = Object.keys(errors).length === 0 && hasAttemptedSubmit;
    onFormValidChange?.(isValid);
  }, [errors, hasAttemptedSubmit, onFormValidChange]);

  // Seed the primary category in formData whenever the categoryId prop changes
  useEffect(() => {
    if (categoryId > 0) {
      const category = categories.find((c) => c.category_id === categoryId);
      if (category) {
        setFormData((prev) => ({
          ...prev,
          productCategories: [
            {
              product_category_id: 0,
              product_id: 0,
              category_id: categoryId,
              is_primary: true,
              category_name: category.category_name,
              category_is_active: category.is_active,
            },
          ],
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        productCategories: [],
      }));
    }
  }, [categoryId, categories]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Formatted for the product type SelectInput — label includes the SKU prefix for clarity
  const productTypeOptions = productTypes.map((pt) => ({
    value: pt.product_type_id,
    label: `${pt.type_name} (${pt.sku_prefix})`,
  }));

  // ============================================================================
  // EVENT HANDLERS — FORM FIELDS
  // ============================================================================

  // Updates a string field and clears its error if validation has already run
  const handleTextChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (hasAttemptedSubmit) {
      clearFieldError(field as string);
    }
  };

  // Updates a numeric field (kept as string) and clears its error if validation has already run
  const handleNumberChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (hasAttemptedSubmit) {
      clearFieldError(field as string);
    }
  };

  // Converts null back to an empty string for controlled input compatibility
  const handleShippingChange = (field: string, value: number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === null ? "" : value.toString(),
    }));
    if (hasAttemptedSubmit) {
      const isDimensionField = ["length_in", "width_in", "height_in"].includes(
        field,
      );
      clearFieldError(field, isDimensionField);
    }
  };

  // ============================================================================
  // EVENT HANDLERS — CATEGORY MANAGEMENT
  // ============================================================================

  // Adds a category — the first category added is automatically set as primary
  const handleAddCategory = async (categoryId: number) => {
    const category = categories.find((c) => c.category_id === categoryId);
    if (!category) return;

    setFormData((prev) => {
      const isFirstCategory = prev.productCategories.length === 0;
      return {
        ...prev,
        productCategories: [
          ...prev.productCategories,
          {
            product_category_id: 0,
            product_id: 0,
            category_id: categoryId,
            is_primary: isFirstCategory,
            category_name: category.category_name,
            category_is_active: category.is_active,
          },
        ],
      };
    });
  };

  // Removes a category — if the removed category was primary, promotes the first remaining entry
  const handleRemoveCategory = async (categoryId: number) => {
    setFormData((prev) => {
      const remaining = prev.productCategories.filter(
        (pc) => pc.category_id !== categoryId,
      );

      if (remaining.length > 0) {
        const hadPrimary = prev.productCategories.some(
          (pc) => pc.category_id === categoryId && pc.is_primary,
        );
        if (hadPrimary) {
          return {
            ...prev,
            productCategories: remaining.map((pc, index) => ({
              ...pc,
              is_primary: index === 0,
            })),
          };
        }
      }

      return {
        ...prev,
        productCategories: remaining,
      };
    });
  };

  // Sets a single category as primary, clearing the flag on all others
  const handleSetPrimaryCategory = async (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      productCategories: prev.productCategories.map((pc) => ({
        ...pc,
        is_primary: pc.category_id === categoryId,
      })),
    }));
  };

  // ============================================================================
  // EVENT HANDLERS — IMAGE MANAGEMENT
  // ============================================================================

  // Opens Cloudinary upload widget — blocked until product type and SKU are both resolved
  const handleOpenWidget = () => {
    if (!formData.product_type_id) {
      alert("Please select a product type before uploading images.");
      return;
    }

    if (!previewSKU || loadingSKU || previewSKU === "###-###-###") {
      alert("Please wait for SKU to load before uploading images.");
      return;
    }

    const category = categories.find(
      (c) => c.category_id === parseInt(formData.category_id),
    );

    const categoryFolder = category
      ? sanitizeFolderName(category.category_name)
      : "uncategorized";
    const productFolder = previewSKU;

    openWidget({
      folder: `${categoryFolder}/${productFolder}`,
      multiple: true,
      onSuccess: addImage,
      onError: (error) => {
        console.error("Failed to upload image:", error);
      },
    });
  };

  // ============================================================================
  // EVENT HANDLERS — FORM SUBMISSION
  // ============================================================================

  // Validates the form and either delegates to the parent (onRequestSubmit) or submits directly
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const validationErrors = validateProductForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      scrollToFirstErrorSection(validationErrors);
      if (onValidationError) {
        onValidationError(
          "Please fix all validation errors before creating the product",
        );
      }
      return;
    }

    if (onRequestSubmit) {
      onRequestSubmit();
    } else {
      executeSubmit();
    }
  };

  // Parses all string fields to their correct types and calls the parent onSubmit handler
  const executeSubmit = () => {
    const primaryCategory = formData.productCategories.find(
      (pc) => pc.is_primary,
    );

    // Non-primary categories are passed separately so the API can create the assignments
    const additionalCategoryIds = formData.productCategories
      .filter((pc) => !pc.is_primary)
      .map((pc) => pc.category_id);

    onSubmit({
      images: getReorderedImages(),
      name: formData.name.trim(),
      category_id:
        primaryCategory?.category_id || parseInt(formData.category_id),
      product_type_id: parseInt(formData.product_type_id),
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      description: formData.description.trim() || undefined,
      location_id: parseInt(formData.location_id),
      color: formData.color.trim() || undefined,
      size: formData.size.trim() || undefined,
      weight_oz: formData.weight_oz
        ? parseFloat(formData.weight_oz)
        : undefined,
      length_in: formData.length_in
        ? parseFloat(formData.length_in)
        : undefined,
      width_in: formData.width_in ? parseFloat(formData.width_in) : undefined,
      height_in: formData.height_in
        ? parseFloat(formData.height_in)
        : undefined,
      additional_category_ids:
        additionalCategoryIds.length > 0 ? additionalCategoryIds : undefined,
    });
  };

  // Registers executeSubmit on window so the parent overlay can trigger submission externally
  useFormSubmission({
    formData,
    additionalDeps: [images],
    executeSubmit,
    functionName: "__executeProductFormSubmit",
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="product-form">
      {/* Product Type */}
      <FormField
        label="Product Type"
        required
        error={errors.product_type_id}
        helperText="Determines the SKU prefix (e.g., JRN for Journals)"
      >
        <SelectInput
          value={formData.product_type_id}
          onChange={(value) => handleNumberChange("product_type_id", value)}
          options={productTypeOptions}
          placeholder="-- Select Product Type --"
          error={!!errors.product_type_id}
        />
      </FormField>

      {/* SKU Preview */}
      <SKUPreview sku={previewSKU} loading={loadingSKU} type="product" />

      {/* Image Upload */}
      <ImageUploadGrid
        images={images}
        primaryImageIndex={primaryImageIndex}
        onSetPrimary={setPrimary}
        onDeleteImage={deleteImage}
        onUploadClick={handleOpenWidget}
        uploadDisabled={
          !formData.product_type_id ||
          !previewSKU ||
          loadingSKU ||
          previewSKU === "###-###-###"
        }
      />

      {/* Product Information */}
      <div className="form-section" data-section="product-info">
        <h4 className="form-section-header">Product Information</h4>

        {/* Category Manager */}
        <div className="pf-category-wrapper">
          <CategoryHandler
            productCategories={formData.productCategories}
            availableCategories={categories}
            onAdd={handleAddCategory}
            onRemove={handleRemoveCategory}
            onSetPrimary={handleSetPrimaryCategory}
            disabled={false}
            error={errors.category_id}
          />
        </div>

        <FormField label="Product Name" required error={errors.name}>
          <TextInput
            value={formData.name}
            onChange={(value) => handleTextChange("name", value)}
            placeholder="Enter product name"
            error={!!errors.name}
            autoFormat={true}
          />
        </FormField>

        <FormField label="Description" required error={errors.description}>
          <TextInput
            value={formData.description}
            onChange={(value) => handleTextChange("description", value)}
            placeholder="Enter product description"
            error={!!errors.description}
            rows={3}
          />
        </FormField>

        <FormField label="Price" required error={errors.price}>
          <TextInput
            type="number"
            value={formData.price}
            onChange={(value) => handleNumberChange("price", value)}
            placeholder="0.00"
            error={!!errors.price}
          />
        </FormField>

        <FormField
          label="Stock Quantity"
          required
          error={errors.stock_quantity}
        >
          <TextInput
            type="number"
            value={formData.stock_quantity}
            onChange={(value) => handleNumberChange("stock_quantity", value)}
            placeholder="0"
            error={!!errors.stock_quantity}
          />
        </FormField>

        <WarehouseSelector
          value={formData.location_id}
          onChange={(value) => handleNumberChange("location_id", value)}
          locations={locations}
          error={errors.location_id}
        />
      </div>

      {/* Product Attributes */}
      <ProductAttributesFields
        color={formData.color}
        size={formData.size}
        onChange={(field, value) =>
          handleTextChange(field as keyof FormData, value)
        }
        data-section="product-attributes"
      />

      {/* Shipping Information */}
      <ShippingFields
        weight_oz={formData.weight_oz ? parseFloat(formData.weight_oz) : null}
        length_in={formData.length_in ? parseFloat(formData.length_in) : null}
        width_in={formData.width_in ? parseFloat(formData.width_in) : null}
        height_in={formData.height_in ? parseFloat(formData.height_in) : null}
        errors={errors}
        onChange={handleShippingChange}
        required={true}
        data-section="shipping-info"
      />
    </form>
  );
};

export default CreateProductForm;
