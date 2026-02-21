import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserAddresses,
  createAddress,
  updateAddress as updateAddressAPI,
  deleteAddress,
  type CreateAddressPayload,
  type Address,
  type UserProfile,
  type DefaultAddress,
} from "../../api/user";
import { resendVerificationEmail } from "../../api/auth";
import {
  validateAddress as validateAddressAPI,
  type AddressValidationResult,
} from "../../api/checkout";
import AddressForm from "../../components/universalComponents/AddressForm";
import AddressValidationModal from "../../components/universalComponents/AddressValidationModal";
import ProfileSidebar from "../../components/universalComponents/ProfileSideBar";
import ConfirmModal from "../../components/universalComponents/ConfirmModal";

import "../../styles/pages/main/Profile.css";

interface EditingProfile {
  first_name: string;
  last_name: string;
  phone: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const Profile = () => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================

  const { user: authUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // ============================================================================
  // STATE - PROFILE
  // ============================================================================

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<EditingProfile>({
    first_name: "",
    last_name: "",
    phone: "",
  });

  // ============================================================================
  // STATE - ADDRESS
  // ============================================================================

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<CreateAddressPayload>({
    address_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    is_default: false,
  });

  // ============================================================================
  // STATE - VALIDATION
  // ============================================================================

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);
  const [pendingAddressData, setPendingAddressData] =
    useState<CreateAddressPayload | null>(null);

  // ============================================================================
  // STATE - UI
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Delete address confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadProfileData();
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile();
      setProfileData(data.user);

      const addresses = await fetchUserAddresses();
      setAllAddresses(addresses);

      setEditingProfile({
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        phone: data.user.phone || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // PROFILE HANDLERS
  // ============================================================================

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      const result = await updateUserProfile(editingProfile);
      setProfileData(result.user);
      setSuccess("Profile updated successfully!");
      setIsEditingProfile(false);
      refreshUser();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // ADDRESS HANDLERS
  // ============================================================================

  const handleAddressFormChange = (
    field: keyof CreateAddressPayload,
    value: string | boolean,
  ) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (
        !addressForm.country ||
        addressForm.country === "US" ||
        addressForm.country === "USA"
      ) {
        const validation = await validateAddressAPI(addressForm);
        setPendingAddressData(addressForm);
        setValidationResult(validation);
        setShowValidationModal(true);
        setSaving(false);
      } else {
        await saveAddress(addressForm);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to validate address",
      );
      setSaving(false);
    }
  };

