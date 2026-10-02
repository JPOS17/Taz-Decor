import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaCheck, FaTimes } from "react-icons/fa";
import { verifyEmail, resendVerificationEmail } from "../../api/auth";

import LoadingSpinner from "../../components/shared/LoadingSpinner";

const VerifyEmail = () => {
  // ============================================================================
  // HOOKS & ROUTING
  // ============================================================================

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  // Ref prevents the verification API call from firing twice in React Strict Mode
  const hasVerified = useRef(false);
  // Holds the post-success redirect timer so it can be cancelled on unmount
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ============================================================================
  // STATE
  // ============================================================================

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

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
        redirectTimer.current = setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error && error.message
            ? error.message
            : "An error occurred during verification. Please try again.",
        );
      }
    };

    performVerification();
  }, [token, navigate]);

  // Cancels the pending redirect if the user leaves the page first
  useEffect(() => {
    return () => clearTimeout(redirectTimer.current);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Resends the verification email; redirects to login if the user is not authenticated
  const handleResend = async () => {
    if (resendStatus !== "idle") return;
    setResendStatus("sending");
    try {
      await resendVerificationEmail();
      setResendStatus("sent");
    } catch {
      // Token missing or expired — user needs to log in first
      navigate("/login", {
        state: { message: "Please sign in to resend your verification email." },
      });
    }
  };

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
          <div className="verify-success-icon" aria-hidden="true">
            <FaCheck />
          </div>
          <h1 className="verify-title">Email Verified!</h1>
          <p className="verify-message">{message}</p>
          <p className="verify-redirect" role="status">
            Redirecting to your profile...
          </p>
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
        <div className="verify-error-icon" aria-hidden="true">
          <FaTimes />
        </div>
        <h1 className="verify-title">Verification Failed</h1>
        <p className="verify-message" role="alert">
          {message}
        </p>
        <p className="verify-help">
          This could happen if the link has expired or was already used.
        </p>
        {/* Recovery actions */}
        <div className="verify-actions">
          <Link to="/profile" className="verify-btn-primary">
            Go to Profile
          </Link>
          <button
            type="button"
            className="verify-btn-secondary"
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
    </div>
  );
};

export default VerifyEmail;