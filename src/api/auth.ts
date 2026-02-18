const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export interface UserResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "customer" | "manager" | "admin";
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserResponse;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// ============================================================================
// AUTHENTICATION API FUNCTIONS
// ============================================================================

/**
 * LOGIN user
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  return response.json();
};

/**
 * REGISTER new user
 */
export const register = async (
  data: RegisterData
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  return response.json();
};

/**
 * GET current authenticated user
 */
export const getCurrentUser = async (): Promise<UserResponse> => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get current user");
  }

  return response.json();
};

// ============================================================================
// EMAIL VERIFICATION API FUNCTIONS
// ============================================================================

/**
 * VERIFY email with token
 */
export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/auth/verify-email/${token}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Email verification failed");
  }

  return response.json();
};

/**
 * RESEND verification email
 */
export const resendVerificationEmail = async (): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to resend verification email");
  }

  return response.json();
};

// ============================================================================
// PASSWORD RESET API FUNCTIONS
// ============================================================================

/**
 * REQUEST password reset
 */
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to request password reset");
  }

  return response.json();
};

/**
 * RESET password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reset password");
  }

  return response.json();
};