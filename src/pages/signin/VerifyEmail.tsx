import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { verifyEmail } from "../../api/auth";

import "../../styles/pages/signin/VerifyEmail.css";
import LoadingSpinner from "../../components/universalComponents/LoadingSpinner";

// ============================================================================
// COMPONENT
// ============================================================================

const VerifyEmail = () => {
  // ============================================================================
  // HOOKS & ROUTING
  // ============================================================================

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
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

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      // Prevent double calls in StrictMode
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;

      try {
        console.log("Starting verification for token:", token);

        const data = await verifyEmail(token);

        console.log("Verification successful:", data);

        setStatus("success");
        setMessage(data.message);

        // Wait 2 seconds before redirecting so user sees success
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } catch (error: any) {
        console.error("Verification error:", error);
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
  // RENDER - LOADING STATE
  // ============================================================================

  if (status === "loading") {
    return (
      <div className="verify-container verify-loading-state">
        <LoadingSpinner message="Verifying your email..." />
      </div>
    );
  }

  // ============================================================================
  // RENDER - SUCCESS STATE
  // ============================================================================

  if (status === "success") {
    return (
      <div className="verify-container">
        <div className="verify-card">
          <div className="success-icon">✓</div>
          <h2 className="verify-title">Email Verified!</h2>
          <p className="verify-message">{message}</p>
          <p className="verify-redirect">Redirecting to your profile...</p>
          <Link to="/profile" className="verify-button">
            Go to Profile Now
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR STATE
  // ============================================================================

  return (
    <div className="verify-container">
      <div className="verify-card">
        <div className="error-icon">✕</div>
        <h2 className="verify-title">Verification Failed</h2>
        <p className="verify-message">{message}</p>
        <p className="verify-help">
          This could happen if the link has expired or was already used.
        </p>
        <div className="verify-actions">
          <Link to="/profile" className="verify-button">
            Go to Profile
          </Link>
          <Link to="/login" className="verify-button-secondary">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
