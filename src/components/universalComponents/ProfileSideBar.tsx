import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../api/user";
import ConfirmModal from "../../components/universalComponents/ConfirmModal";
import PasswordInput from "../../components/universalComponents/PasswordInput";
import "../../styles/components/universal/ProfileSideBar.css";

interface ProfileSidebarProps {
  firstName: string;
  lastName: string;
  role: string;
}

const ProfileSidebar = ({ firstName, lastName, role }: ProfileSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // ============================================================================
  // STATE - DELETE ACCOUNT (two-step)
  // ============================================================================

  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] =
    useState(false);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null,
  );
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const handleDeleteAccountConfirmed = () => {
    setShowDeleteAccountConfirm(false);
    setDeletePassword("");
    setDeleteAccountError(null);
    setShowDeletePasswordModal(true);
  };

  const handleCloseDeletePasswordModal = () => {
    setShowDeletePasswordModal(false);
    setDeletePassword("");
    setDeleteAccountError(null);
  };

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteAccountError("Please enter your password.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError(null);

    try {
      await deleteAccount(deletePassword);
      logout();
      navigate("/login");
    } catch (err: any) {
      setDeleteAccountError(
        err.message || "Failed to delete account. Please try again.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <aside className="psb-sidebar">
        <div className="psb-avatar-section">
          <div className="psb-avatar-large">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </div>
          <h2 className="psb-user-name">
            {firstName} {lastName}
          </h2>
          <span className={`psb-role-badge psb-role-${role}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </div>

        <nav className="psb-nav">
          <button
            className={`psb-nav-item ${isActive("/profile") ? "active" : ""}`}
            onClick={() => navigate("/profile")}
          >
            <svg
              className="psb-nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile Information
          </button>

          <button
            className={`psb-nav-item ${isActive("/orders") ? "active" : ""}`}
            onClick={() => navigate("/orders")}
          >
            <svg
              className="psb-nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            My Orders
          </button>

          {(role === "manager" || role === "admin") && (
            <button
              className={`psb-nav-item ${isActive("/manager") ? "active" : ""}`}
              onClick={() => navigate("/manager")}
            >
              <svg
                className="psb-nav-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Manager Dashboard
            </button>
          )}
        </nav>

        <button onClick={handleLogout} className="psb-logout-button">
          <svg
            className="psb-logout-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>

        <button
          onClick={() => setShowDeleteAccountConfirm(true)}
          className="psb-delete-account-link"
        >
          Delete Account
        </button>
      </aside>

      {/* Step 1 - Delete Account: "Are you sure?" */}
      <ConfirmModal
        isOpen={showDeleteAccountConfirm}
        title="Delete Your Account?"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Yes, Continue"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteAccountConfirmed}
        onCancel={() => setShowDeleteAccountConfirm(false)}
      />

      {/* Step 2 - Delete Account: Password confirmation */}
      {showDeletePasswordModal && (
        <div className="dap-overlay" onClick={handleCloseDeletePasswordModal}>
          <div className="dap-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="dap-title">Confirm Your Password</h2>
            <p className="dap-subtitle">
              Enter your password to permanently delete your account.
            </p>

            <form onSubmit={handleConfirmDeleteAccount}>
              {deleteAccountError && (
                <p className="dap-error">{deleteAccountError}</p>
              )}

              <div className="dap-field">
                <label className="dap-label">Password</label>
                <PasswordInput
                  id="delete-account-password"
                  name="delete-account-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="dap-input"
                  required
                />
              </div>

              <div className="dap-actions">
                <button
                  type="button"
                  className="dap-btn-cancel"
                  onClick={handleCloseDeletePasswordModal}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dap-btn-confirm"
                  disabled={isDeletingAccount || !deletePassword}
                >
                  {isDeletingAccount ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSidebar;
