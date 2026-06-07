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

// SELLER LOCATIONS
export interface SellerLocation {
  location_id: number;
  location_name: string;
  state: string;
  city: string;
  address_line1: string;
  address_line2?: string | null;
  zip: string;
  phone?: string | null;
  contact_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateLocationPayload {
  location_name: string;
  state: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  zip: string;
  phone?: string;
  contact_name?: string;
  is_active?: boolean;
}

export interface UpdateLocationPayload {
  location_name?: string;
  state?: string;
  city?: string;
  address_line1?: string;
  address_line2?: string;
  zip?: string;
  phone?: string;
  contact_name?: string;
  is_active?: boolean;
}

// SHIPPING BOXES
export interface ShippingBox {
  box_id: number;
  box_name: string;
  length_in: number;
  width_in: number;
  height_in: number;
  box_type: 'box' | 'envelope';
  location_id?: number | null;
  location_name?: string | null;
  box_size_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateShippingBoxPayload {
  box_name: string;
  length_in: number;
  width_in: number;
  height_in: number;
  box_type: 'box' | 'envelope';
  location_id: number;  
  is_active?: boolean;
}

export interface UpdateShippingBoxPayload {
  box_name?: string;
  length_in?: number;
  width_in?: number;
  height_in?: number;
  box_type?: 'box' | 'envelope';
  location_id?: number;
  is_active?: boolean;
}

// ============================================================================
// API FUNCTIONS - SELLER LOCATIONS
// ============================================================================

// GET all locations with optional filters
export const fetchLocations = async (
  active?: string | null
): Promise<SellerLocation[]> => {
  const params = new URLSearchParams();
  
  if (active) params.append('active', active);

  const url = `${API_URL}/api/settings/locations${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
};

// GET single location by ID
export const fetchLocationById = async (locationId: number): Promise<SellerLocation> => {
  const response = await fetch(`${API_URL}/api/settings/locations/${locationId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch location');
  }
  return response.json();
};

// CREATE new location
export const createLocation = async (payload: CreateLocationPayload): Promise<SellerLocation> => {
  const response = await fetch(`${API_URL}/api/settings/locations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create location');
  }
  return response.json();
};

// UPDATE location
export const updateLocation = async (
  locationId: number,
  payload: UpdateLocationPayload
): Promise<SellerLocation> => {
  const response = await fetch(`${API_URL}/api/settings/locations/${locationId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update location');
  }
  return response.json();
};

// DELETE location
export const deleteLocation = async (locationId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/settings/locations/${locationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete location');
  }
};

// TOGGLE location status
export const toggleLocationStatus = async (
  locationId: number,
  isActive: boolean
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/settings/locations/${locationId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle location status');
  }
};

// ============================================================================
// API FUNCTIONS - SHIPPING BOXES
// ============================================================================

// GET all shipping boxes with optional filters
export const fetchShippingBoxes = async (
  active?: string | null,
  locationId?: string | null,
  boxType?: string | null
): Promise<ShippingBox[]> => {
  const params = new URLSearchParams();
  
  if (active) params.append('active', active);
  if (locationId) params.append('location_id', locationId);
  if (boxType) params.append('box_type', boxType);

  const url = `${API_URL}/api/settings/shipping-boxes${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch shipping boxes');
  }
  return response.json();
};

// GET single shipping box by ID
export const fetchShippingBoxById = async (boxId: number): Promise<ShippingBox> => {
  const response = await fetch(`${API_URL}/api/settings/shipping-boxes/${boxId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch shipping box');
  }
  return response.json();
};

// CREATE new shipping box
export const createShippingBox = async (payload: CreateShippingBoxPayload): Promise<ShippingBox> => {
  const response = await fetch(`${API_URL}/api/settings/shipping-boxes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create shipping box');
  }
  return response.json();
};

// UPDATE shipping box
export const updateShippingBox = async (
  boxId: number,
  payload: UpdateShippingBoxPayload
): Promise<ShippingBox> => {
  const response = await fetch(`${API_URL}/api/settings/shipping-boxes/${boxId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update shipping box');
  }
  return response.json();
};

// DELETE shipping box
export const deleteShippingBox = async (boxId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/settings/shipping-boxes/${boxId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete shipping box');
  }
};

// TOGGLE shipping box status
export const toggleShippingBoxStatus = async (
  boxId: number,
  isActive: boolean
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/settings/shipping-boxes/${boxId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle shipping box status');
  }
};

// REORDER shipping boxes
export const reorderShippingBoxes = async (
  boxes: Array<{ box_id: number; box_size_order: number }>
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/settings/shipping-boxes/reorder`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ boxes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reorder shipping boxes');
  }
};