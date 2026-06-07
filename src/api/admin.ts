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

export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "customer" | "manager" | "admin";
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

// ============================================================================
// API FUNCTIONS - USER MANAGEMENT
// ============================================================================

// GET all users
export const getAllUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}/api/admin/users`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch users");
  }

  const data = await response.json();
  return data.users;
};

// PATCH update user role
export const updateUserRole = async (
  userId: number,
  role: "customer" | "manager" | "admin"
): Promise<User> => {
  const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update user role");
  }

  const data = await response.json();
  return data.user;
};

// PATCH toggle user active status
export const toggleUserStatus = async (userId: number): Promise<User> => {
  const response = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to toggle user status");
  }

  const data = await response.json();
  return data.user;
};

// POST send email to user
export const sendEmailToUser = async (
  userId: number,
  subject: string,
  message: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/admin/users/${userId}/email`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ subject, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }
};