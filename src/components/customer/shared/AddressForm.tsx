import { useId, type FormEvent } from "react";
import type { CreateAddressPayload } from "../../../api/user";

interface AddressFormProps {
  addressForm: CreateAddressPayload;
  onFormChange: (
    field: keyof CreateAddressPayload,
    value: string | boolean,
  ) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  loading: boolean;
}

// Controlled form for creating or editing a saved address
const AddressForm = ({
  addressForm,
  onFormChange,
  onSubmit,
  onCancel,
  isEditing,
  loading,
}: AddressFormProps) => {
  // Unique per instance so labels stay linked even if two forms are ever mounted
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  return (
    <form className="address-form" onSubmit={onSubmit}>
      {/* Title changes based on whether we're creating or editing */}
      <h2 className="address-form-title">
        {isEditing ? "Edit Address" : "Add New Address"}
      </h2>

      {/* Address name */}
      <div className="address-form-row">
        <div className="address-form-group">
          <label htmlFor={fieldId("address_name")}>Address Name (optional)</label>
          <input
            id={fieldId("address_name")}
            autoComplete="nickname"
            type="text"
            value={addressForm.address_name}
            onChange={(e) => onFormChange("address_name", e.target.value)}
            placeholder="Home, Work, etc."
          />
        </div>
      </div>

      {/* Primary street address */}
      <div className="address-form-row">
        <div className="address-form-group">
          <label htmlFor={fieldId("address_line1")}>Street Address *</label>
          <input
            id={fieldId("address_line1")}
            autoComplete="address-line1"
            type="text"
            value={addressForm.address_line1}
            onChange={(e) => onFormChange("address_line1", e.target.value)}
            placeholder="123 Main St"
            required
          />
        </div>
      </div>

      {/* Optional secondary line */}
      <div className="address-form-row">
        <div className="address-form-group">
          <label htmlFor={fieldId("address_line2")}>Apt, Suite, etc. (optional)</label>
          <input
            id={fieldId("address_line2")}
            autoComplete="address-line2"
            type="text"
            value={addressForm.address_line2}
            onChange={(e) => onFormChange("address_line2", e.target.value)}
            placeholder="Apt 4B"
          />
        </div>
      </div>

      {/* City, state, and ZIP on a single row */}
      <div className="address-form-row">
        <div className="address-form-group">
          <label htmlFor={fieldId("city")}>City *</label>
          <input
            id={fieldId("city")}
            autoComplete="address-level2"
            type="text"
            value={addressForm.city}
            onChange={(e) => onFormChange("city", e.target.value)}
            required
          />
        </div>
        <div className="address-form-group">
          <label htmlFor={fieldId("state")}>State *</label>
          <input
            id={fieldId("state")}
            autoComplete="address-level1"
            type="text"
            value={addressForm.state}
            onChange={(e) => onFormChange("state", e.target.value)}
            maxLength={2}
            placeholder="TX"
            required
          />
        </div>
        <div className="address-form-group">
          <label htmlFor={fieldId("zip")}>ZIP Code *</label>
          <input
            id={fieldId("zip")}
            autoComplete="postal-code"
            type="text"
            value={addressForm.zip}
            onChange={(e) => onFormChange("zip", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Default address checkbox */}
      <div className="address-form-row">
        <div className="address-form-group-checkbox">
          <input
            type="checkbox"
            id={fieldId("is_default")}
            checked={addressForm.is_default}
            onChange={(e) => onFormChange("is_default", e.target.checked)}
          />
          <label htmlFor={fieldId("is_default")}>Set as default address</label>
        </div>
      </div>

      {/* Form actions */}
      <div className="address-form-actions">
        <button type="button" className="address-form-btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="address-form-btn-save" disabled={loading}>
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Address"
              : "Save Address"}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;