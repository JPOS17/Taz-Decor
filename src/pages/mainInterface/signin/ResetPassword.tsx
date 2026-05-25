import { useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../../../api/auth";

import PasswordInput from "../../../components/universalComponents/PasswordInput";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/signin/ResetPassword.css";

const ResetPassword = () => {
  // ============================================================================
  // HOOKS & ROUTING
  // ============================================================================

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

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

    if (password.length >= 8) score++;
    else feedback.push("At least 8 characters");
    if (/[A-Z]/.test(password)) score++;
    else feedback.push("One uppercase letter");
    if (/[a-z]/.test(password)) score++;
    else feedback.push("One lowercase letter");
    if (/[0-9]/.test(password)) score++;
    else feedback.push("One number");
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    else feedback.push("One special character");

    return { score, feedback };
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "newPassword") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength.feedback.length > 0) {
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
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
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
        <div className="reset-card">
          <div className="reset-success-icon">✓</div>
          <h1 className="reset-title">Password Reset Successful!</h1>
          <p className="reset-subtitle">
            Your password has been successfully reset. You can now log in with
            your new password.
          </p>
          <p className="reset-redirect">Redirecting to login...</p>
          <Link to="/login" className="reset-action-btn">
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  const strengthClass = `reset-strength-${passwordStrength.score}`;

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <h1 className="reset-title">Reset Your Password</h1>
          <p className="reset-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          {error && <div className="reset-error-message">{error}</div>}

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
              required
            />
            {formData.newPassword && (
              <div className="reset-password-strength">
                <div className="reset-strength-bar">
                  <div className={`reset-strength-fill ${strengthClass}`} />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="reset-password-requirements">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

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