  const saveAddress = async (addressData: CreateAddressPayload) => {
    setSaving(true);
    try {
      if (editingAddressId) {
        await updateAddressAPI(editingAddressId, addressData);
        setSuccess("Address updated successfully!");
      } else {
        await createAddress(addressData);
        setSuccess("Address added successfully!");
      }

      await loadProfileData();
      setShowAddressModal(false);
      setShowValidationModal(false);
      setEditingAddressId(null);
      resetAddressForm();
      setPendingAddressData(null);
      setValidationResult(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptOriginalAddress = () => {
    if (pendingAddressData) saveAddress(pendingAddressData);
  };

  const handleAcceptCorrectedAddress = () => {
    if (validationResult?.validated_address && pendingAddressData) {
      const correctedAddress: CreateAddressPayload = {
        ...pendingAddressData,
        address_line1: validationResult.validated_address.street1,
        address_line2: validationResult.validated_address.street2 || "",
        city: validationResult.validated_address.city,
        state: validationResult.validated_address.state,
        zip: validationResult.validated_address.zip,
      };
      saveAddress(correctedAddress);
    }
  };

  const handleCancelValidation = () => {
    setShowValidationModal(false);
    setValidationResult(null);
    setPendingAddressData(null);
    setSaving(false);
  };

  const handleDeleteAddress = (addressId: number) => {
    setAddressToDelete(addressId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (addressToDelete === null) return;
    try {
      await deleteAddress(addressToDelete);
      setSuccess("Address deleted successfully!");
      await loadProfileData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setShowDeleteConfirm(false);
      setAddressToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddressId(address.address_id);
      setAddressForm({
        address_name: address.address_name,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || "",
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        is_default: address.is_default,
      });
    } else {
      setEditingAddressId(null);
      resetAddressForm();
    }
    setShowAddressModal(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      address_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
      is_default: false,
    });
  };

  // ============================================================================
  // EMAIL VERIFICATION HANDLERS
  // ============================================================================

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage("");

    try {
      const result = await resendVerificationEmail();
      setResendMessage(
        result.message || "Verification email sent! Please check your inbox.",
      );
    } catch (error: any) {
      setResendMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // ============================================================================
  // UI HANDLERS
  // ============================================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ============================================================================
  // RENDER - LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div
        className="profile-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profileData) return null;

  // ============================================================================
  // RENDER - MAIN CONTENT
  // ============================================================================

  return (
    <div className="profile-page">
      <div className="profile-layout">
        {/* Sidebar */}
        <ProfileSidebar
          firstName={profileData.first_name}
          lastName={profileData.last_name}
          role={profileData.role}
        />

        {/* Main Content */}
        <main className="profile-main">
          {error && (
            <div className="alert alert-error">
              <svg
                className="alert-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <svg
                className="alert-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {success}
            </div>
          )}

          {!profileData.is_email_verified && (
            <div className="verification-banner">
              <div className="verification-content">
                <svg
                  className="verification-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="verification-title">Email Not Verified</p>
                  <p className="verification-text">
                    Please verify your email address to access all features.
                  </p>
                </div>
              </div>
              <button
                onClick={handleResendVerification}
                className="resend-button"
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Email"}
              </button>
              {resendMessage && (
                <p className="resend-message">{resendMessage}</p>
              )}
            </div>
          )}

          {/* Personal Information Section */}
          <section className="profile-section">
            <div className="section-header">
              <h3 className="section-title">Personal Information</h3>
              {!isEditingProfile ? (
                <button
                  className="btn-edit"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit
                </button>
              ) : (
                <div className="edit-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditingProfile({
                        first_name: profileData.first_name,
                        last_name: profileData.last_name,
                        phone: profileData.phone || "",
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleUpdateProfile}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="info-grid">
              <div className="info-field">
                <label className="field-label">First Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className="field-input"
                    value={editingProfile.first_name}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        first_name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="field-value">{profileData.first_name}</p>
                )}
              </div>

              <div className="info-field">
                <label className="field-label">Last Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className="field-input"
                    value={editingProfile.last_name}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        last_name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="field-value">{profileData.last_name}</p>
                )}
              </div>

              <div className="info-field">
                <label className="field-label">Email Address</label>
                <p className="field-value">{profileData.email}</p>
                <span className="field-note">Email cannot be changed</span>
              </div>

              <div className="info-field">
                <label className="field-label">Phone Number</label>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    className="field-input"
                    value={editingProfile.phone}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        phone: e.target.value,
                      })
                    }
                    placeholder="(optional)"
                  />
                ) : (
                  <p className="field-value">
                    {profileData.phone || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Saved Addresses Section */}
          <section className="profile-section">
            <div className="section-header">
              <h3 className="section-title">Saved Addresses</h3>
              <button className="btn-add" onClick={() => openAddressModal()}>
                Add New
              </button>
            </div>

            {allAddresses.length === 0 ? (
              <div className="empty-address">
                <svg
                  className="empty-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="empty-text">No saved addresses yet</p>
                <button
                  className="btn-primary"
                  onClick={() => openAddressModal()}
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="addresses-grid">
                {allAddresses.map((address) => (
                  <div
                    key={address.address_id}
                    className="address-card-compact"
                  >
                    <div className="address-header">
                      <h4 className="address-name">{address.address_name}</h4>
                      {address.is_default && (
                        <span className="default-badge">Default</span>
                      )}
                    </div>
                    <p className="address-line-compact">
                      {address.address_line1}
                    </p>
                    {address.address_line2 && (
                      <p className="address-line-compact">
                        {address.address_line2}
                      </p>
                    )}
                    <p className="address-line-compact">
                      {address.city}, {address.state} {address.zip}
                    </p>
                    <div className="address-actions">
                      <button
                        className="action-btn"
                        onClick={() => openAddressModal(address)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteAddress(address.address_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddressModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <AddressForm
                addressForm={addressForm}
                onFormChange={handleAddressFormChange}
                onSubmit={handleAddressSubmit}
                onCancel={() => setShowAddressModal(false)}
                isEditing={editingAddressId !== null}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Address Validation Modal */}
      {showValidationModal && validationResult && (
        <AddressValidationModal
          validationResult={validationResult}
          onAcceptOriginal={handleAcceptOriginalAddress}
          onAcceptCorrected={handleAcceptCorrectedAddress}
          onCancel={handleCancelValidation}
        />
      )}

      {/* Delete Address Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Address?"
        message="This address will be permanently removed from your saved addresses. This action cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default Profile;
