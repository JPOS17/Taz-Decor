import { useState, useEffect, useRef, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaCross, FaCheck } from "react-icons/fa";
import { resetPassword } from "../../api/auth";
import { getPasswordStrength, getPasswordError } from "../../utils/passwordRules";

import PasswordInput from "../../components/shared/PasswordInput";

const ResetPassword = () => {
  // ============================================================================
  // HOOKS & ROUTING
  // ============================================================================

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  // Holds the post-success redirect timer so it can be cancelled on unmount
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Derived from the password on every render, so it can never go stale
  const passwordStrength = getPasswordStrength(formData.newPassword);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cancels the pending redirect if the user leaves the page first
  useEffect(() => {
    return () => clearTimeout(redirectTimer.current);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Updates form fields as the user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validates the passwords, calls the reset API, then redirects to login after 3 seconds
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (getPasswordError(formData.newPassword)) {
      setError("Password does not meet requirements");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, formData.newPassword);
      setIsSuccess(true);
      redirectTimer.current = setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isSuccess) {
    return (
      <div className="reset-container">
        <div className="reset-card reset-card--centered">
          {/* Success confirmation — auto-redirects to login after 3 seconds */}
          <div className="reset-success-icon" aria-hidden="true">
            <FaCheck />
          </div>
          <h1 className="reset-title">Password Reset Successful!</h1>
          <p className="reset-subtitle">
            Your password has been successfully reset. You can now log in with
            your new password.
          </p>
          <p className="reset-redirect" role="status">
            Redirecting to login...
          </p>
          {/* Manual redirect link in case auto-redirect is slow */}
          <Link to="/login" className="reset-action-btn">
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        {/* Page header */}
        <div className="reset-header">
          <span className="reset-emblem" aria-hidden="true">
            <FaCross />
          </span>
          <h1 className="reset-title">Reset Your Password</h1>
          <p className="reset-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          {/* Inline error message */}
          {error && (
            <div className="reset-error-message" role="alert">
              {error}
            </div>
          )}

          {/* New password input with live strength meter */}
          <div className="reset-form-group">
            <label htmlFor="newPassword" className="reset-label">
              New Password <span className="reset-required">*</span>
            </label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              autoComplete="new-password"
              ariaDescribedBy="reset-password-requirements"
              required
            />
            {/* Strength bar and requirements checklist */}
            {formData.newPassword && (
              <div className="reset-password-strength">
                <div className="reset-strength-header">
                  <div
                    className="reset-strength-bar"
                    role="progressbar"
                    aria-label="Password strength"
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={passwordStrength.score}
                    aria-valuetext={passwordStrength.label || "Too short"}
                  >
                    <div
                      className={`reset-strength-fill reset-strength-${passwordStrength.score}`}
                    />
                  </div>
                  <span className="reset-strength-label">
                    {passwordStrength.label}
                  </span>
                </div>
                <ul
                  id="reset-password-requirements"
                  className="reset-password-requirements"
                >
                  {passwordStrength.results.map((req) => (
                    <li key={req.id} className={req.met ? "reset-req-met" : ""}>
                      {req.label}
                      <span className="reset-visually-hidden">
                        {req.met ? " (met)" : " (not met)"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm password input */}
          <div className="reset-form-group">
            <label htmlFor="confirmPassword" className="reset-label">
              Confirm New Password <span className="reset-required">*</span>
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="reset-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>

          {/* Back to login link */}
          <div className="reset-form-footer">
            <Link to="/login" className="reset-back-link">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;