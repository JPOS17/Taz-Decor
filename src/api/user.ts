const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ============================================================================
// INTERFACES - USER PROFILE
// ============================================================================

export interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
}

export interface DefaultAddress {
  address_id: number;
  address_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
}

export interface ProfileData {
  user: UserProfile;
  default_address: DefaultAddress | null;
}

export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
  phone?: string;
}

// ============================================================================
// INTERFACES - ADDRESSES
// ============================================================================

export interface Address {
  address_id: number;
  address_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
}

export interface CreateAddressPayload {
  address_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  is_default?: boolean;
}

// ============================================================================
// API FUNCTIONS - USER PROFILE
// ============================================================================

// GET user profile with default address
export const fetchUserProfile = async (): Promise<ProfileData> => {
  const response = await fetch(`${API_URL}/api/user/profile`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
};

// PUT update user profile (name, phone)
export const updateUserProfile = async (payload: UpdateProfilePayload): Promise<{
  message: string;
  user: UserProfile;
}> => {
  const response = await fetch(`${API_URL}/api/user/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }
  return response.json();
};

// DELETE account (password confirmed server-side)
export const deleteAccount = async (password: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/user/profile`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete account');
  }
  return response.json();
};

// ============================================================================
// API FUNCTIONS - ADDRESS MANAGEMENT
// ============================================================================

// GET all user addresses
export const fetchUserAddresses = async (): Promise<Address[]> => {
  const response = await fetch(`${API_URL}/api/user/addresses`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch addresses');
  }
  return response.json();
};

// POST create new address
export const createAddress = async (payload: CreateAddressPayload): Promise<Address> => {
  const response = await fetch(`${API_URL}/api/user/addresses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create address');
  }
  return response.json();
};

// PUT update existing address
export const updateAddress = async (
  addressId: number,
  payload: CreateAddressPayload
): Promise<Address> => {
  const response = await fetch(`${API_URL}/api/user/addresses/${addressId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update address');
  }
  return response.json();
};

// DELETE address
export const deleteAddress = async (addressId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/user/addresses/${addressId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete address');
  }
};

// PUT set default address
export const setDefaultAddress = async (addressId: number): Promise<{
  message: string;
  address: Address;
}> => {
  const response = await fetch(`${API_URL}/api/user/addresses/${addressId}/set-default`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set default address');
  }
  return response.json();
};