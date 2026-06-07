const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to get public headers (no auth)
const getPublicHeaders = () => ({
  "Content-Type": "application/json",
});

// ============================================================================
// INTERFACES 
// ============================================================================

// CART & VALIDATION
export interface CartValidationResult {
  valid: boolean;
  has_price_changes: boolean;
  items: Array<{
    variant_id: number;
    valid: boolean;
    error?: string;
    available_stock?: number;
    price_changed?: boolean;
    current_price?: number;
    cart_price?: number;
  }>;
}

// COUPON VALIDATION
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
    free_shipping?: boolean;
    error?: string;
  } | null;
}

// Shipping
export interface ShippingOption {
  carrier: string;
  service: string;
  service_level_name: string;
  amount: string;
  currency: string;
  estimated_days: number | null;
  rate_id: string;
  carrier_account: string;
}

export interface ShippingCalculationWithRates {
  shipping_options: ShippingOption[];
  weight_lbs: number;
  total_items: number;
  selected_box?: {
    box_id: number;
    box_name: string;
    dimensions: string;
  } | null;
}

// GUEST
export interface GuestInfo {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface GuestShippingAddress {
  address_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  first_name?: string;
  last_name?: string;
}

// ORDER CREATION
export interface CreateOrderPayload {
  shipping_address_id: number;
  cart_items: Array<{
    variant_id: number;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  item_level_discount?: number;
  cart_level_discount?: number;
  discount_amount?: number;
  shipping_cost: number;
  tax_amount: number;
  total_price: number;
  applied_coupons?: Array<{
    variant_id: number;
    coupon_id: number;
  }>;
  cart_level_coupon_id?: number | null;
  selected_shipping_rate_id?: string;
  shipping_carrier?: string;
  shipping_service?: string;
}

export interface CreateGuestOrderPayload {
  guest_info: GuestInfo;
  shipping_address: GuestShippingAddress;
  cart_items: Array<{
    variant_id: number;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_price: number;
  selected_shipping_rate_id?: string;
  shipping_carrier?: string;
  shipping_service?: string;
}

// ADDRESS VALIDATION
export interface AddressValidationInput {
  address_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface AddressValidationResult {
  is_valid: boolean;
  validation_results: {
    is_valid: boolean;
    messages: Array<{
      source?: string;
      code?: string;
      type?: string;
      text?: string;
    }>;
  };
  original_address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  validated_address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

// ============================================================================
// API FUNCTIONS - ADDRESS VALIDATION
// ============================================================================

// POST validate address (authenticated)
export const validateAddress = async (
  payload: AddressValidationInput
): Promise<AddressValidationResult> => {
  const response = await fetch(`${API_URL}/api/checkout/validate-address`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate address');
  }
  return response.json();
};

// POST validate address (guest)
export const validateAddressGuest = async (
  payload: AddressValidationInput
): Promise<AddressValidationResult> => {
  const response = await fetch(`${API_URL}/api/checkout/guest/validate-address`, {
    method: 'POST',
    headers: getPublicHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate address');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - CART VALIDATION
// ============================================================================

// POST validate cart before checkout (authenticated)
export const validateCart = async (cartItems: any[]): Promise<CartValidationResult> => {
  const response = await fetch(`${API_URL}/api/checkout/validate-cart`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cartItems }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate cart');
  }
  return response.json();
};

// POST validate cart before checkout (guest)
export const validateCartGuest = async (cartItems: any[]): Promise<CartValidationResult> => {
  const response = await fetch(`${API_URL}/api/checkout/guest/validate-cart`, {
    method: 'POST',
    headers: getPublicHeaders(),
    body: JSON.stringify({ cartItems }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate cart');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - COUPON VALIDATION
// ============================================================================

// POST validate coupons before order creation (item-level and cart-level)
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

// ============================================================================
// API FUNCTIONS - SHIPPING
// ============================================================================

// POST calculate shipping cost (authenticated)
export const calculateShipping = async (
  cartItems: any[],
  addressId: number
): Promise<ShippingCalculationWithRates> => {
  const response = await fetch(`${API_URL}/api/checkout/calculate-shipping`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cartItems, addressId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to calculate shipping');
  }
  return response.json();
};

// POST calculate shipping cost (guest)
export const calculateShippingGuest = async (
  cartItems: any[],
  address: GuestShippingAddress
): Promise<ShippingCalculationWithRates> => {
  const response = await fetch(`${API_URL}/api/checkout/guest/calculate-shipping`, {
    method: 'POST',
    headers: getPublicHeaders(),
    body: JSON.stringify({ cartItems, address }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to calculate shipping');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - ORDER CREATION
// ============================================================================

// POST create order (authenticated)
export const createOrder = async (payload: CreateOrderPayload): Promise<{
  message: string;
  order: {
    order_id: number;
    order_number: string;
    total_price: number;
    status: string;
    created_at: string;
  };
}> => {
  const response = await fetch(`${API_URL}/api/checkout/create-order`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }
  return response.json();
};

// POST create order (guest)
export const createGuestOrder = async (payload: CreateGuestOrderPayload): Promise<{
  message: string;
  order: {
    order_id: number;
    order_number: string;
    total_price: number;
    status: string;
    created_at: string;
  };
}> => {
  const response = await fetch(`${API_URL}/api/checkout/guest/create-order`, {
    method: 'POST',
    headers: getPublicHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }
  return response.json();
};