import { useState, useEffect } from "react";
import {
  AlertCircle,
  Briefcase,
  Check,
  MailCheck,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  sendEmailToUser,
  type User,
} from "../../api/admin";

// Types for confirmation modal state
interface ConfirmationModal {
  show: boolean;
  type: "role" | "status" | null;
  userId: number | null;
  currentValue: string | boolean | null;
  newValue: string | boolean | null;
  userName: string;
}

// Types for email modal state
interface EmailModal {
  show: boolean;
  userId: number | null;
  userName: string;
  userEmail: string;
}

const AdminDashboard = () => {
  // Get current logged-in user from auth context to prevent self-modification
  const { user: currentUser } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // User data
  const [users, setUsers] = useState<User[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmationModal>({
    show: false,
    type: null,
    userId: null,
    currentValue: null,
    newValue: null,
    userName: "",
  });
  const [emailModal, setEmailModal] = useState<EmailModal>({
    show: false,
    userId: null,
    userName: "",
    userEmail: "",
  });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetch all users once on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close whichever modal is open when Escape is pressed
  useEffect(() => {
    if (!confirmModal.show && !emailModal.show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmModal.show) handleCancelAction();
      if (emailModal.show) handleCloseEmailModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmModal.show, emailModal.show]);

  // Loads all users from API and stores them in state
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Returns CSS class for role badge based on user role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "admin-badge admin-badge--admin";
      case "manager":
        return "admin-badge admin-badge--manager";
      default:
        return "admin-badge admin-badge--customer";
    }
  };

  // Splits an ISO date string into a date line and a time line for the table
  const formatDateParts = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Renders a stacked date/time cell, or a muted "Never" when there is no value
  const renderDateCell = (dateString: string | null) => {
    const parts = formatDateParts(dateString);
    if (!parts) return <span className="admin-muted">Never</span>;
    return (
      <>
        <span className="admin-date-day">{parts.day}</span>
        <span className="admin-date-time">{parts.time}</span>
      </>
    );
  };

  // Capitalises a role name for display
  const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  // Derived filtered user list
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // ============================================================================
  // EVENT HANDLERS — CONFIRMATION MODAL
  // ============================================================================

  // Opens confirmation modal for role change with relevant user info
  const showRoleConfirmation = (
    userId: number,
    newRole: "customer" | "manager" | "admin",
    userName: string,
    currentRole: string,
  ) => {
    setConfirmModal({
      show: true,
      type: "role",
      userId,
      currentValue: currentRole,
      newValue: newRole,
      userName,
    });
  };

  // Opens confirmation modal for status toggle with relevant user info
  const showStatusConfirmation = (
    userId: number,
    userName: string,
    currentStatus: boolean,
  ) => {
    setConfirmModal({
      show: true,
      type: "status",
      userId,
      currentValue: currentStatus,
      newValue: !currentStatus,
      userName,
    });
  };

  // Handles confirmation of role change or status toggle
  const handleConfirmAction = async () => {
    if (!confirmModal.userId) return;

    try {
      if (confirmModal.type === "role") {
        const updatedUser = await updateUserRole(
          confirmModal.userId,
          confirmModal.newValue as any,
        );
        setUsers(
          users.map((u) =>
            u.userId === confirmModal.userId ? updatedUser : u,
          ),
        );
        setToast({ message: "Role updated successfully", type: "success" });
      } else if (confirmModal.type === "status") {
        const updatedUser = await toggleUserStatus(confirmModal.userId);
        setUsers(
          users.map((u) =>
            u.userId === confirmModal.userId ? updatedUser : u,
          ),
        );
        setToast({
          message: `User ${
            updatedUser.isActive ? "activated" : "deactivated"
          } successfully`,
          type: "success",
        });
      }
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Failed to perform action",
        type: "error",
      });
    } finally {
      setConfirmModal({
        show: false,
        type: null,
        userId: null,
        currentValue: null,
        newValue: null,
        userName: "",
      });
    }
  };

  // Closes confirmation modal without making any changes
  const handleCancelAction = () => {
    setConfirmModal({
      show: false,
      type: null,
      userId: null,
      currentValue: null,
      newValue: null,
      userName: "",
    });
  };

  // ============================================================================
  // EVENT HANDLERS — EMAIL MODAL
  // ============================================================================

  // Opens email modal with relevant user info and resets form fields
  const showEmailModal = (
    userId: number,
    userName: string,
    userEmail: string,
  ) => {
    setEmailModal({ show: true, userId, userName, userEmail });
    setEmailSubject("");
    setEmailMessage("");
  };

  // Closes email modal and resets form fields
  const handleCloseEmailModal = () => {
    setEmailModal({ show: false, userId: null, userName: "", userEmail: "" });
    setEmailSubject("");
    setEmailMessage("");
  };

  // Validates form and sends email to user via API, showing toast notifications for success/error
  const handleSendEmail = async () => {
    if (!emailModal.userId || !emailSubject.trim() || !emailMessage.trim()) {
      setToast({
        message: "Please fill in both subject and message",
        type: "error",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      await sendEmailToUser(emailModal.userId, emailSubject, emailMessage);
      setToast({ message: "Email sent successfully!", type: "success" });
      handleCloseEmailModal();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to send email",
        type: "error",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-state" role="status">
          <span className="admin-spinner" aria-hidden="true" />
          <p>Loading users…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-state admin-state--error" role="alert">
          <AlertCircle size={28} aria-hidden="true" />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchUsers} className="admin-btn admin-btn--primary">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total users", value: users.length, icon: Users },
    {
      label: "Active users",
      value: users.filter((u) => u.isActive).length,
      icon: UserCheck,
    },
    {
      label: "Admins",
      value: users.filter((u) => u.role === "admin").length,
      icon: ShieldCheck,
    },
    {
      label: "Managers",
      value: users.filter((u) => u.role === "manager").length,
      icon: Briefcase,
    },
    {
      label: "Verified emails",
      value: users.filter((u) => u.isEmailVerified).length,
      icon: MailCheck,
    },
  ];

  const hasActiveFilters =
    searchTerm !== "" || filterRole !== "all" || filterStatus !== "all";
  const isDeactivating =
    confirmModal.type === "status" && confirmModal.newValue === false;

  return (
    <div className="admin-dashboard">
      {/* Toast notification */}
      {toast && (
        <div
          className={`admin-toast admin-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="admin-toast-icon" aria-hidden="true">
            {toast.type === "success" ? <Check size={14} /> : <X size={14} />}
          </span>
          <p className="admin-toast-message">{toast.message}</p>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmModal.show && (
        <div className="admin-modal-overlay" onClick={handleCancelAction}>
          <div
            className="admin-modal admin-modal--sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-confirm-title" className="admin-modal-title">
              {confirmModal.type === "role"
                ? "Change role"
                : isDeactivating
                  ? "Deactivate account"
                  : "Activate account"}
            </h3>
            {confirmModal.type === "role" ? (
              <p className="admin-modal-text">
                Change <strong>{confirmModal.userName}</strong>&rsquo;s role
                from{" "}
                <span
                  className={getRoleBadgeClass(
                    confirmModal.currentValue as string,
                  )}
                >
                  {capitalize(confirmModal.currentValue as string)}
                </span>{" "}
                to{" "}
                <span
                  className={getRoleBadgeClass(confirmModal.newValue as string)}
                >
                  {capitalize(confirmModal.newValue as string)}
                </span>
                ?
              </p>
            ) : (
              <p className="admin-modal-text">
                Are you sure you want to{" "}
                <strong>{confirmModal.newValue ? "activate" : "deactivate"}</strong>{" "}
                <strong>{confirmModal.userName}</strong>&rsquo;s account?
                {isDeactivating && " They will no longer be able to sign in."}
              </p>
            )}
            <div className="admin-modal-actions">
              <button onClick={handleCancelAction} className="admin-btn">
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`admin-btn ${
                  isDeactivating ? "admin-btn--danger" : "admin-btn--primary"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email modal */}
      {emailModal.show && (
        <div className="admin-modal-overlay" onClick={handleCloseEmailModal}>
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-email-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-email-title" className="admin-modal-title">
              Send email
            </h3>
            <p className="admin-recipient">
              <span className="admin-recipient-label">To</span>
              <span className="admin-recipient-name">
                {emailModal.userName}
              </span>
              <span className="admin-recipient-email">
                {emailModal.userEmail}
              </span>
            </p>

            <div className="admin-field">
              <label className="admin-field-label" htmlFor="admin-email-subject">
                Subject
              </label>
              <input
                id="admin-email-subject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label className="admin-field-label" htmlFor="admin-email-message">
                Message
              </label>
              <textarea
                id="admin-email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Write your message"
                className="admin-input admin-textarea"
                rows={8}
              />
            </div>

            <div className="admin-modal-actions">
              <button onClick={handleCloseEmailModal} className="admin-btn">
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="admin-btn admin-btn--primary"
                disabled={isSendingEmail}
              >
                {isSendingEmail ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <header className="admin-header">
        <div className="admin-container">
          <p className="admin-eyebrow">Admin console</p>
          <h1 className="admin-title">User management</h1>
          <p className="admin-subtitle">
            Manage accounts, roles and access for your store.
          </p>
        </div>
      </header>

      <main className="admin-container admin-main">
        {/* Stats summary cards */}
        <section className="admin-stats" aria-label="User summary">
          {stats.map(({ label, value, icon: Icon }) => (
            <div className="admin-stat" key={label}>
              <span className="admin-stat-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <div>
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Table card: toolbar + table */}
        <section className="admin-card">
          {/* Search and filter controls */}
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search
                className="admin-search-icon"
                size={16}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search by name or email"
                aria-label="Search users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input admin-search-input"
              />
            </div>

            <div className="admin-filter">
              <label className="admin-field-label" htmlFor="admin-filter-role">
                Role
              </label>
              <select
                id="admin-filter-role"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="admin-input admin-select"
              >
                <option value="all">All roles</option>
                <option value="customer">Customer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="admin-filter">
              <label className="admin-field-label" htmlFor="admin-filter-status">
                Status
              </label>
              <select
                id="admin-filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-input admin-select"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setSearchTerm("");
                  setFilterRole("all");
                  setFilterStatus("all");
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="admin-result-count">
            Showing {filteredUsers.length} of {users.length}{" "}
            {users.length === 1 ? "user" : "users"}
          </div>

          {/* Users table */}
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Last login</th>
                  <th className="admin-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const fullName = `${user.firstName} ${user.lastName}`;
                  const isSelf = currentUser?.userId === user.userId;

                  return (
                    <tr
                      key={user.userId}
                      className={!user.isActive ? "admin-row--inactive" : ""}
                    >
                      {/* Avatar (initials) + full name */}
                      <td>
                        <div className="admin-user">
                          <div className="admin-avatar" aria-hidden="true">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </div>
                          <span className="admin-user-name">{fullName}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-email-link"
                          onClick={() =>
                            showEmailModal(user.userId, fullName, user.email)
                          }
                          title="Send email"
                        >
                          {user.email}
                        </button>
                      </td>
                      <td className="admin-cell-muted">
                        {user.phone || <span className="admin-muted">—</span>}
                      </td>

                      {/* Role badge */}
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>
                          {capitalize(user.role)}
                        </span>
                      </td>

                      {/* Active/Inactive status */}
                      <td>
                        <span
                          className={`admin-status ${
                            user.isActive
                              ? "admin-status--active"
                              : "admin-status--inactive"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Email verification status */}
                      <td>
                        <span
                          className={`admin-verified ${
                            user.isEmailVerified
                              ? "admin-verified--yes"
                              : "admin-verified--no"
                          }`}
                        >
                          {user.isEmailVerified ? (
                            <Check size={14} aria-hidden="true" />
                          ) : (
                            <X size={14} aria-hidden="true" />
                          )}
                          {user.isEmailVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="admin-date-cell">
                        {renderDateCell(user.createdAt)}
                      </td>
                      <td className="admin-date-cell">
                        {renderDateCell(user.lastLogin)}
                      </td>

                      {/* Actions — replaced by a "You" tag for the current admin */}
                      <td>
                        <div className="admin-actions">
                          {isSelf ? (
                            <span className="admin-you">You</span>
                          ) : (
                            <>
                              {/* Role select — opens confirmation modal on change */}
                              <select
                                value={user.role}
                                aria-label={`Change role for ${fullName}`}
                                onChange={(e) =>
                                  showRoleConfirmation(
                                    user.userId,
                                    e.target.value as any,
                                    fullName,
                                    user.role,
                                  )
                                }
                                className="admin-input admin-select admin-select--sm"
                              >
                                <option value="customer">Customer</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>

                              {/* Activate / Deactivate toggle button */}
                              <button
                                onClick={() =>
                                  showStatusConfirmation(
                                    user.userId,
                                    fullName,
                                    user.isActive,
                                  )
                                }
                                className={`admin-btn admin-btn--sm ${
                                  user.isActive
                                    ? "admin-btn--outline-danger"
                                    : "admin-btn--primary"
                                }`}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {filteredUsers.length === 0 && (
              <div className="admin-empty">
                <Search size={22} aria-hidden="true" />
                <p className="admin-empty-title">No users found</p>
                <p className="admin-empty-text">
                  Try adjusting your search or filters.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;