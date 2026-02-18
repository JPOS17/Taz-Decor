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

export interface WishlistItemDB {
  variant_id: number;
  selected_coupon_id?: number | null;
}

// ============================================================================
// API FUNCTIONS - WISHLIST
// ============================================================================

// GET user's wishlist from database
export const fetchWishlistFromDatabase = async (): Promise<any[]> => {
  const response = await fetch(`${API_URL}/api/wishlist`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch wishlist');
  }
  return response.json();
};

// POST sync localStorage wishlist to database after login
export const syncWishlistToDatabase = async (
  wishlistItems: WishlistItemDB[]
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/wishlist/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ wishlistItems }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync wishlist');
  }
};

// POST add item to wishlist (database)
export const addToWishlistDB = async (
  variantId: number,
  selectedCouponId?: number | null
): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return; // Guest users don't sync

  const response = await fetch(`${API_URL}/api/wishlist/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      variant_id: variantId,
      selected_coupon_id: selectedCouponId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to add to wishlist');
  }
};

// DELETE remove item from wishlist (database)
export const removeFromWishlistDB = async (variantId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return; // Guest users don't sync

  const response = await fetch(`${API_URL}/api/wishlist/${variantId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to remove from wishlist');
  }
};