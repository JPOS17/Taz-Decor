export interface ValidationErrors {
  [key: string]: string;
}

export const validatePrice = (price: string): string | null => {
  const priceNum = parseFloat(price);
  if (!price || isNaN(priceNum) || priceNum <= 0) {
    return "Price must be greater than 0";
  }
  return null;
};

export const validateStockQuantity = (quantity: string): string | null => {
  const quantityNum = parseInt(quantity);
  if (!quantity || isNaN(quantityNum) || quantityNum < 0) {
    return "Stock quantity must be 0 or greater";
  }
  return null;
};

export const validateRequiredField = (
  value: string,
  fieldName: string
): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateCategories = (
  productCategories?: Array<{ category_id: number; is_primary: boolean }>
): string | null => {
  if (!productCategories || productCategories.length === 0) {
    return "At least one category is required";
  }
  
  const hasPrimary = productCategories.some(pc => pc.is_primary);
  if (!hasPrimary) {
    return "One category must be marked as primary";
  }
  
  return null;
};

export const validateProductTypeId = (productTypeId: string): string | null => {
  if (!productTypeId || productTypeId === "" || parseInt(productTypeId) <= 0) {
    return "Product type is required";
  }
  return null;
};

export const validateLocationId = (locationId: string): string | null => {
  if (!locationId || parseInt(locationId) <= 0) {
    return "Warehouse location is required";
  }
  return null;
};

export const validateWeight = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Weight must be greate than 0";
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return "Weight must be a valid number";
  }
  
  if (numValue <= 0) {
    return "Weight must be greater than 0";
  }
  
  return null;
};

export const validateShippingDimension = (
  value: string,
  fieldName: string
): string | null => {
  if (!value || value.trim() === "") {
    return `${fieldName} must be 0 or greater`;
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return `${fieldName} must be a valid number`;
  }

  if (numValue < 0) {
    return `${fieldName} cannot be negative`;
  }

  return null;
};

export const validateProductDimensions = (dimensions: {
  length_in: string;
  width_in: string;
  height_in: string;
}): string | null => {
  const length = parseFloat(dimensions.length_in);
  const width = parseFloat(dimensions.width_in);
  const height = parseFloat(dimensions.height_in);

  // At least two dimensions must be greater than 0
  const positiveCount = [length > 0, width > 0, height > 0].filter(Boolean).length;

  if (positiveCount < 2) {
    return "At least two dimensions must be greater than 0";
  }

  return null;
};

// Single validation function for all forms
export const validateProductForm = (formData: {
  name?: string;
  product_type_id?: string;
  price: string;
  stock_quantity: string;
  description?: string;
  location_id: string;
  weight_oz: string;
  length_in: string;
  width_in: string;
  height_in: string;
  color?: string;
  size?: string;
  productCategories?: Array<{ category_id: number; is_primary: boolean }>;
  sku?: string; 
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Product name
  if (formData.name !== undefined) {
    const nameError = validateRequiredField(formData.name, "Product name");
    if (nameError) errors.name = nameError;
  }

  // SKU 
  if (formData.sku !== undefined) {
    const skuError = validateRequiredField(formData.sku, "SKU");
    if (skuError) errors.sku = skuError;
  }

  // Categories 
  if (formData.productCategories !== undefined) {
    const categoryError = validateCategories(formData.productCategories);
    if (categoryError) errors.category_id = categoryError;
  }

  // Product Type 
  if (formData.product_type_id !== undefined) {
    const productTypeError = validateProductTypeId(formData.product_type_id);
    if (productTypeError) errors.product_type_id = productTypeError;
  }

  // Price
  const priceError = validatePrice(formData.price);
  if (priceError) errors.price = priceError;

  // Stock quantity
  const stockError = validateStockQuantity(formData.stock_quantity);
  if (stockError) errors.stock_quantity = stockError;

  // Description 
  if (formData.description !== undefined) {
    const descError = validateRequiredField(formData.description, "Description");
    if (descError) errors.description = descError;
  }

  // Location
  const locationError = validateLocationId(formData.location_id);
  if (locationError) errors.location_id = locationError;

  // Weight 
  const weightError = validateWeight(formData.weight_oz);
  if (weightError) errors.weight_oz = weightError;

  // Dimensions 
  const lengthError = validateShippingDimension(formData.length_in, "Length");
  if (lengthError) errors.length_in = lengthError;

  const widthError = validateShippingDimension(formData.width_in, "Width");
  if (widthError) errors.width_in = widthError;

  const heightError = validateShippingDimension(formData.height_in, "Height");
  if (heightError) errors.height_in = heightError;

  // Group validation - only if no individual dimension errors
  if (!lengthError && !widthError && !heightError) {
    const dimensionGroupError = validateProductDimensions({
      length_in: formData.length_in,
      width_in: formData.width_in,
      height_in: formData.height_in,
    });
    if (dimensionGroupError) {
      errors.package_dimensions = dimensionGroupError;
    }
  }

  return errors;
};

// variant form (same validation, just clearer naming)
export const validateVariantForm = validateProductForm;

// manager form (same validation, just clearer naming)
export const validateManagerForm = validateProductForm;