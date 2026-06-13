import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserAddresses,
  createAddress,
  updateAddress as updateAddressAPI,
  deleteAddress,
  deleteAccount,
  type CreateAddressPayload,
  type Address,
  type UserProfile,
  type DefaultAddress,
} from "../../../api/user";
import { resendVerificationEmail } from "../../../api/auth";
import {
  validateAddress as validateAddressAPI,
  type AddressValidationResult,
} from "../../../api/checkout";

import AddressForm from "../../../components/universalComponents/AddressForm";
import AddressCard from "../../../components/universalComponents/AddressCard";
import PasswordInput from "../../../components/universalComponents/PasswordInput";
import AddressValidationModal from "../../../components/universalComponents/AddressValidationModal";

import ProfileSidebar from "../../../components/universalComponents/ProfileSideBar";
import ConfirmModal from "../../../components/universalComponents/ConfirmModal";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/main/Profile.css";

// Types for the inline profile edit form
interface EditingProfile {
  first_name: string;
  last_name: string;
  phone: string;
}

const Profile = () => {
  const { user: authUser, logout, refreshUser } = useAuth();
  const { resetSession } = useCart();
  const navigate = useNavigate();

  // ============================================================================
  // STATE
  // ============================================================================

  // Profile
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<EditingProfile>({
    first_name: "",
    last_name: "",
    phone: "",
  });

  // Address
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

  // Validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);
  const [pendingAddressData, setPendingAddressData] =
    useState<CreateAddressPayload | null>(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email verification
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Delete address confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // Delete account — two-step: confirm modal then password modal
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] =
    useState(false);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null,
  );
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load profile data
  useEffect(() => {
    loadProfileData();
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetches the user's profile and saved addresses in parallel
  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [data, addresses] = await Promise.all([
        fetchUserProfile(),
        fetchUserAddresses(),
      ]);
      setProfileData(data.user);
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

  // Saves name and phone changes, refreshes the auth context, and shows a success toast
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

  // Updates a single field in the address form
  const handleAddressFormChange = (
    field: keyof CreateAddressPayload,
    value: string | boolean,
  ) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  // Validates US addresses before saving
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

        const corrected = validation.validated_address;
        const hasCorrections =
          corrected &&
          (corrected.street1 !== addressForm.address_line1 ||
            corrected.city !== addressForm.city ||
            corrected.state !== addressForm.state ||
            corrected.zip !== addressForm.zip);

        if (validation.is_valid && !hasCorrections) {
          // Valid with no corrections — save silently without opening the modal
          await saveAddress(addressForm);
        } else {
          // Needs user attention: corrections suggested or address is invalid
          setPendingAddressData(addressForm);
          setValidationResult(validation);
          setShowValidationModal(true);
          setSaving(false);
        }
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

  // Creates or updates the address, reloads the list, and resets form state
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

  // Saves the address as originally entered without applying any corrections
  const handleAcceptOriginalAddress = () => {
    if (pendingAddressData) saveAddress(pendingAddressData);
  };

  // Saves the USPS-corrected address returned by the validation API
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

  // Closes the validation modal and discards the pending address data
  const handleCancelValidation = () => {
    setShowValidationModal(false);
    setValidationResult(null);
    setPendingAddressData(null);
    setSaving(false);
  };

  // Stores the address ID and opens the delete confirmation modal
  const handleDeleteAddress = (addressId: number) => {
    setAddressToDelete(addressId);
    setShowDeleteConfirm(true);
  };

  // Deletes the stored address ID and reloads the address list
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

  // Closes the delete confirmation modal without making any changes
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
  };

  // Opens the address modal, pre-populating fields if editing an existing address
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

  // Resets the address form to its blank default values
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

  // Triggers a new verification email and displays the API response message
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
  // DELETE ACCOUNT HANDLERS
  // ============================================================================

  // Advances from the "are you sure?" modal to the password confirmation modal
  const handleDeleteAccountConfirmed = () => {
    setShowDeleteAccountConfirm(false);
    setDeletePassword("");
    setDeleteAccountError(null);
    setShowDeletePasswordModal(true);
  };

  // Closes the password modal and clears all delete account state
  const handleCloseDeletePasswordModal = () => {
    setShowDeletePasswordModal(false);
    setDeletePassword("");
    setDeleteAccountError(null);
  };

  // Verifies the password, deletes the account, clears session, and redirects to login
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
      resetSession();
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

  if (loading) {
    return (
      <div className={"profile-page profile-loading-state"}>
        <LoadingSpinner message="Loading your profile..." />
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className={"profile-page"}>
      <div className={"profile-layout"}>
        {/* Sidebar */}
        <ProfileSidebar
          firstName={profileData.first_name}
          lastName={profileData.last_name}
          role={profileData.role}
        />

        {/* Main Content */}
        <main className={"profile-main"}>
          {/* Error alert */}
          {error && (
            <div className={"profile-alert profile-alert-error"}>
              <svg
                className={"profile-alert-icon"}
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

          {/* Success alert */}
          {success && (
            <div className={"profile-alert profile-alert-success"}>
              <svg
                className={"profile-alert-icon"}
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

          {/* Email verification banner */}
          {!profileData.is_email_verified && (
            <div className={"profile-verification-banner"}>
              <div className={"profile-verification-content"}>
                <div>
                  <p className={"profile-verification-title"}>
                    Email Not Verified
                  </p>
                  <p className={"profile-verification-text"}>
                    Please verify your email address to access discounts and
                    coupons.
                  </p>
                </div>
              </div>
              <button
                onClick={handleResendVerification}
                className={"profile-resend-btn"}
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Email"}
              </button>
              {resendMessage && (
                <p className={"profile-resend-message"}>{resendMessage}</p>
              )}
            </div>
          )}

          {/* Personal Information Section */}
          <section className={"profile-section"}>
            <div className={"profile-section-header"}>
              <h3 className={"profile-section-title"}>Personal Information</h3>
              {/* Edit / Cancel + Save actions */}
              {!isEditingProfile ? (
                <button
                  className={"profile-btn-edit"}
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit
                </button>
              ) : (
                <div className={"profile-edit-actions"}>
                  <button
                    className={"profile-btn-cancel"}
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
                    className={"profile-btn-save"}
                    onClick={handleUpdateProfile}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {/* Editable fields */}
            <div className={"profile-info-grid"}>
              <div className={"profile-info-field"}>
                <label className={"profile-field-label"}>First Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className={"profile-field-input"}
                    value={editingProfile.first_name}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        first_name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className={"profile-field-value"}>
                    {profileData.first_name}
                  </p>
                )}
              </div>

              <div className={"profile-info-field"}>
                <label className={"profile-field-label"}>Last Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className={"profile-field-input"}
                    value={editingProfile.last_name}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        last_name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className={"profile-field-value"}>
                    {profileData.last_name}
                  </p>
                )}
              </div>

              <div className={"profile-info-field"}>
                <label className={"profile-field-label"}>Email Address</label>
                <p className={"profile-field-value"}>{profileData.email}</p>
                <span className={"profile-field-note"}>
                  Email cannot be changed
                </span>
              </div>

              <div className={"profile-info-field"}>
                <label className={"profile-field-label"}>Phone Number</label>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    className={"profile-field-input"}
                    value={editingProfile.phone}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(
                        /[^\d+\-()\s]/g,
                        "",
                      );
                      setEditingProfile({
                        ...editingProfile,
                        phone: sanitized,
                      });
                    }}
                    placeholder="(optional)"
                  />
                ) : (
                  <p className={"profile-field-value"}>
                    {profileData.phone || "Not provided"}
                  </p>
                )}
              </div>
            </div>

            {/* Delete Account */}
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #d9c2a3",
              }}
            >
              <button
                onClick={() => setShowDeleteAccountConfirm(true)}
                className={"profile-delete-account-link"}
              >
                Delete Account
              </button>
            </div>
          </section>

          {/* Saved Addresses Section */}
          <section className={"profile-section"}>
            <div className={"profile-section-header"}>
              <h3 className={"profile-section-title"}>
                Saved Shipping Addresses
              </h3>
              <button
                className={"profile-btn-add"}
                onClick={() => openAddressModal()}
              >
                Add New
              </button>
            </div>

            {/* Empty state or address card grid */}
            {allAddresses.length === 0 ? (
              <div className={"profile-empty-state"}>
                <svg
                  className={"profile-empty-icon"}
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
                <p className={"profile-empty-text"}>
                  No saved shipping addresses yet
                </p>
                <button
                  className={"profile-btn-primary"}
                  onClick={() => openAddressModal()}
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className={"profile-addresses-grid"}>
                {allAddresses.map((address) => (
                  <AddressCard
                    key={address.address_id}
                    address={address}
                    isSelected={false}
                    onSelect={() => {}}
                    onEdit={() => openAddressModal(address)}
                    onDelete={() => handleDeleteAddress(address.address_id)}
                    showRadio={false}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div
          className={"profile-modal-overlay"}
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className={"profile-modal-content"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={"profile-modal-body"}>
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
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Step 1 — Delete Account: initial "are you sure?" confirmation */}
      <ConfirmModal
        isOpen={showDeleteAccountConfirm}
        title="Delete Your Account?"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteAccountConfirmed}
        onCancel={() => setShowDeleteAccountConfirm(false)}
      />

      {/* Step 2 — Delete Account: password confirmation before final deletion */}
      {showDeletePasswordModal && (
        <div
          className={"profile-dap-overlay"}
          onClick={handleCloseDeletePasswordModal}
        >
          <div
            className={"profile-dap-modal"}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={"profile-dap-title"}>Confirm Your Password</h2>
            <p className={"profile-dap-subtitle"}>
              Enter your password to permanently delete your account.
            </p>

            <form onSubmit={handleConfirmDeleteAccount}>
              {/* Inline error message for wrong password */}
              {deleteAccountError && (
                <p className={"profile-dap-error"}>{deleteAccountError}</p>
              )}

              <div className={"profile-dap-field"}>
                <label className={"profile-dap-label"}>Password</label>
                <PasswordInput
                  id="delete-account-password"
                  name="delete-account-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                {/* Forgot password link */}
                <Link to="/forgot-password" className="login-forgot-link">
                  Forgot your password?
                </Link>
              </div>

              {/* Cancel and confirm buttons */}
              <div className={"profile-dap-actions"}>
                <button
                  type="button"
                  className={"profile-dap-btn-cancel"}
                  onClick={handleCloseDeletePasswordModal}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={"profile-dap-btn-confirm"}
                  disabled={isDeletingAccount || !deletePassword}
                >
                  {isDeletingAccount ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
