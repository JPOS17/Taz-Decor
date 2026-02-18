const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface CouponValidationRequest {
  cart_items: Array<{
    variant_id: number;
    quantity: number;
    price: number;
    selected_coupon_id?: number | null;
  }>;
  cart_level_coupon_id?: number | null;
}

export interface CouponValidationResult {
  valid: boolean;
  errors: Array<{
    variant_id: number;
    coupon_id: number;
    error: string;
  }>;
  validated_discounts: Array<{
    variant_id: number;
    coupon_id: number | null;
    original_price: number;
    discount_amount: number;
    final_price: number;
  }>;
  item_level_discount: number;
  total_discount: number;
  cart_level_discount?: {
    coupon_id: number;
    discount_amount: number;
    free_shipping?: boolean;  // ADDED: Free shipping flag
    error?: string;
  } | null;
}

// ============================================================================
// API FUNCTIONS - COUPON VALIDATION
// ============================================================================

// POST validate coupons before checkout (both item-level and cart-level)
export const validateCoupons = async (
  payload: CouponValidationRequest
): Promise<CouponValidationResult> => {
  const response = await fetch(`${API_URL}/api/checkout/validate-coupons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate coupons');
  }
  return response.json();
};