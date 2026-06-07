import type { FormEvent } from "react";
import type { CreateAddressPayload } from "../../api/user";
import "../../styles/components/universal/Address.css";

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
  return (
    <form className="af-address-form" onSubmit={onSubmit}>
      {/* Title changes based on whether we're creating or editing */}
      <h3>{isEditing ? "Edit Address" : "Add New Address"}</h3>

      {/* Address name — e.g. "Home", "Work" */}
      <div className="af-form-row">
        <div className="af-form-group">
          <label>Address Name *</label>
          <input
            type="text"
            value={addressForm.address_name}
            onChange={(e) => onFormChange("address_name", e.target.value)}
            placeholder="Home, Work, etc."
            required
          />
        </div>
      </div>

      {/* Primary street address */}
      <div className="af-form-row">
        <div className="af-form-group">
          <label>Street Address *</label>
          <input
            type="text"
            value={addressForm.address_line1}
            onChange={(e) => onFormChange("address_line1", e.target.value)}
            placeholder="123 Main St"
            required
          />
        </div>
      </div>

      {/* Optional secondary line — apt, suite, unit, etc. */}
      <div className="af-form-row">
        <div className="af-form-group">
          <label>Apt, Suite, etc. (optional)</label>
          <input
            type="text"
            value={addressForm.address_line2}
            onChange={(e) => onFormChange("address_line2", e.target.value)}
            placeholder="Apt 4B"
          />
        </div>
      </div>

      {/* City, state, and ZIP on a single row */}
      <div className="af-form-row">
        <div className="af-form-group">
          <label>City *</label>
          <input
            type="text"
            value={addressForm.city}
            onChange={(e) => onFormChange("city", e.target.value)}
            required
          />
        </div>
        <div className="af-form-group">
          <label>State *</label>
          <input
            type="text"
            value={addressForm.state}
            onChange={(e) => onFormChange("state", e.target.value)}
            maxLength={2}
            placeholder="TX"
            required
          />
        </div>
        <div className="af-form-group">
          <label>ZIP Code *</label>
          <input
            type="text"
            value={addressForm.zip}
            onChange={(e) => onFormChange("zip", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Default address checkbox */}
      <div className="af-form-row">
        <div className="af-form-group-checkbox">
          <input
            type="checkbox"
            id="is_default"
            checked={addressForm.is_default}
            onChange={(e) => onFormChange("is_default", e.target.checked)}
          />
          <label htmlFor="is_default">Set as default address</label>
        </div>
      </div>

      {/* Form actions — cancel dismisses, submit label reflects edit vs. create */}
      <div className="af-form-actions">
        <button type="button" className="af-btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="af-btn-save" disabled={loading}>
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
