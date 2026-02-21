import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import PasswordInput from "../../components/universalComponents/PasswordInput";

import "../../styles/pages/signin/Login.css";

// ============================================================================
// COMPONENT
// ============================================================================

const Login = () => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================

  const { login } = useAuth();
  const { syncToDatabase } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================================
  // STATE
  // ============================================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Login returns user data
      await login(email, password);

      // Sync cart and wishlist from localStorage to database
      await syncToDatabase();

      // Check if there's a return URL in query params
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("redirect") || params.get("returnUrl");

      if (returnUrl) {
        // Redirect to the return URL
        navigate(decodeURIComponent(returnUrl));
      } else {
        // Default redirect to profile
        navigate("/profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          {/* Show message from redirect if exists */}
          {location.state?.message && (
            <div
              className="info-message"
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #3b82f6",
                color: "#1e40af",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {location.state.message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <div className="auth-footer">
            <p className="auth-link-text">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
