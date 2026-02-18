import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";

import "../../styles/pages/signin/ForgotPassword.css";

// ============================================================================
// COMPONENT
// ============================================================================

const ForgotPassword = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER - SUCCESS STATE
  // ============================================================================

  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="success-icon">✓</div>
          <h1 className="forgot-password-title">Check Your Email</h1>
          <p className="forgot-password-subtitle">
            If an account exists with {email}, you will receive a password reset
            link shortly.
          </p>
          <p className="forgot-password-info">
            The link will expire in 1 hour. If you don't see the email, check
            your spam folder.
          </p>
          <Link to="/login" className="back-to-login">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - FORM
  // ============================================================================

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1 className="forgot-password-title">Forgot Password?</h1>
          <p className="forgot-password-subtitle">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
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

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="form-footer">
            <Link to="/login" className="back-link">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
