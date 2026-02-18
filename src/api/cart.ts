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

export interface CartItemDB {
  variant_id: number;
  quantity: number;
  selected_coupon_id?: number | null;
}

// ============================================================================
// API FUNCTIONS - CART
// ============================================================================

// GET user's cart from database
export const fetchCartFromDatabase = async (): Promise<any[]> => {
  const response = await fetch(`${API_URL}/api/cart`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }
  return response.json();
};

// POST sync localStorage cart to database after login
export const syncCartToDatabase = async (cartItems: CartItemDB[]): Promise<void> => {
  const response = await fetch(`${API_URL}/api/cart/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cartItems }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync cart');
  }
};

// POST add item to cart (database)
export const addToCartDB = async (
  variantId: number,
  quantity: number,
  selectedCouponId?: number | null
): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return; // Guest users don't sync

  const response = await fetch(`${API_URL}/api/cart/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      variant_id: variantId,
      quantity,
      selected_coupon_id: selectedCouponId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to add to cart');
  }
};

// DELETE remove item from cart (database)
export const removeFromCartDB = async (variantId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return; // Guest users don't sync

  const response = await fetch(`${API_URL}/api/cart/${variantId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to remove from cart');
  }
};

// DELETE clear entire cart (database)
export const clearCartDB = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return; // Guest users don't sync

  const response = await fetch(`${API_URL}/api/cart/clear`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to clear cart');
  }
};

// PUT update cart quantity (database)
export const updateCartQuantityDB = async (
  variantId: number,
  quantity: number
): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return; // Guest users don't sync

  const response = await fetch(`${API_URL}/api/cart/${variantId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    throw new Error('Failed to update cart');
  }
};

// PUT update cart item's selected coupon (database)
export const updateCartCouponDB = async (
  variantId: number,
  selectedCouponId: number | null
): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return; // Guest users don't sync

  const response = await fetch(`${API_URL}/api/cart/${variantId}/coupon`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ selected_coupon_id: selectedCouponId }),
  });

  if (!response.ok) {
    throw new Error('Failed to update cart coupon');
  }
};