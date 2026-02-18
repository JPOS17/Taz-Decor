const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================================
// INTERFACES - REVIEWS
// ============================================================================

export interface Review {
  review_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  review_title: string | null;
  review_text: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  variant_details: string | null;
}

// ============================================================================
// INTERFACES - PRODUCT STATS
// ============================================================================

export interface ProductStats {
  wishlistCount: number;
  cartCount: number;
  reviewCount: number;
  averageRating: number | null;
}

// ============================================================================
// API FUNCTIONS - REVIEWS
// ============================================================================

// GET product reviews
export const fetchProductReviews = async (productId: number): Promise<Review[]> => {
  const response = await fetch(`${API_URL}/api/products/${productId}/reviews`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - PRODUCT STATS
// ============================================================================

// GET product stats (wishlist, cart, reviews)
export const fetchProductStats = async (variantId: number): Promise<ProductStats> => {
  const response = await fetch(`${API_URL}/api/products/${variantId}/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch product stats');
  }
  return response.json();
};