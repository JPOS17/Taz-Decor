const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get auth headers
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

export interface ProductType {
  product_type_id: number;
  type_name: string;
  sku_prefix: string;
  description: string;
}

export interface CreateProductTypePayload {
  type_name: string;
  sku_prefix: string;
  description: string;
}

export interface UpdateProductTypePayload {
  description: string;
}

// ============================================================================
// API FUNCTIONS - PRODUCT TYPES
// ============================================================================

// GET all active product types
export const fetchProductTypes = async (): Promise<ProductType[]> => {
  const response = await fetch(`${API_URL}/api/product-types`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch product types');
  }
  return response.json();
};

// GET single product type by ID
export const fetchProductTypeById = async (
  productTypeId: number
): Promise<ProductType> => {
  const response = await fetch(`${API_URL}/api/product-types/${productTypeId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch product type');
  }
  return response.json();
};

// POST create new product type
export const createProductType = async (
  payload: CreateProductTypePayload
): Promise<ProductType> => {
  const response = await fetch(`${API_URL}/api/product-types`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product type');
  }
  return response.json();
};

// PATCH update product type description
export const updateProductType = async (
  productTypeId: number,
  payload: UpdateProductTypePayload
): Promise<ProductType> => {
  const response = await fetch(`${API_URL}/api/product-types/${productTypeId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update product type');
  }
  return response.json();
};