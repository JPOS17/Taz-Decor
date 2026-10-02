import { NavLink, useNavigate } from "react-router-dom";
import { User, ShoppingBag, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

interface ProfileSidebarProps {
  firstName: string;
  lastName: string;
  role: string;
}

// Returns the className for a nav link, adding the active modifier on the current route
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `profile-sidebar-nav-item${isActive ? " profile-sidebar-nav-item--active" : ""}`;

const ProfileSidebar = ({ firstName, lastName, role }: ProfileSidebarProps) => {
  const navigate = useNavigate();
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

  // ============================================================================
  // RENDER
  // ============================================================================

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const isStaff = role === "manager" || role === "admin";

  return (
    <aside className="profile-sidebar">
      {/* Avatar and name */}
      <div className="profile-sidebar-avatar-section">
        <div className="profile-sidebar-avatar-large" aria-hidden="true">
          {initials}
        </div>
        <h2 className="profile-sidebar-user-name">
          {firstName} {lastName}
        </h2>
      </div>

      {/* Account navigation — icon-only below 520px; the title attribute and
          aria-label keep every link identifiable */}
      <nav className="profile-sidebar-nav" aria-label="Account">
        <NavLink
          to="/profile"
          end
          className={navLinkClass}
          title="Profile"
          aria-label="Profile"
        >
          <User className="profile-sidebar-nav-icon" aria-hidden="true" />
          <span className="profile-sidebar-nav-label">Profile</span>
        </NavLink>

        <NavLink
          to="/orders"
          end
          className={navLinkClass}
          title="Orders"
          aria-label="Orders"
        >
          <ShoppingBag className="profile-sidebar-nav-icon" aria-hidden="true" />
          <span className="profile-sidebar-nav-label">Orders</span>
        </NavLink>

        {/* Manager Dashboard — manager and admin only */}
        {isStaff && (
          <NavLink
            to="/manager"
            end
            className={navLinkClass}
            title="Manager Dashboard"
            aria-label="Manager Dashboard"
          >
            <LayoutDashboard
              className="profile-sidebar-nav-icon"
              aria-hidden="true"
            />
            <span className="profile-sidebar-nav-label">Manager Dashboard</span>
          </NavLink>
        )}
      </nav>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleLogout}
        className="profile-sidebar-logout-button"
        title="Sign Out"
        aria-label="Sign Out"
      >
        <LogOut className="profile-sidebar-logout-icon" aria-hidden="true" />
        <span className="profile-sidebar-logout-label">Sign Out</span>
      </button>
    </aside>
  );
};

export default ProfileSidebar;