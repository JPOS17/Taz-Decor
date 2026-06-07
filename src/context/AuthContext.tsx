import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  login as loginService,
  register as registerService,
  getCurrentUser,
} from "../api/auth";

export type UserRole = "customer" | "manager" | "admin";

export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // isLoading stays true until the initial token check resolves
  // prevents protected routes from flashing before auth state is known
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // On mount, check for a token and fetch the current user if it exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token is invalid or expired — clear it so the user is treated as a guest
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ============================================================================
  // AUTH ACTIONS
  // ============================================================================

  // Re-fetches the current user from the API to update the user state with any changes.
  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  // Returns the user object so CartContext can sync the cart immediately after login
  const login = async (email: string, password: string): Promise<User> => {
    const { token, user: userData } = await loginService(email, password);
    localStorage.setItem("token", token);
    setUser(userData);
    return userData;
  };

  // Returns the user object so CartContext can sync the cart immediately after registration
  const register = async (data: RegisterData): Promise<User> => {
    const { token, user: userData } = await registerService(data);
    localStorage.setItem("token", token);
    setUser(userData);
    return userData;
  };

  // Removes the JWT token and clears the user from state, returning to a guest session
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Throws if used outside of AuthProvider to surface misconfigured component trees early
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
