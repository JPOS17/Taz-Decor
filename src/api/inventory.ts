const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ============================================================================
// INTERFACES - IMAGES
// ============================================================================

export interface VariantImage {
  image_id: number;
  img_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ImageOrderPayload {
  image_id: number;
  display_order: number;
}

// ============================================================================
// INTERFACES - VARIANTS
// ============================================================================

export interface ProductVariantForManagement {
  variant_id: number;
  product_id: number;
  name: string;
  price: number;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
  stock_quantity: number;
  category_id: number;
  category: string;
  product_type_id?: number | null;
  product_type?: string | null;
  sku_prefix?: string | null;
  primary_image?: string | null;
  location_id?: number | null;
  location_name?: string | null;
  variant_count?: number;
  is_active?: boolean;
}

export interface VariantDetails extends ProductVariantForManagement {
  sku?: string | null;
  description?: string | null;
  weight_oz?: number | null;
  length_in?: number | null;
  width_in?: number | null;
  height_in?: number | null;
  images: VariantImage[];
}

export interface VariantOption {
  variant_id: number;
  product_id: number;
  price: number;
  color?: string | null;
  size?: string | null;
  stock_quantity: number;
  sku: string;
  primary_image?: string | null;
}

// ============================================================================
// INTERFACES - PAYLOADS
// ============================================================================

export interface CreateProductPayload {
  name: string;
  category_id: number;
  product_type_id: number;
  price: number;
  stock_quantity: number;
  color?: string;
  size?: string;
  description?: string;
  location_id: number;
  weight_oz?: number;
  length_in?: number;
  width_in?: number;
  height_in?: number;
  images?: string[];
}

export interface CreateVariantPayload {
  product_id: number;
  price: number;
  stock_quantity: number;
  location_id: number;
  color?: string;
  size?: string;
  weight_oz?: number;
  length_in?: number;
  width_in?: number;
  height_in?: number;
  images?: string[];
}

export interface UpdateVariantPayload {
  name: string;
  price: number;
  color?: string | null;
  size?: string | null;
  stock_quantity: number;
  sku?: string;
  category_id: number;
  description?: string | null;
  location_id: number;
  weight_oz?: number | null;
  length_in?: number | null;
  width_in?: number | null;
  height_in?: number | null;
}

// ============================================================================
// API FUNCTIONS - PRODUCT FETCHING
// ============================================================================

// GET products for management with filters
export const fetchProductsForManagement = async (
  categoryId?: number | null,
  locationId?: number | null,
  productStatus?: string | null,
  stockStatus?: string | null,
  categoryStatus?: string | null,
  sortBy?: string | null
): Promise<ProductVariantForManagement[]> => {
  const params = new URLSearchParams();
  
  if (categoryId !== null && categoryId !== undefined) {
    params.append('categoryId', categoryId.toString());
  }
  if (locationId !== null && locationId !== undefined) {
    params.append('locationId', locationId.toString());
  }
  if (productStatus) {
    params.append('productStatus', productStatus);
  }
  if (stockStatus) {
    params.append('stockStatus', stockStatus);
  }
  if (categoryStatus) {
    params.append('categoryStatus', categoryStatus);
  }
  if (sortBy) {
    params.append('sortBy', sortBy);
  }

  const url = `${API_URL}/api/management/products${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch products for management');
  }
  return response.json();
};

// GET variant details by ID
export const fetchVariantDetails = async (
  variantId: number
): Promise<VariantDetails> => {
  const response = await fetch(
    `${API_URL}/api/management/products/${variantId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch variant details');
  }
  return response.json();
};

// GET all variants for a specific product
export const fetchProductVariants = async (
  productId: number
): Promise<VariantOption[]> => {
  const response = await fetch(
    `${API_URL}/api/management/products/by-product/${productId}/variants`,
    {
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch product variants');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - PRODUCT CREATION
// ============================================================================

// POST create new product
export const createNewProduct = async (
  payload: CreateProductPayload
): Promise<ProductVariantForManagement> => {
  const response = await fetch(`${API_URL}/api/management/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create product');
  }
  return response.json();
};

// POST create new variant for existing product
export const createNewVariant = async (
  payload: CreateVariantPayload
): Promise<ProductVariantForManagement> => {
  const { product_id, images, ...rest } = payload;
  
  const response = await fetch(`${API_URL}/api/management/products/by-product/${product_id}/variants`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...rest,
      image_urls: images  
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create variant');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - VARIANT MANAGEMENT
// ============================================================================

// PUT update variant
export const updateVariant = async (
  variantId: number,
  payload: UpdateVariantPayload
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/management/products/${variantId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update variant');
  }
};

// DELETE variant
export const deleteVariant = async (variantId: number): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/management/products/${variantId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete variant');
  }
};

// PUT toggle variant active status
export const toggleVariantStatus = async (
  variantId: number,
  isActive: boolean
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/management/products/${variantId}/status`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to toggle variant status');
  }
};

// ============================================================================
// API FUNCTIONS - IMAGE MANAGEMENT
// ============================================================================

// POST add image to variant
export const addImageToVariant = async (
  variantId: number,
  imgUrl: string
): Promise<VariantImage> => {
  const response = await fetch(
    `${API_URL}/api/management/products/${variantId}/images`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ img_url: imgUrl }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add image');
  }
  return response.json();
};

// DELETE image
export const deleteImage = async (imageId: number): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/management/products/images/${imageId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete image');
  }
};

// PUT set primary image
export const setPrimaryImage = async (imageId: number): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/management/products/images/${imageId}/primary`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to set primary image');
  }
};

// PUT update image order
export const updateImageOrder = async (
  variantId: number,
  imageOrders: ImageOrderPayload[]
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/management/products/${variantId}/images/reorder`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ images: imageOrders }), 
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update image order');
  }
};

// ============================================================================
// API FUNCTIONS - SKU PREVIEW
// ============================================================================

// GET preview SKU for new product by product type
export const previewProductSKUByType = async (
  productTypeId: number
): Promise<string> => {
  const response = await fetch(
    `${API_URL}/api/management/products/preview-sku/product-type/${productTypeId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to preview product SKU');
  }
  
  const data = await response.json();
  return data.sku;
};

// GET preview SKU for new variant
export const previewVariantSKU = async (
  productId: number
): Promise<string> => {
  const response = await fetch(
    `${API_URL}/api/management/products/preview-sku/product/${productId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to preview variant SKU');
  }
  
  const data = await response.json();
  return data.sku;
};