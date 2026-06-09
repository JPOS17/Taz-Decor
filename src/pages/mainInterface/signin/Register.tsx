import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

import PasswordInput from "../../../components/universalComponents/PasswordInput";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/signin/Register.css";

const Register = () => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================

  const { register } = useAuth();
  const { syncToDatabase, loadFromDatabase } = useCart();
  const navigate = useNavigate();
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
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Scores the password from 0–5 and returns unmet requirement feedback
  const checkPasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push("At least 8 characters");
    if (/[A-Z]/.test(password)) score++;
    else feedback.push("One uppercase letter");
    if (/[a-z]/.test(password)) score++;
    else feedback.push("One lowercase letter");
    if (/[0-9]/.test(password)) score++;
    else feedback.push("One number");
    if (/[!@#$%^&*()_+\--=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    else feedback.push("One special character");
    return { score, feedback };
  };

  // Returns an error string if the password fails any requirement, or null if it passes
  const validatePassword = (password: string): string | null => {
    if (password.length < 8)
      return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number";
    if (!/[!@#$%^&*()_+\--=\[\]{};':"\\|,.<>\/?]/.test(password))
      return "Password must contain at least one special character";
    return null;
  };

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

  // Updates form fields and re-evaluates password strength when the password field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "phone") {
      // Allow only digits, +, (, ), -, and spaces
      const sanitized = value.replace(/[^\d+\-()\s]/g, "");
      setFormData({ ...formData, phone: sanitized });
      return;
    }

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // Validates the form, registers the user, syncs the guest cart, then redirects to profile
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); // clears first

    const passwordError = validatePassword(formData.password);
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
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Strength class drives the CSS fill width and color of the strength bar
  const strengthClass = `register-strength-${passwordStrength.score}`;

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Page header */}
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Inline error message */}
          {error && (
            <div ref={errorRef} className="register-error-message">
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
              required
            />
          </div>

          {/* Phone input */}
          <div className="register-form-group">
            <label htmlFor="phone" className="register-label">
              Phone (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="register-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
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
              required
            />
            {/* Strength bar and unmet requirements */}
            {formData.password && (
              <div className="register-password-strength">
                <div className="register-strength-bar">
                  <div className={`register-strength-fill ${strengthClass}`} />
                </div>
                <ul className="register-password-requirements">
                  <li
                    className={
                      formData.password.length >= 8 ? "register-req-met" : ""
                    }
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(formData.password) ? "register-req-met" : ""
                    }
                  >
                    One uppercase letter
                  </li>
                  <li
                    className={
                      /[a-z]/.test(formData.password) ? "register-req-met" : ""
                    }
                  >
                    One lowercase letter
                  </li>
                  <li
                    className={
                      /[0-9]/.test(formData.password) ? "register-req-met" : ""
                    }
                  >
                    One number
                  </li>
                  <li
                    className={
                      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                        formData.password,
                      )
                        ? "register-req-met"
                        : ""
                    }
                  >
                    One special character
                  </li>
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

          {/* Sign in link */}
          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{" "}
              <Link to="/login" className="register-footer-link">
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
