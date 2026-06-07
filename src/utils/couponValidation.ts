import type { CreateCouponPayload } from "../api/couponManagement";

export interface CouponValidationErrors {
  coupon_code?: string;
  discount_type?: string;
  discount_value?: string;
  min_purchase_amount?: string;
  applies_to_type?: string;
  applies_to_id?: string;
  custom_group?: string;
  bogo_buy_quantity?: string;
  bogo_get_quantity?: string;
  bogo_discount_percentage?: string;
  location_ids?: string; 
  valid_from?: string;
}

// Validates the coupon code format and uniqueness, and requires at least one location
export const validateStep1 = (
  formData: CreateCouponPayload,
  existingCouponCodes: string[] = [],
  isEditing: boolean = false
): CouponValidationErrors => {
  const errors: CouponValidationErrors = {};

  // Coupon code — required, 3–50 chars, uppercase alphanumeric/hyphens/underscores only
  if (!formData.coupon_code || formData.coupon_code.trim() === "") {
    errors.coupon_code = "Coupon code is required";
  } else if (formData.coupon_code.length < 3) {
    errors.coupon_code = "Coupon code must be at least 3 characters";
  } else if (formData.coupon_code.length > 50) {
    errors.coupon_code = "Coupon code must be less than 50 characters";
  } else if (!/^[A-Z0-9_-]+$/.test(formData.coupon_code)) {
    errors.coupon_code = "Coupon code can only contain letters, numbers, hyphens, and underscores";
  } else if (!isEditing && existingCouponCodes.includes(formData.coupon_code.toUpperCase())) {
    errors.coupon_code = "This coupon code already exists. Please choose a different code.";
  }

  // At least one store location must be selected
  if (!formData.location_ids || formData.location_ids.length === 0) {
    errors.location_ids = "Please select at least one store location";
  }

  return errors;
};

// Validates the applies_to_type and related fields based on the selected type
// Fixed and free_shipping_only types auto-set applies_to_type to "all" and skip specific selection validation (cart coupon level)
export const validateStep2 = (
  formData: CreateCouponPayload,
  customGroupProducts: number[]
): CouponValidationErrors => {
  const errors: CouponValidationErrors = {};

  const isFixedOrFreeShipping = 
    formData.discount_type === "fixed" || 
    formData.discount_type === "free_shipping_only";

  // Skip applies_to_type check for fixed/free_shipping_only — wizard sets it to "all" automatically
  if (!isFixedOrFreeShipping && (!formData.applies_to_type || (formData.applies_to_type as string) === "")) {
    errors.applies_to_type = "Please select where this coupon applies";
  }

  // Require a specific ID or group selection depending on the scope type
  if (formData.applies_to_type) {
    switch (formData.applies_to_type) {
      case "category":
        if (!formData.applies_to_id) {
          errors.applies_to_id = "Please select a category";
        }
        break;
      case "product_type":
        if (!formData.applies_to_id) {
          errors.applies_to_id = "Please select a product type";
        }
        break;
      case "product":
        if (!formData.applies_to_id) {
          errors.applies_to_id = "Please select a product";
        }
        break;
      case "variant":
        if (!formData.applies_to_id) {
          errors.applies_to_id = "Please select a variant";
        }
        break;
      case "custom_group":
        // custom_group uses customGroupProducts instead of applies_to_id
        if (customGroupProducts.length === 0) {
          errors.custom_group = "Please select at least one product for the custom group";
        }
        break;
      // 'all' doesn't need validation beyond type selection
    }
  }

  return errors;
};

// Validates discount values based on the discount type
export const validateStep3 = (
  formData: CreateCouponPayload
): CouponValidationErrors => {
  const errors: CouponValidationErrors = {};

  if (!formData.discount_type) {
    errors.discount_type = "Discount type is required";
  }

  // BOGO — all three quantity/percentage fields required and must be positive
  if (formData.discount_type === "bogo") {
    if (!formData.bogo_buy_quantity || formData.bogo_buy_quantity < 1) {
      errors.bogo_buy_quantity = "Buy quantity must be at least 1";
    }
    if (!formData.bogo_get_quantity || formData.bogo_get_quantity < 1) {
      errors.bogo_get_quantity = "Get quantity must be at least 1";
    }
    if (
      !formData.bogo_discount_percentage ||
      formData.bogo_discount_percentage <= 0 ||
      formData.bogo_discount_percentage > 100
    ) {
      errors.bogo_discount_percentage =
        "Discount percentage must be between 1 and 100";
    }
  }

  // Non-BOGO, non-free-shipping — discount_value is required and must be positive
  if (
    formData.discount_type !== "bogo" &&
    formData.discount_type !== "free_shipping_only" &&
    (!formData.discount_value || formData.discount_value <= 0)
  ) {
    errors.discount_value = "Discount value is required";
  }

  // Percentage — must be in the valid 0–100 range
  if (
    formData.discount_type === "percentage" &&
    formData.discount_value &&
    (formData.discount_value < 0 || formData.discount_value > 100)
  ) {
    errors.discount_value = "Percentage must be between 0 and 100";
  }

  // Fixed — minimum purchase must be at least 5× the discount to prevent abuse
  if (
    formData.discount_type === "fixed" &&
    formData.discount_value &&
    formData.discount_value > 0
  ) {
    const requiredMinimum = formData.discount_value * 5;
    
    if (!formData.min_purchase_amount || formData.min_purchase_amount < requiredMinimum) {
      errors.min_purchase_amount = `Minimum purchase must be at least $${requiredMinimum.toFixed(2)} (5x the discount amount of $${formData.discount_value.toFixed(2)})`;
    }
  }

  // Free shipping — requires a minimum purchase amount to qualify
  if (formData.discount_type === "free_shipping_only") {
    if (!formData.min_purchase_amount || formData.min_purchase_amount <= 0) {
      errors.min_purchase_amount = "Free shipping coupons require a minimum purchase amount";
    }
  }

  return errors;
};

// Validates that a valid_from date has been provided
export const validateStep4 = (
  formData: CreateCouponPayload
): CouponValidationErrors => {
  const errors: CouponValidationErrors = {};

  if (!formData.valid_from || formData.valid_from === "") {
    errors.valid_from = "Valid from date is required";
  }

  return errors;
};

// Main function to determine if the user can proceed to the next step based on validation results
export const canProceedToStep = (
  step: number,
  formData: CreateCouponPayload,
  customGroupProducts: number[],
  existingCouponCodes: string[] = [],
  isEditing: boolean = false
): boolean => {
  switch (step) {
    case 2:
      return Object.keys(validateStep1(formData, existingCouponCodes, isEditing)).length === 0;
    case 3:
      return Object.keys(validateStep2(formData, customGroupProducts)).length === 0;
    case 4:
      return Object.keys(validateStep3(formData)).length === 0;
    case 5:
      return Object.keys(validateStep4(formData)).length === 0;
    default:
      return true;
  }
};