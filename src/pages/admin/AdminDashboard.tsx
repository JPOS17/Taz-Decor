import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  sendEmailToUser,
  type User,
} from "../../api/admin";
import "../../styles/pages/admin/AdminDashboard.css";

interface ConfirmationModal {
  show: boolean;
  type: "role" | "status" | null;
  userId: number | null;
  currentValue: string | boolean | null;
  newValue: string | boolean | null;
  userName: string;
}

interface EmailModal {
  show: boolean;
  userId: number | null;
  userName: string;
  userEmail: string;
}

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  const showEmailModal = (
    userId: number,
    userName: string,
    userEmail: string,
  ) => {
    setEmailModal({
      show: true,
      userId,
      userName,
      userEmail,
    });
    setEmailSubject("");
    setEmailMessage("");
  };

  const handleCloseEmailModal = () => {
    setEmailModal({
      show: false,
      userId: null,
      userName: "",
      userEmail: "",
    });
    setEmailSubject("");
    setEmailMessage("");
  };

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

      <div className="dashboard-header">
        <div className="container">
          <h1 className="dashboard-title">Admin Dashboard - User Management</h1>
        </div>
      </div>

      <div className="container">
        <div className="controls-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

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
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.isActive ? "active" : "inactive"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
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
                  <td>
                    <div className="action-buttons">
                      {currentUser?.userId !== user.userId && (
                        <>
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
