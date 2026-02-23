const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ============================================================================
// INTERFACES - COUPON DATA
// ============================================================================

export interface Coupon {
  coupon_id: number;
  coupon_code: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping_only';
  discount_value?: number | null;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  free_shipping: boolean;
  applies_to_type: 'all' | 'category' | 'product' | 'product_type' | 'variant' | 'custom_group';
  applies_to_id?: number | null | string | number[];
  applies_to_name?: string;
  usage_limit_total?: number | null;
  usage_count_total: number;
  usage_limit_per_user?: number | null;
  requires_verified_email: boolean;
  valid_from: string;
  valid_until?: string | null;
  is_active: boolean;
  created_at: string;
  bogo_buy_quantity?: number;
  bogo_get_quantity?: number;
  bogo_discount_percentage?: number;
  variant_details?: Array<{ variant_id: number; product_id: number }>;
  location_ids?: number[] | null;
  location_names?: string;
}

export interface CreateCouponPayload {
  coupon_code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping_only';
  discount_value?: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  free_shipping?: boolean;
  applies_to_type: 'all' | 'category' | 'product' | 'product_type' | 'variant' | 'custom_group';
  applies_to_id?: number | string;
  usage_limit_total?: number;
  usage_limit_per_user?: number;
  requires_verified_email?: boolean;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  bogo_buy_quantity?: number;
  bogo_get_quantity?: number;
  bogo_discount_percentage?: number;
  location_ids?: number[];
}

export interface UpdateCouponPayload {
  description?: string;
  discount_type?: 'percentage' | 'fixed' | 'bogo' | 'free_shipping_only';
  discount_value?: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  free_shipping?: boolean;
  applies_to_type?: 'all' | 'category' | 'product' | 'product_type' | 'variant' | 'custom_group';
  applies_to_id?: number | string;
  usage_limit_total?: number;
  usage_limit_per_user?: number;
  requires_verified_email?: boolean;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  location_ids?: number[];
}

// ============================================================================
// INTERFACES - DROPDOWN OPTIONS
// ============================================================================

export interface CategoryOption {
  category_id: number;
  category_name: string;
}

export interface ProductTypeOption {
  product_type_id: number;
  type_name: string;
}

export interface ProductOption {
  product_id: number;
  name: string;
}

export interface LocationOption {
  location_id: number;
  location_name: string;
  state: string;
  city: string;
}

// ============================================================================
// API FUNCTIONS - COUPON MANAGEMENT
// ============================================================================

// GET all coupons with optional filters
export const fetchCoupons = async (
  status?: string | null,
  appliesTo?: string | null,
  search?: string | null,
  locationId?: string | null
): Promise<Coupon[]> => {
  const params = new URLSearchParams();
  
  if (status) params.append('status', status);
  if (appliesTo) params.append('appliesTo', appliesTo);
  if (search) params.append('search', search);
  if (locationId) params.append('locationId', locationId);

  const url = `${API_URL}/api/coupons${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coupons');
  }
  return response.json();
};

// GET single coupon by ID
export const fetchCouponById = async (couponId: number): Promise<Coupon> => {
  const response = await fetch(`${API_URL}/api/coupons/${couponId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coupon');
  }
  return response.json();
};

// CREATE new coupon
export const createCoupon = async (payload: CreateCouponPayload): Promise<Coupon> => {
  const response = await fetch(`${API_URL}/api/coupons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create coupon');
  }
  return response.json();
};

// UPDATE coupon
export const updateCoupon = async (
  couponId: number,
  payload: UpdateCouponPayload
): Promise<Coupon> => {
  const response = await fetch(`${API_URL}/api/coupons/${couponId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update coupon');
  }
  return response.json();
};

// DELETE coupon
export const deleteCoupon = async (couponId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/coupons/${couponId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete coupon');
  }
};

// TOGGLE coupon status
export const toggleCouponStatus = async (
  couponId: number,
  isActive: boolean
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/coupons/${couponId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle coupon status');
  }
};

// ============================================================================
// API FUNCTIONS - DROPDOWN DATA
// ============================================================================

// GET categories for dropdown
export const fetchCategoriesForCoupons = async (): Promise<CategoryOption[]> => {
  const response = await fetch(`${API_URL}/api/coupons/categories`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

// GET product types for dropdown
export const fetchProductTypesForCoupons = async (): Promise<ProductTypeOption[]> => {
  const response = await fetch(`${API_URL}/api/coupons/product-types`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch product types');
  }
  return response.json();
};

// GET products for dropdown
export const fetchProductsForCoupons = async (): Promise<ProductOption[]> => {
  const response = await fetch(`${API_URL}/api/coupons/products`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

// GET locations for dropdown
export const fetchLocationsForCoupons = async (): Promise<LocationOption[]> => {
  const response = await fetch(`${API_URL}/api/coupons/locations`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - PREVIEW & UTILITY
// ============================================================================

// GET all coupon codes for validation
export const fetchAllCouponCodes = async (): Promise<string[]> => {
  const response = await fetch(`${API_URL}/api/coupons/codes`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coupon codes');
  }
  return response.json();
};

// GET variant by ID (to get product_id for grouping)
export const fetchVariantById = async (variantId: number): Promise<any> => {
  const response = await fetch(`${API_URL}/api/coupons/variant/${variantId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch variant');
  }
  return response.json();
};

// GET variants for a specific product (for custom group selection)
export const fetchVariantsForProduct = async (productId: number): Promise<any[]> => {
  const response = await fetch(
    `${API_URL}/api/management/products/by-product/${productId}/variants`,
    {
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch variants');
  }
  return response.json();
};

// GET preview of products affected by coupon (for existing coupons)
export const fetchCouponPreview = async (couponId: number): Promise<{ products: any[] }> => {
  const response = await fetch(`${API_URL}/api/coupons/${couponId}/preview`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coupon preview');
  }
  return response.json();
};

// GET preview of products for a draft coupon (before creation)
export const fetchDraftCouponPreview = async (
  appliesTo: string,
  appliestoId?: string | number | null,
  locationIds?: number[]
): Promise<{ products: any[] }> => {
  const params = new URLSearchParams({
    applies_to_type: appliesTo,
    ...(appliestoId && { applies_to_id: appliestoId.toString() }),
    ...(locationIds && locationIds.length > 0 && { location_ids: locationIds.join(',') }),
  });

  const response = await fetch(`${API_URL}/api/coupons/preview-draft?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch draft coupon preview');
  }
  return response.json();
};