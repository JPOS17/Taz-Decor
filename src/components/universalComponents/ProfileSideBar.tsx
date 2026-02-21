import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/universal/ProfileSideBar.css";

interface ProfileSidebarProps {
  firstName: string;
  lastName: string;
  role: string;
  onDeleteAccount: () => void;
}

const ProfileSidebar = ({
  firstName,
  lastName,
  role,
  onDeleteAccount,
}: ProfileSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
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

      <button onClick={onDeleteAccount} className="psb-delete-account-link">
        Delete Account
      </button>
    </aside>
  );
};

export default ProfileSidebar;
