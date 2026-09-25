import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

interface ProfileSidebarProps {
  firstName: string;
  lastName: string;
  role: string;
}

const ProfileSidebar = ({ firstName, lastName, role }: ProfileSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { resetSession } = useCart();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Clears cart session, logs the user out, and redirects to login
  const handleLogout = () => {
    resetSession();
    logout();
    navigate("/login");
  };

  // Returns true when the current route matches the given path
  const isActive = (path: string) => location.pathname === path;

  // ============================================================================
  // RENDER
  // ============================================================================

  const logoutSvg = (
    <svg
      className="profile-sidebar-logout-icon"
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
  );

  return (
    <aside className="profile-sidebar">
      <div className="profile-sidebar-avatar-section">
        {/* Avatar initials */}
        <div className="profile-sidebar-avatar-large">
          {firstName.charAt(0)}
          {lastName.charAt(0)}
        </div>

        <div className="profile-sidebar-user-info">
          <h2 className="profile-sidebar-user-name">
            {firstName} {lastName}
          </h2>

          <div className="profile-sidebar-role-and-nav">
            <nav className="profile-sidebar-nav">
              {/* Profile */}
              <div className="profile-sidebar-nav-tooltip-wrap">
                <button
                  className={`profile-sidebar-nav-item${isActive("/profile") ? " profile-sidebar-nav-item--active" : ""}`}
                  onClick={() => navigate("/profile")}
                >
                  <svg
                    className="profile-sidebar-nav-icon"
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
                  <span className="profile-sidebar-nav-label">Profile</span>
                </button>
                <span className="profile-sidebar-tooltip">Profile</span>
              </div>

              {/* Orders */}
              <div className="profile-sidebar-nav-tooltip-wrap">
                <button
                  className={`profile-sidebar-nav-item${isActive("/orders") ? " profile-sidebar-nav-item--active" : ""}`}
                  onClick={() => navigate("/orders")}
                >
                  <svg
                    className="profile-sidebar-nav-icon"
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
                  <span className="profile-sidebar-nav-label">Orders</span>
                </button>
                <span className="profile-sidebar-tooltip">Orders</span>
              </div>

              {/* Manager Dashboard — manager and admin only */}
              {(role === "manager" || role === "admin") && (
                <div className="profile-sidebar-nav-tooltip-wrap">
                  <button
                    className={`profile-sidebar-nav-item${isActive("/manager") ? " profile-sidebar-nav-item--active" : ""}`}
                    onClick={() => navigate("/manager")}
                  >
                    <svg
                      className="profile-sidebar-nav-icon"
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
                    <span className="profile-sidebar-nav-label">Manager Dashboard</span>
                  </button>
                  <span className="profile-sidebar-tooltip">Manager Dashboard</span>
                </div>
              )}
            </nav>

            {/* Sign out — icon only at collapsed widths */}
            <div className="profile-sidebar-nav-tooltip-wrap">
              <button onClick={handleLogout} className="profile-sidebar-logout-inline">
                {logoutSvg}
                <span>Sign Out</span>
              </button>
              <span className="profile-sidebar-tooltip">Sign Out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sign out */}
      <button onClick={handleLogout} className="profile-sidebar-logout-button">
        {logoutSvg}
        Sign Out
      </button>
    </aside>
  );
};

export default ProfileSidebar;
