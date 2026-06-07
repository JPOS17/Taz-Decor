import { useState, useEffect } from "react";

import type { Category } from "../../../../api/categories";
import { previewVariantSKU } from "../../../../api/inventory";

import { useCloudinaryWidget } from "../../../../hooks/useCloudinaryWidget";
import { useImageManager } from "../../../../hooks/useImageManager";
import { useFormSubmission } from "../../../../hooks/useFormSubmission";
import { useWarehouseLocations } from "../../../../hooks/useWarehouseLocations";
import { useSKUPreview } from "../../../../hooks/useSKUPreview";
import { useFormValidation } from "../../../../hooks/useFormValidation";

import { validateVariantForm } from "../../../../utils/formValidator";
import { scrollToFirstErrorSection } from "../../../../utils/scrollToError";
import { sanitizeFolderName } from "../../../../utils/folderNameFormatter";

import { FormField } from "../../universal/FormField";
import { TextInput } from "../../universal/TextInput";
import SKUPreview from "../productInfo/SKUPreview";
import ShippingFields from "../productInfo/ShippingFields";
import ProductAttributesFields from "../productInfo/ProductAttributesField";
import ImageUploadGrid from "../productComponents/ImageUploadGrid";
import { WarehouseSelector } from "../productComponents/WarehouseSelector";

import "../../../../styles/components/managerInterface/ProductForms.css";

interface CreateVariantFormProps {
  productId: number;
  productName: string;
  categoryId: number;
  description?: string | null;
  categories: Category[];
  parentPrice?: number;
  parentWeightOz?: number | null;
  parentLengthIn?: number | null;
  parentWidthIn?: number | null;
  parentHeightIn?: number | null;
  onSubmit: (variantData: {
    product_id: number;
    price: number;
    stock_quantity: number;
    location_id: number;
    color?: string;
    size?: string;
    images?: string[];
    weight_oz?: number;
    length_in?: number;
    width_in?: number;
    height_in?: number;
  }) => void;
  onDirtyChange: (isDirty: boolean) => void;
  loading: boolean;
  onFormValidChange?: (isValid: boolean) => void;
  onRequestSubmit?: () => void;
  onValidationError?: (message: string) => void;
}

interface FormData {
  price: string;
  stock_quantity: string;
  color: string;
  size: string;
  location_id: string;
  weight_oz: string;
  length_in: string;
  width_in: string;
  height_in: string;
}

const CreateVariantForm = ({
  productId,
  productName,
  categoryId,
  description,
  categories,
  parentPrice,
  parentWeightOz,
  parentLengthIn,
  parentWidthIn,
  parentHeightIn,
  onSubmit,
  onDirtyChange,
  onFormValidChange,
  onRequestSubmit,
  onValidationError,
}: CreateVariantFormProps) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Shipping and price fields are pre-filled from parent values when available
  const [formData, setFormData] = useState<FormData>({
    price: parentPrice ? parentPrice.toString() : "",
    stock_quantity: "",
    color: "",
    size: "",
    location_id: "",
    weight_oz: parentWeightOz ? parentWeightOz.toString() : "",
    length_in: parentLengthIn ? parentLengthIn.toString() : "",
    width_in: parentWidthIn ? parentWidthIn.toString() : "",
    height_in: parentHeightIn ? parentHeightIn.toString() : "",
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

  const { errors, clearFieldError } = useFormValidation(
    formData,
    validateVariantForm,
    hasAttemptedSubmit,
  );

  // SKU is fetched from the API based on the parent product — needed before images can be uploaded
  const { previewSKU, loading: loadingSKU } = useSKUPreview(
    productId,
    previewVariantSKU,
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Resolved for display in the shared product info box
  const categoryName =
    categories.find((c) => c.category_id === categoryId)?.category_name ||
    "Unknown";

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Notify parent of dirty state
  useEffect(() => {
    const isDirty =
      formData.stock_quantity !== "" ||
      formData.location_id !== "" ||
      formData.color.trim() !== "" ||
      formData.size.trim() !== "" ||
      images.length > 0 ||
      formData.price !== (parentPrice ? parentPrice.toString() : "") ||
      formData.weight_oz !==
        (parentWeightOz ? parentWeightOz.toString() : "") ||
      formData.length_in !==
        (parentLengthIn ? parentLengthIn.toString() : "") ||
      formData.width_in !== (parentWidthIn ? parentWidthIn.toString() : "") ||
      formData.height_in !== (parentHeightIn ? parentHeightIn.toString() : "");

    onDirtyChange(isDirty);
  }, [
    formData,
    images,
    parentPrice,
    parentWeightOz,
    parentLengthIn,
    parentWidthIn,
    parentHeightIn,
    onDirtyChange,
  ]);

  // Notify parent of form validity after the first submit attempt
  useEffect(() => {
    const isValid = Object.keys(errors).length === 0 && hasAttemptedSubmit;
    onFormValidChange?.(isValid);
  }, [errors, hasAttemptedSubmit, onFormValidChange]);

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
      // Dimension fields (L/W/H) share a single error key — pass flag to clear it correctly
      const isDimensionField = ["length_in", "width_in", "height_in"].includes(
        field,
      );
      clearFieldError(field, isDimensionField);
    }
  };

  // ============================================================================
  // EVENT HANDLERS — IMAGE MANAGEMENT
  // ============================================================================

  // Opens Cloudinary upload widget — blocked until the SKU is resolved (needed for folder path)
  const handleOpenWidget = () => {
    if (!previewSKU || loadingSKU) {
      alert("Please wait for SKU to load before uploading images.");
      return;
    }

    const category = categories.find((c) => c.category_id === categoryId);
    const categoryFolder = category
      ? sanitizeFolderName(category.category_name)
      : "uncategorized";

    openWidget({
      folder: `${categoryFolder}/${previewSKU}`,
      multiple: true,
      onSuccess: addImage,
    });
  };

  // ============================================================================
  // EVENT HANDLERS — FORM SUBMISSION
  // ============================================================================

  // Validates the form and either delegates to the parent (onRequestSubmit) or submits directly
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const validationErrors = validateVariantForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      scrollToFirstErrorSection(validationErrors);
      if (onValidationError) {
        onValidationError(
          "Please fix all validation errors before creating the variant",
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
    onSubmit({
      images: getReorderedImages(),
      product_id: productId,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
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
    });
  };

  // Registers executeSubmit on window so the parent overlay can trigger submission externally
  useFormSubmission({
    formData,
    additionalDeps: [images],
    executeSubmit,
    functionName: "__executeVariantFormSubmit",
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="product-form">
      {/* SKU Preview */}
      <SKUPreview sku={previewSKU} loading={loadingSKU} type="variant" />

      {/* Read-only shared product info inherited from the parent */}
      <div className="info-box">
        <h4>Product Information (Shared)</h4>
        <div className="info-box-content">
          <div>
            <strong>Product:</strong> {productName}
          </div>
          <div>
            <strong>Category:</strong> {categoryName}
          </div>
          {description && (
            <div>
              <strong>Description:</strong> {description}
            </div>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <ImageUploadGrid
        images={images}
        primaryImageIndex={primaryImageIndex}
        onSetPrimary={setPrimary}
        onDeleteImage={deleteImage}
        onUploadClick={handleOpenWidget}
        uploadDisabled={!previewSKU || loadingSKU}
        helperText="Optional: You can add images now or later after creating the variant"
      />

      {/* Variant-specific fields */}
      <div className="form-section" data-section="product-info">
        <h4 className="form-section-header">Variant Information</h4>

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

export default CreateVariantForm;
