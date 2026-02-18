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

export interface ProductCategory {
  product_category_id: number;
  product_id: number;
  category_id: number;
  is_primary: boolean;
  category_name: string;
  category_is_active: boolean;
}

export interface AddProductCategoryPayload {
  category_id: number;
  is_primary?: boolean;
}

export interface UpdateProductCategoryPayload {
  is_primary: boolean;
}

// ============================================================================
// API FUNCTIONS - PRODUCT CATEGORIES
// ============================================================================

// GET all categories for a product
export const fetchProductCategories = async (
  productId: number
): Promise<ProductCategory[]> => {
  const response = await fetch(`${API_URL}/api/products/${productId}/categories`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch product categories');
  }
  return response.json();
};

// POST add category to product
export const addProductCategory = async (
  productId: number,
  payload: AddProductCategoryPayload
): Promise<ProductCategory> => {
  const response = await fetch(`${API_URL}/api/products/${productId}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to add category to product');
  }
  return response.json();
};

// PUT update product category (set as primary)
export const updateProductCategory = async (
  productId: number,
  categoryId: number,
  payload: UpdateProductCategoryPayload
): Promise<ProductCategory> => {
  const response = await fetch(
    `${API_URL}/api/products/${productId}/categories/${categoryId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update product category');
  }
  return response.json();
};

// DELETE remove category from product
export const removeProductCategory = async (
  productId: number,
  categoryId: number
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/products/${productId}/categories/${categoryId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to remove category from product');
  }
};