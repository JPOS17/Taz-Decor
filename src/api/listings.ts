const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================================
// INTERFACES
// ============================================================================

// BASE
export interface BaseProduct {
  variant_id: number;
  name: string;
  price: number;
}

// PRODUCT PREVIEW
export interface ProductPreview extends BaseProduct {
  product_id: number;
  primary_image: string;
  category: string;
  category_id: number;
  product_type_id?: number | null;
  color?: string;
  size?: string;
  location_id: number;
}

export interface ProductFilters {
  categoryId?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: string | null;
  onSaleOnly?: boolean;
  freeShippingOnly?: boolean;
}

// PRODUCT DETAIL
export interface ProductDetail extends BaseProduct {
  product_id: number;
  images: string[];
  description?: string;
  category: string;
  category_id: number;
  product_type_id?: number | null;
  color?: string;
  size?: string;
  quantity: number;
  weight_oz: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  location_city: string;
  location_state: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  variant_id: number;
  sku: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
  weight_oz: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  images: string[];
}

// ============================================================================
// API FUNCTIONS - PRODUCTS
// ============================================================================

// GET product preview with filters
export const fetchProductPreview = async (
  filters: ProductFilters = {}
): Promise<ProductPreview[]> => {
  const params = new URLSearchParams();
  
  if (filters.categoryId) {
    params.append('categoryId', filters.categoryId.toString());
  }
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    params.append('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    params.append('maxPrice', filters.maxPrice.toString());
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.onSaleOnly) {
    params.append('onSaleOnly', 'true');
  }
  if (filters.freeShippingOnly) {
    params.append('freeShippingOnly', 'true');
  }

  const queryString = params.toString();
  const url = `${API_URL}/api/products${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

// GET product detail by variant ID
export const fetchProductDetail = async (
  variantId: number
): Promise<ProductDetail> => {
  const response = await fetch(`${API_URL}/api/products/${variantId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch product details');
  }
  return response.json();
};