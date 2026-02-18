import { useState, useEffect } from "react";

import type { Category } from "../../../../api/categories";
import type { VariantDetails } from "../../../../api/inventory";
import type { ProductCategory } from "../../../../api/categoriesAssignments";

import { useWarehouseLocations } from "../../../../hooks/useWarehouseLocations";
import { useFormValidation } from "../../../../hooks/useFormValidation";

import { validateManagerForm } from "../../../../utils/formValidator";
import { scrollToFirstErrorSection } from "../../../../utils/scrollToError";

import { FormField } from "../../universal/FormField";
import { TextInput } from "../../universal/TextInput";
import { SelectInput } from "../../universal/SelectInput";
import ShippingFields from "../productInfo/ShippingFields";
import ProductAttributesFields from "../productInfo/ProductAttributesField";
import { WarehouseSelector } from "../productComponents/WarehouseSelector";
import CategoryHandler from "../productComponents/CategoryHandler";

import "../../../../styles/components/managerInterface/ProductForms.css";

interface ProductFormProps {
  variant: VariantDetails;
  categories: Category[];
  productCategories: ProductCategory[];
  onChange: (
    field: keyof VariantDetails,
    value: string | number | null,
  ) => void;
  onValidationChange?: (isValid: boolean) => void;
  onValidationAttempt?: () => void;
  onAddCategory?: (categoryId: number) => Promise<void>;
  onRemoveCategory?: (categoryId: number) => Promise<void>;
  onSetPrimaryCategory?: (categoryId: number) => Promise<void>;
}

interface FormData {
  name: string;
  sku: string;
  category_id: string;
  price: string;
  stock_quantity: string;
  description: string;
  location_id: string;
  weight_oz: string;
  length_in: string;
  width_in: string;
  height_in: string;
  color: string;
  size: string;
  productCategories: ProductCategory[];
}

