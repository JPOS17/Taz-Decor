const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ProductStats {
  wishlistCount: number;
  cartCount: number;
  reviewCount: number;
  averageRating: number | null;
}

export const fetchProductStats = async (variantId: number): Promise<ProductStats> => {
  const response = await fetch(`${API_URL}/api/products/${variantId}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch product stats');
  }
  return response.json();
};
