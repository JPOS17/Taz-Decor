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
// SHARED ORDER INTERFACES
// ============================================================================

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
  shipping_service?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  customer_email?: string;
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
  location_id?: number;
  location_name?: string;
  seller_city?: string;
  seller_state?: string;
  box_name?: string;
  box_type?: string;
  box_length?: number;
  box_width?: number;
  box_height?: number;
  items: OrderItem[];
}

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
// API FUNCTIONS - ORDER LOOKUPS
// ============================================================================

// GET all orders (admin/manager use - for OrderStatus page)
export const fetchAllOrders = async (
  limit: number = 100,
  offset: number = 0
): Promise<Order[]> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${API_URL}/api/orders/admin/orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
};

// GET user's own order history 
export const fetchUserOrders = async (
  limit: number = 20,
  offset: number = 0
): Promise<Order[]> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${API_URL}/api/orders/orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
};

// GET specific order details by order ID 
export const fetchOrderDetails = async (orderId: number): Promise<OrderDetails> => {
  const response = await fetch(`${API_URL}/api/orders/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order details');
  }
  return response.json();
};

// GET specific order details by order number 
export const fetchOrderByNumber = async (orderNumber: string): Promise<OrderDetails> => {
  const response = await fetch(`${API_URL}/api/orders/orders/by-number/${orderNumber}`, {
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
    `${API_URL}/api/orders/guest/orders/by-number/${orderNumber}?${params.toString()}`,
    { headers: getPublicHeaders() }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch order details');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - ORDER STATUS
// ============================================================================

// PUT update order status (admin only)
export const updateOrderStatus = async (
  orderId: number,
  payload: UpdateOrderStatusPayload
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/orders/orders/${orderId}/status`, {
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
  const response = await fetch(`${API_URL}/api/orders/orders/${orderId}/status-history`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch status history');
  }
  return response.json();
};