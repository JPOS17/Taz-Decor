import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  sendEmailToUser,
  type User,
} from "../../api/admin";

import "../../styles/pages/adminInterface/AdminDashboard.css";

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
        return "role-badge role-admin";
      case "manager":
        return "role-badge role-manager";
      default:
        return "role-badge role-customer";
    }
  };

  // Formats ISO date string into a more readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        <div className="loading-spinner">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchUsers} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Toast notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span className={`toast-icon ${toast.type}`}>
            {toast.type === "success" ? "✓" : "✕"}
          </span>
          <div className="toast-content">
            <p className="toast-message">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmModal.show && (
        <div
          className="confirmation-modal-overlay"
          onClick={handleCancelAction}
        >
          <div
            className="confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              Confirm{" "}
              {confirmModal.type === "role" ? "Role Change" : "Status Change"}
            </h3>
            {confirmModal.type === "role" ? (
              <p>
                Are you sure you want to change{" "}
                <strong>{confirmModal.userName}'s</strong> role from{" "}
                <strong
                  className={getRoleBadgeClass(
                    confirmModal.currentValue as string,
                  )}
                >
                  {(confirmModal.currentValue as string).toUpperCase()}
                </strong>{" "}
                to{" "}
                <strong
                  className={getRoleBadgeClass(confirmModal.newValue as string)}
                >
                  {(confirmModal.newValue as string).toUpperCase()}
                </strong>
                ?
              </p>
            ) : (
              <p>
                Are you sure you want to{" "}
                <strong>
                  {confirmModal.newValue ? "activate" : "deactivate"}
                </strong>{" "}
                <strong>{confirmModal.userName}'s</strong> account?
              </p>
            )}
            <div className="confirmation-modal-buttons">
              <button onClick={handleCancelAction} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleConfirmAction} className="btn-confirm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email modal */}
      {emailModal.show && (
        <div
          className="confirmation-modal-overlay"
          onClick={handleCloseEmailModal}
        >
          <div className="email-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Email to {emailModal.userName}</h3>
            <p className="email-recipient">To: {emailModal.userEmail}</p>

            <div className="email-form">
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="email-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Enter your message..."
                  className="email-textarea"
                  rows={8}
                />
              </div>
            </div>

            <div className="confirmation-modal-buttons">
              <button onClick={handleCloseEmailModal} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="btn-confirm"
                disabled={isSendingEmail}
              >
                {isSendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="dashboard-header">
        <div className="container">
          <h1 className="dashboard-title">Admin Dashboard - User Management</h1>
        </div>
      </div>

      <div className="container">
        {/* Search and filter controls */}
        <div className="controls-section">
          {/* Free-text search — matches name or email */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Role filter dropdown */}
          <div className="filter-box">
            <label className="filter-label">Filter by Role:</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status filter dropdown */}
          <div className="filter-box">
            <label className="filter-label">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Stats summary cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {users.filter((u) => u.isActive).length}
            </div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {users.filter((u) => u.role === "manager").length}
            </div>
            <div className="stat-label">Managers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {users.filter((u) => u.isEmailVerified).length}
            </div>
            <div className="stat-label">Verified Emails</div>
          </div>
        </div>

        {/* Users table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email Verified</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.userId}
                  className={!user.isActive ? "inactive-row" : ""}
                >
                  {/* Avatar (initials) + full name */}
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </div>
                      <div className="user-name">
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="email-link"
                      onClick={() =>
                        showEmailModal(
                          user.userId,
                          `${user.firstName} ${user.lastName}`,
                          user.email,
                        )
                      }
                      title="Click to send email"
                    >
                      {user.email}
                    </span>
                  </td>
                  <td>{user.phone || "N/A"}</td>

                  {/* Role badge */}
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>

                  {/* Active/Inactive status badge */}
                  <td>
                    <span
                      className={`status-badge ${
                        user.isActive ? "active" : "inactive"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Email verification status */}
                  <td>
                    <span
                      className={`verification-badge ${
                        user.isEmailVerified ? "verified" : "unverified"
                      }`}
                    >
                      {user.isEmailVerified ? "✓ Verified" : "✕ Unverified"}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(user.createdAt)}</td>
                  <td className="date-cell">{formatDate(user.lastLogin)}</td>

                  {/* Action column — hidden for the currently logged-in admin */}
                  <td>
                    <div className="action-buttons">
                      {currentUser?.userId !== user.userId && (
                        <>
                          {/* Role select — opens confirmation modal on change */}
                          <select
                            value={user.role}
                            onChange={(e) =>
                              showRoleConfirmation(
                                user.userId,
                                e.target.value as any,
                                `${user.firstName} ${user.lastName}`,
                                user.role,
                              )
                            }
                            className="role-select"
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
                                `${user.firstName} ${user.lastName}`,
                                user.isActive,
                              )
                            }
                            className={`btn-toggle ${
                              user.isActive ? "btn-deactivate" : "btn-activate"
                            }`}
                            title={
                              user.isActive
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </>
                      )}
                      {currentUser?.userId === user.userId && (
                        <span className="current-user-label">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {filteredUsers.length === 0 && (
            <div className="empty-state">
              <p className="empty-state-text">
                No users found matching your filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
