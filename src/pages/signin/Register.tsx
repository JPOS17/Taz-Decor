import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import PasswordInput from "../../components/universalComponents/PasswordInput";

import "../../styles/pages/signin/Register.css";

// ============================================================================
// COMPONENT
// ============================================================================

const Register = () => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================

  const { register } = useAuth();
  const { syncToDatabase, loadFromDatabase } = useCart();
  const navigate = useNavigate();

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

  const checkPasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score++;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push("One uppercase letter");
    }

    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push("One lowercase letter");
    }

    if (/[0-9]/.test(password)) {
      score++;
    } else {
      feedback.push("One number");
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score++;
    } else {
      feedback.push("One special character");
    }

    return { score, feedback };
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Check password strength as user types
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;

      // Register returns user data
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

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name" className="form-label">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="form-input"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name" className="form-label">
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required">*</span>
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              required
            />
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className={`strength-fill strength-${passwordStrength.score}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="password-requirements">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password <span className="required">*</span>
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

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="auth-footer">
            <p className="auth-link-text">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
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
