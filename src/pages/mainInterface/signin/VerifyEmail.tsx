import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { verifyEmail } from "../../../api/auth";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/signin/VerifyEmail.css";

const VerifyEmail = () => {
  // ============================================================================
  // HOOKS & ROUTING
  // ============================================================================

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  // Ref prevents the verification API call from firing twice in React Strict Mode
  const hasVerified = useRef(false);

  // ============================================================================
  // STATE
  // ============================================================================

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fires the verification request once on mount; redirects to profile on success
  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      if (hasVerified.current) return;
      hasVerified.current = true;

      try {
        const data = await verifyEmail(token);
        setStatus("success");
        setMessage(data.message);

        // Wait 2 seconds before redirecting so user sees success
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.message ||
            "An error occurred during verification. Please try again.",
        );
      }
    };

    performVerification();
  }, [token, navigate]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (status === "loading") {
    return (
      <div className="verify-container verify-loading-state">
        <LoadingSpinner message="Verifying your email..." />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="verify-container">
        <div className="verify-card">
          {/* Success icon */}
          <div className="verify-success-icon">✓</div>
          <h2 className="verify-title">Email Verified!</h2>
          <p className="verify-message">{message}</p>
          <p className="verify-redirect">Redirecting to your profile...</p>
          {/* Manual redirect link in case auto-redirect is slow */}
          <Link to="/profile" className="verify-btn-primary">
            Go to Profile Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-container">
      <div className="verify-card">
        {/* Error icon */}
        <div className="verify-error-icon">✕</div>
        <h2 className="verify-title">Verification Failed</h2>
        <p className="verify-message">{message}</p>
        <p className="verify-help">
          This could happen if the link has expired or was already used.
        </p>
        {/* Recovery actions — go to profile or back to login */}
        <div className="verify-actions">
          <Link to="/profile" className="verify-btn-primary">
            Go to Profile
          </Link>
          <Link to="/login" className="verify-btn-secondary">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
