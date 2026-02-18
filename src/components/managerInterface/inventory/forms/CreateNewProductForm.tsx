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

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Hooks

  const {
    images,
    primaryImageIndex,
    addImage,
    deleteImage,
    setPrimary,
    getReorderedImages,
  } = useImageManager();

  const { openWidget } = useCloudinaryWidget();

  const parsedProductTypeId = formData.product_type_id
    ? parseInt(formData.product_type_id)
    : 0;

  const { previewSKU, loading: loadingSKU } = useSKUPreview(
    parsedProductTypeId,
    previewProductSKUByType,
  );

  const { locations } = useWarehouseLocations();

  const { errors, setErrors, clearFieldError } = useFormValidation(
    formData,
    validateProductForm,
    hasAttemptedSubmit,
  );

  //Effects

  // Track dirty state
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

  // Update parent with form validity
  useEffect(() => {
    const isValid = Object.keys(errors).length === 0 && hasAttemptedSubmit;
    onFormValidChange?.(isValid);
  }, [errors, hasAttemptedSubmit, onFormValidChange]);

  // Initialize the primary category when categoryId changes
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
      // When categoryId is 0, start with empty array
      setFormData((prev) => ({
        ...prev,
        productCategories: [],
      }));
    }
  }, [categoryId, categories]);

  // Event Handlers - Form Fields

  const handleTextChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (hasAttemptedSubmit) {
      clearFieldError(field as string);
    }
  };

  const handleNumberChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (hasAttemptedSubmit) {
      clearFieldError(field as string);
    }
  };

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

  // Event Handlers - Category Management

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
    // Error clearing happens automatically via useFormValidation
  };

  const handleRemoveCategory = async (categoryId: number) => {
    setFormData((prev) => {
      const remaining = prev.productCategories.filter(
        (pc) => pc.category_id !== categoryId,
      );

      // If we removed the primary and there are still categories left,
      // make the first remaining one primary
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
    // Error handling happens automatically via useFormValidation
  };

  const handleSetPrimaryCategory = async (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      productCategories: prev.productCategories.map((pc) => ({
        ...pc,
        is_primary: pc.category_id === categoryId,
      })),
    }));
  };

  // Event Handlers - Image Management

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

  // Event Handlers - Form Submissions

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    // Validation happens automatically via useFormValidation hook
    // Just need to get the current validation errors
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

  const executeSubmit = () => {
    const primaryCategory = formData.productCategories.find(
      (pc) => pc.is_primary,
    );

    // Get all non-primary category IDs
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

  useFormSubmission({
    formData,
    additionalDeps: [images],
    executeSubmit,
    functionName: "__executeProductFormSubmit",
  });

  // Computed Values

  const productTypeOptions = productTypes.map((pt) => ({
    value: pt.product_type_id,
    label: `${pt.type_name} (${pt.sku_prefix})`,
  }));

  return (
    <form onSubmit={handleSubmit} className="product-form">
      {/* Product Type - ALWAYS FIRST */}
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
        <div style={{ marginBottom: "1.5rem" }}>
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

        {/* Product Name */}
        <FormField label="Product Name" required error={errors.name}>
          <TextInput
            value={formData.name}
            onChange={(value) => handleTextChange("name", value)}
            placeholder="Enter product name"
            error={!!errors.name}
            autoFormat={true}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description" required error={errors.description}>
          <TextInput
            value={formData.description}
            onChange={(value) => handleTextChange("description", value)}
            placeholder="Enter product description"
            error={!!errors.description}
            rows={3}
          />
        </FormField>

        {/* Price */}
        <FormField label="Price" required error={errors.price}>
          <TextInput
            type="number"
            value={formData.price}
            onChange={(value) => handleNumberChange("price", value)}
            placeholder="0.00"
            error={!!errors.price}
          />
        </FormField>

        {/* Stock Quantity */}
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

        {/* Warehouse Location */}
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
