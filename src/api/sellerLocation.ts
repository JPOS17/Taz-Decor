const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Location {
  location_id: number;
  location_name: string;
  state: string;
  city: string;
  address_line1: string;
  address_line2?: string | null;
  zip: string;
  phone: string;
  contact_name: string;
  is_active: boolean;
}

// ============================================================================
// API FUNCTIONS - SELLER LOCATIONS
// ============================================================================

// GET all active warehouse locations
export const fetchWarehouseLocations = async (): Promise<Location[]> => {
  const response = await fetch(`${API_URL}/api/sellerlocation`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
};

// GET specific seller location by ID (for shipping label export)
export const fetchSellerLocationById = async (locationId: number): Promise<Location> => {
  const response = await fetch(`${API_URL}/api/sellerlocation/${locationId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch seller location');
  }
  return response.json();
};