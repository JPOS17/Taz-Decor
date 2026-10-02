import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaCross, FaCheck } from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { resendVerificationEmail } from "../../api/auth";
import { getPasswordStrength, getPasswordError } from "../../utils/passwordRules";

import PasswordInput from "../../components/shared/PasswordInput";

const Register = () => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================

  const { register } = useAuth();
  const { syncToDatabase, loadFromDatabase } = useCart();
  const location = useLocation();
  const errorRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  // Derived from the password on every render, so it can never go stale
  const passwordStrength = getPasswordStrength(formData.password);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Scrolls to the error message whenever a new error is set
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Updates form fields; the phone field is limited to phone-number characters
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow only digits, +, (, ), -, and spaces in the phone field
    const nextValue =
      name === "phone" ? value.replace(/[^\d+\-()\s]/g, "") : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  // Validates the form, registers the user, syncs the guest cart, then shows the success view
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); // clears first

    const passwordError = getPasswordError(formData.password);
    if (passwordError) {
      setTimeout(() => setError(passwordError), 0); // forces re-trigger
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setTimeout(() => setError("Passwords do not match"), 0);
      return;
    }

    setIsLoading(true);

    try {
      // Strip confirmPassword before sending to the API
      const { confirmPassword, ...registerData } = formData;

      await register(registerData);
      // Sync guest cart/wishlist to database, then load full DB state
      await syncToDatabase();
      await loadFromDatabase();
      setIsRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  // Resends the verification email and locks the button to prevent duplicate sends
  const handleResend = async () => {
    if (resendStatus !== "idle") return;
    setResendStatus("sending");
    try {
      await resendVerificationEmail();
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Reads the redirect param so the success screen can send the user to the right place
  const redirectParam = new URLSearchParams(location.search).get("redirect");
  const redirectTo = redirectParam || "/profile";
  const redirectLabel =
    redirectTo === "/cart" ? "Go to your cart" : "Go to your profile";

  if (isRegistered) {
    return (
      <div className="register-container">
        <div className="register-card register-card--centered">
          <div className="register-success-icon" aria-hidden="true">
            <FaCheck />
          </div>
          <h1 className="register-title">Check your inbox</h1>
          <p className="register-subtitle">We sent a verification link to</p>
          <p className="register-email-chip">{formData.email}</p>
          <p className="register-info">
            Verifying your email unlocks discounts and coupons on future orders.
          </p>
          <p className="register-hint">
            Didn't get it? Check your spam folder, or resend below.
          </p>
          <Link
            to={redirectTo}
            className="register-submit-btn register-submit-btn--link"
          >
            {redirectLabel}
          </Link>
          <button
            type="button"
            className="register-resend-btn"
            onClick={handleResend}
            disabled={resendStatus !== "idle"}
          >
            {resendStatus === "sending" ? (
              "Sending..."
            ) : resendStatus === "sent" ? (
              <>
                Email sent <FaCheck aria-hidden="true" />
              </>
            ) : (
              "Resend verification email"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Page header */}
        <div className="register-header">
          <span className="register-emblem" aria-hidden="true">
            <FaCross />
          </span>
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Inline error message */}
          {error && (
            <div ref={errorRef} className="register-error-message" role="alert">
              {error}
            </div>
          )}

          {/* First and last name */}
          <div className="register-form-row">
            <div className="register-form-group">
              <label htmlFor="first_name" className="register-label">
                First Name <span className="register-required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="register-input"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                autoComplete="given-name"
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="last_name" className="register-label">
                Last Name <span className="register-required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="register-input"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          {/* Email input */}
          <div className="register-form-group">
            <label htmlFor="email" className="register-label">
              Email <span className="register-required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="register-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Phone input */}
          <div className="register-form-group">
            <label htmlFor="phone" className="register-label">
              Phone <span className="register-optional">(Optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="register-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />
          </div>

          {/* Password input with live strength meter */}
          <div className="register-form-group">
            <label htmlFor="password" className="register-label">
              Password <span className="register-required">*</span>
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              ariaDescribedBy="register-password-requirements"
              required
            />
            {/* Strength bar and requirements checklist */}
            {formData.password && (
              <div className="register-password-strength">
                <div className="register-strength-header">
                  <div
                    className="register-strength-bar"
                    role="progressbar"
                    aria-label="Password strength"
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={passwordStrength.score}
                    aria-valuetext={passwordStrength.label || "Too short"}
                  >
                    <div
                      className={`register-strength-fill register-strength-${passwordStrength.score}`}
                    />
                  </div>
                  <span className="register-strength-label">
                    {passwordStrength.label}
                  </span>
                </div>
                <ul
                  id="register-password-requirements"
                  className="register-password-requirements"
                >
                  {passwordStrength.results.map((req) => (
                    <li
                      key={req.id}
                      className={req.met ? "register-req-met" : ""}
                    >
                      {req.label}
                      <span className="register-visually-hidden">
                        {req.met ? " (met)" : " (not met)"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm password input */}
          <div className="register-form-group">
            <label htmlFor="confirmPassword" className="register-label">
              Confirm Password <span className="register-required">*</span>
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="register-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Sign in link — keeps the redirect so the user returns to where they were headed */}
          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{" "}
              <Link
                to={
                  redirectParam
                    ? `/login?redirect=${redirectParam}`
                    : "/login"
                }
                className="register-footer-link"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;