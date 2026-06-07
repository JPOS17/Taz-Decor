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

export interface Category {
  category_id: number;
  category_name: string;
  display_order: number;
  is_active: boolean;
}

export interface CreateCategoryPayload {
  category_name: string;
}

export interface UpdateCategoryPayload {
  category_name?: string;
  is_active?: boolean;
}

export interface ReorderCategoryItem {
  category_id: number;
  display_order: number;
}

// ============================================================================
// API FUNCTIONS - CATEGORIES
// ============================================================================

// GET all categories (optionally include inactive ones)
export const fetchCategories = async (
  includeInactive: boolean = false
): Promise<Category[]> => {
  const params = includeInactive ? '?includeInactive=true' : '';
  const response = await fetch(`${API_URL}/api/categories${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

// POST create new category
export const createCategory = async (
  payload: CreateCategoryPayload
): Promise<Category> => {
  const response = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create category');
  }
  return response.json();
};

// PUT update category
export const updateCategory = async (
  categoryId: number,
  payload: UpdateCategoryPayload
): Promise<Category> => {
  const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update category');
  }
  return response.json();
};

// DELETE category
export const deleteCategory = async (categoryId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete category');
  }
};

// PUT reorder categories
export const reorderCategories = async (
  categories: ReorderCategoryItem[]
): Promise<Category[]> => {
  const response = await fetch(`${API_URL}/api/categories/reorder`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ categories }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to reorder categories');
  }
  return response.json();
};