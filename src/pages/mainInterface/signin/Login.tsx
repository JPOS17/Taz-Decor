import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

import PasswordInput from "../../../components/universalComponents/PasswordInput";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/signin/Login.css";

const Login = () => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================

  const { login } = useAuth();
  const { syncToDatabase, loadFromDatabase } = useCart();
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

  // Logs the user in, syncs the guest cart to the database, then redirects
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);

      // Sync guest cart/wishlist to database, then load full DB state
      await syncToDatabase();
      await loadFromDatabase();

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

  // Forwards the redirect param to the register page if present
  const redirectParam = new URLSearchParams(location.search).get("redirect");

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Page header */}
        <div className="login-header">
          <h1 className="login-title">Welcome</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Inline error message */}
          {error && <div className="login-error-message">{error}</div>}

          {/* Info message passed via router state */}
          {location.state?.message && (
            <div className="login-info-message">{location.state.message}</div>
          )}

          {/* Email input */}
          <div className="login-form-group">
            <label htmlFor="email" className="login-label">
              Email <span className="login-required">*</span>
            </label>
            <input
              type="email"
              id="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password input */}
          <div className="login-form-group">
            <div className="login-password-header">
              <label htmlFor="password" className="login-label">
                Password <span className="login-required">*</span>
              </label>
              <Link to="/forgot-password" className="login-forgot-link">
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

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          {/* Register link */}
          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{" "}
              <Link
                to={
                  redirectParam
                    ? `/register?redirect=${redirectParam}`
                    : "/register"
                }
                className="login-footer-link"
              >
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
