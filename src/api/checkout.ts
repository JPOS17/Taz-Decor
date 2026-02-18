export { fetchUserProfile } from './user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const getPublicHeaders = () => ({
  "Content-Type": "application/json",
});

// ============================================================================
// INTERFACES - ADDRESS VALIDATION
// ============================================================================

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
// INTERFACES - CART & VALIDATION
// ============================================================================

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

// ============================================================================
// INTERFACES - SHIPPING
// ============================================================================

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

// ============================================================================
// INTERFACES - GUEST
// ============================================================================

export interface GuestInfo {
  email: string;
  first_name: string;
  last_name?: string;
  phone?: string;
}

/** The inline shipping address used for guest checkout and guest shipping calc */
export interface GuestShippingAddress {
  address_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  // Needed by Shippo for the "To" name on the label
  first_name?: string;
  last_name?: string;
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

// ============================================================================
// INTERFACES - ORDERS
// ============================================================================

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

export interface Order {
  order_id: number;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total_price: number;
  total_weight_oz?: number;
  status: string;
  tracking_number?: string;
  shipping_carrier?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip?: string;
  item_count?: number;
}

export interface OrderItem {
  order_item_id: number;
  variant_id: number;
  product_name: string;
  variant_details?: string;
  quantity: number;
  price_at_purchase: number;
  img_url?: string;
}

export interface OrderDetails extends Order {
  address_name?: string;
  address_line2?: string;
  country?: string;
  phone?: string;
  first_name?: string;   
  last_name?: string;    
  location_id?: number;
  location_name?: string;
  seller_city?: string;
  seller_state?: string;
  total_weight_oz?: number;
  box_name?: string;
  box_type?: string;
  box_length?: number;
  box_width?: number;
  box_height?: number;
  items: OrderItem[];
}

/** OrderDetails extended with guest-specific fields */
export interface GuestOrderDetails extends Omit<OrderDetails, 'first_name' | 'last_name'> {
  guest_email: string;
  guest_first_name: string;
  guest_last_name?: string;
  guest_phone?: string;
}

export interface StatusHistoryItem {
  log_id: number;
  status: string;
  notes: string;
  created_at: string;
}

export interface UpdateOrderStatusPayload {
  status: string;
  notes?: string;
  tracking_number?: string;
  shipping_carrier?: string;
}

// ============================================================================
// API FUNCTIONS - ADDRESS VALIDATION
// ============================================================================

// POST validate address for authenticated users (saved address flow)
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

// POST validate address for guests (no token)
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
// API FUNCTIONS - CART & VALIDATION
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
// API FUNCTIONS - SHIPPING
// ============================================================================

// POST calculate shipping cost (authenticated — uses saved address ID)
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

// POST calculate shipping cost (guest — address passed inline)
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
// API FUNCTIONS - ORDERS
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

// POST create guest order (no auth)
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

// GET all orders (admin/manager use - for OrderStatus page)
export const fetchAllOrders = async (
  limit: number = 100,
  offset: number = 0
): Promise<Order[]> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${API_URL}/api/checkout/admin/orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
};

// GET user's own order history (customers)
export const fetchUserOrders = async (
  limit: number = 20,
  offset: number = 0
): Promise<Order[]> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${API_URL}/api/checkout/orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
};

// GET specific order details by order ID (authenticated)
export const fetchOrderDetails = async (orderId: number): Promise<OrderDetails> => {
  const response = await fetch(`${API_URL}/api/checkout/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch order details');
  }
  return response.json();
};

// GET specific order details by order number (authenticated)
export const fetchOrderByNumber = async (orderNumber: string): Promise<OrderDetails> => {
  const response = await fetch(`${API_URL}/api/checkout/orders/by-number/${orderNumber}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch order details');
  }
  return response.json();
};

// GET guest order by order number + email (no auth)
export const fetchGuestOrderByNumber = async (
  orderNumber: string,
  email: string
): Promise<GuestOrderDetails> => {
  const params = new URLSearchParams({ email });
  const response = await fetch(
    `${API_URL}/api/checkout/guest/orders/by-number/${orderNumber}?${params.toString()}`,
    { headers: getPublicHeaders() }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch order details');
  }
  return response.json();
};

// PUT update order status (admin only)
export const updateOrderStatus = async (
  orderId: number,
  payload: UpdateOrderStatusPayload
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/checkout/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update order status');
  }
  return response.json();
};

// GET order status history
export const fetchOrderStatusHistory = async (orderId: number): Promise<{
  status_history: StatusHistoryItem[];
}> => {
  const response = await fetch(`${API_URL}/api/checkout/orders/${orderId}/status-history`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch status history');
  }
  return response.json();
};