const ProductForm = ({
  variant,
  categories,
  productCategories,
  onChange,
  onValidationChange,
  onAddCategory,
  onRemoveCategory,
  onSetPrimaryCategory,
}: ProductFormProps) => {
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const { locations } = useWarehouseLocations();

  // Convert variant to formData format for validation
  const formData: FormData = {
    name: variant.name || "",
    sku: variant.sku || "",
    category_id: variant.category_id?.toString() || "",
    price: variant.price?.toString() || "",
    stock_quantity: variant.stock_quantity?.toString() || "",
    description: variant.description || "",
    location_id: variant.location_id?.toString() || "",
    weight_oz: variant.weight_oz?.toString() || "",
    length_in: variant.length_in?.toString() || "",
    width_in: variant.width_in?.toString() || "",
    height_in: variant.height_in?.toString() || "",
    color: variant.color || "",
    size: variant.size || "",
    productCategories: productCategories,
  };

  // Use the validation hook
  const { errors, setErrors, clearFieldError } = useFormValidation(
    formData,
    validateManagerForm,
    hasAttemptedSave,
  );

  // Reset validation state when variant changes (new product loaded)
  useEffect(() => {
    setHasAttemptedSave(false);
    setErrors({});

    if (onValidationChange) {
      onValidationChange(true);
    }
  }, [variant.variant_id, onValidationChange, setErrors]);

  // Update parent with form validity
  useEffect(() => {
    if (hasAttemptedSave) {
      const isValid = Object.keys(errors).length === 0;
      if (onValidationChange) {
        onValidationChange(isValid);
      }
    }
  }, [errors, hasAttemptedSave, onValidationChange]);

  // Expose validation function to parent via window
  useEffect(() => {
    (window as any).__validateProductForm = () => {
      setHasAttemptedSave(true);
      const validationErrors = validateManagerForm(formData);
      setErrors(validationErrors);

      const isValid = Object.keys(validationErrors).length === 0;

      if (!isValid) {
        scrollToFirstErrorSection(validationErrors);
      }

      return isValid;
    };

    return () => {
      delete (window as any).__validateProductForm;
    };
  }, [formData, setErrors]);

  const handleInputChange = (field: keyof VariantDetails, value: string) => {
    if (hasAttemptedSave) {
      clearFieldError(field as string);
    }

    // For numeric fields
    if (
      field === "price" ||
      field === "stock_quantity" ||
      field === "category_id" ||
      field === "location_id"
    ) {
      const numValue = field === "price" ? parseFloat(value) : parseInt(value);
      onChange(field, !isNaN(numValue) ? numValue : null);
    } else {
      // For text fields
      onChange(field, value.trim() === "" ? null : value);
    }
  };

  const handleShippingChange = (field: string, value: number | null) => {
    if (hasAttemptedSave) {
      const isDimensionField = ["length_in", "width_in", "height_in"].includes(
        field,
      );
      clearFieldError(field, isDimensionField);
    }
    onChange(field as keyof VariantDetails, value);
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.category_id,
    label: cat.category_name,
  }));

  return (
    <div className="product-form">
      {/* SKU - READ-ONLY */}
      <div className="form-section">
        <FormField
          label="SKU"
          required
          error={errors.sku}
          helperText="Product SKU (cannot be edited)"
        >
          <TextInput
            value={variant.sku || ""}
            onChange={() => {}}
            placeholder="SKU"
            error={!!errors.sku}
            disabled={true}
          />
        </FormField>
      </div>

      {/* Product Information */}
      <div className="form-section" data-section="product-info">
        <h4 className="form-section-header">Product Information</h4>

        {/* Product Name */}
        <FormField label="Product Name" required error={errors.name}>
          <TextInput
            value={variant.name}
            onChange={(value) => handleInputChange("name", value)}
            placeholder="Enter product name"
            error={!!errors.name}
            autoFormat={true}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description" required error={errors.description}>
          <TextInput
            value={variant.description || ""}
            onChange={(value) => handleInputChange("description", value)}
            placeholder="Enter product description"
            error={!!errors.description}
            rows={3}
          />
        </FormField>

        {/* Category */}
        {onAddCategory && onRemoveCategory && onSetPrimaryCategory ? (
          <div style={{ marginBottom: "1.5rem" }}>
            <CategoryHandler
              productCategories={productCategories}
              availableCategories={categories}
              onAdd={onAddCategory}
              onRemove={onRemoveCategory}
              onSetPrimary={onSetPrimaryCategory}
              disabled={false}
              error={errors.category_id}
            />
          </div>
        ) : (
          <FormField label="Category" required error={errors.category_id}>
            <SelectInput
              value={variant.category_id}
              onChange={(value) => handleInputChange("category_id", value)}
              options={categoryOptions}
              error={!!errors.category_id}
            />
          </FormField>
        )}

        {/* Price */}
        <FormField label="Price" required error={errors.price}>
          <TextInput
            type="number"
            value={variant.price ?? ""}
            onChange={(value) => handleInputChange("price", value)}
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
            value={variant.stock_quantity ?? ""}
            onChange={(value) => handleInputChange("stock_quantity", value)}
            placeholder="0"
            error={!!errors.stock_quantity}
          />
        </FormField>

        {/* Warehouse Location */}
        <WarehouseSelector
          value={variant.location_id?.toString() || ""}
          onChange={(value) => handleInputChange("location_id", value)}
          locations={locations}
          error={errors.location_id}
        />
      </div>

      {/* Product Attributes */}
      <ProductAttributesFields
        color={variant.color || ""}
        size={variant.size || ""}
        errors={{}}
        onChange={(field, value) => {
          onChange(
            field as keyof VariantDetails,
            value.trim() === "" ? null : value,
          );
        }}
        optional={true}
        data-section="product-attributes"
      />

      {/* Shipping Information */}
      <ShippingFields
        weight_oz={variant.weight_oz ?? null}
        length_in={variant.length_in ?? null}
        width_in={variant.width_in ?? null}
        height_in={variant.height_in ?? null}
        errors={errors}
        onChange={handleShippingChange}
        required={true}
        showTitle={true}
        data-section="shipping-info"
      />
    </div>
  );
};

export default ProductForm;
