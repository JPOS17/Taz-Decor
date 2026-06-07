import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
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
  const { resetSession } = useCart();

  // Controls the mobile dropdown nav open/closed state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  // DERIVED VALUES
  // ============================================================================

  // Maps role to its corresponding badge CSS class
  const roleBadgeClass =
    {
      customer: "psb-role-customer",
      manager: "psb-role-manager",
      admin: "psb-role-admin",
    }[role] ?? "psb-role-customer";

  // Dropdown trigger label and icon path reflect whichever page is currently active
  const activeLabel = isActive("/orders") ? "Orders" : "Profile";
  const activeIconPath = isActive("/orders")
    ? "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
    : "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";

  // Shared logout SVG icon used across all three sign-out buttons
  const logoutSvg = (
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
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Closes the dropdown when the user clicks anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <aside className="psb-sidebar">
        {/* Desktop: stacked column */}
        <div className="psb-avatar-section">
          {/* Avatar — initials derived from first and last name */}
          <div className="psb-avatar-large">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </div>

          {/* User info */}
          <div className="psb-user-info">
            <h2 className="psb-user-name">
              {firstName} {lastName}
            </h2>

            <div className="psb-role-and-nav">
              {/* <span className={`psb-role-badge ${roleBadgeClass}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span> */}

              {/* Flat nav pills */}
              <nav className="psb-nav">
                <button
                  className={`psb-nav-item${isActive("/profile") ? " psb-nav-item--active" : ""}`}
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
                  Profile
                </button>

                <button
                  className={`psb-nav-item${isActive("/orders") ? " psb-nav-item--active" : ""}`}
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
                  Orders
                </button>

                {/* Manager Dashboard — only rendered for manager and admin roles */}
                {(role === "manager" || role === "admin") && (
                  <button
                    className={`psb-nav-item${isActive("/manager") ? " psb-nav-item--active" : ""}`}
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

              {/* Dropdown nav */}
              <div
                ref={dropdownRef}
                className={`psb-nav-dropdown${dropdownOpen ? " psb-nav-dropdown--open" : ""}`}
              >
                <button
                  className="psb-nav-dropdown-trigger"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
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
                      d={activeIconPath}
                    />
                  </svg>
                  {activeLabel}
                  <svg
                    className="psb-nav-dropdown-chevron"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu items */}
                <div className="psb-nav-dropdown-menu" role="menu">
                  <button
                    className={`psb-nav-dropdown-item${isActive("/profile") ? " psb-nav-dropdown-item--active" : ""}`}
                    onClick={() => {
                      navigate("/profile");
                      setDropdownOpen(false);
                    }}
                    role="menuitem"
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
                    Profile
                  </button>

                  <button
                    className={`psb-nav-dropdown-item${isActive("/orders") ? " psb-nav-dropdown-item--active" : ""}`}
                    onClick={() => {
                      navigate("/orders");
                      setDropdownOpen(false);
                    }}
                    role="menuitem"
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
                    Orders
                  </button>

                  {/* {(role === "manager" || role === "admin") && (
                    <button
                      className={`psb-nav-dropdown-item${isActive("/manager") ? " psb-nav-dropdown-item--active" : ""}`}
                      onClick={() => { navigate("/manager"); setDropdownOpen(false); }}
                      role="menuitem"
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
                  )} */}

                  {/* Sign Out */}
                  <button
                    className="psb-nav-dropdown-logout"
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    role="menuitem"
                  >
                    {logoutSvg}
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only Sign Out */}
          <button onClick={handleLogout} className="psb-logout-inline">
            {logoutSvg}
            <span>Sign Out</span>
          </button>
        </div>

        {/* Desktop-only Sign Out */}
        <button onClick={handleLogout} className="psb-logout-button">
          {logoutSvg}
          Sign Out
        </button>
      </aside>
    </>
  );
};

export default ProfileSidebar;
