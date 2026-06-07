import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../api/auth";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/signin/ForgotPassword.css";

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

  // Submits the email to trigger a password reset link and switches to the success view
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isSubmitted) {
    return (
      <div className="forgot-container">
        <div className="forgot-card">
          {/* Success confirmation — shown after the reset email is sent */}
          <div className="forgot-success-icon">✓</div>
          <h1 className="forgot-title">Check Your Email</h1>
          <p className="forgot-subtitle">
            If an account exists with {email}, you will receive a password reset
            link shortly.
          </p>
          <p className="forgot-info">
            The link will expire in 1 hour. If you don't see the email, check
            your spam folder.
          </p>
          <Link to="/login" className="forgot-back-to-login">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        {/* Page header */}
        <div className="forgot-header">
          <h1 className="forgot-title">Forgot Password?</h1>
          <p className="forgot-subtitle">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-form">
          {/* Inline error message */}
          {error && <div className="forgot-error-message">{error}</div>}

          {/* Email input */}
          <div className="forgot-form-group">
            <label htmlFor="email" className="forgot-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="forgot-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {isLoading && <LoadingSpinner message="Sending reset link..." />}

          <button
            type="submit"
            className="forgot-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>

          {/* Back to login link */}
          <div className="forgot-form-footer">
            <Link to="/login" className="forgot-back-link">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
