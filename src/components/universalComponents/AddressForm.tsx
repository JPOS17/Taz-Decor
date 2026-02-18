import type { FormEvent } from "react";
import type { CreateAddressPayload } from "../../api/user";

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

const AddressForm = ({
  addressForm,
  onFormChange,
  onSubmit,
  onCancel,
  isEditing,
  loading,
}: AddressFormProps) => {
  return (
    <form className="address-form" onSubmit={onSubmit}>
      <h3>{isEditing ? "Edit Address" : "Add New Address"}</h3>

      <div className="form-row">
        <div className="form-group">
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

      <div className="form-row">
        <div className="form-group">
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

      <div className="form-row">
        <div className="form-group">
          <label>Apt, Suite, etc. (optional)</label>
          <input
            type="text"
            value={addressForm.address_line2}
            onChange={(e) => onFormChange("address_line2", e.target.value)}
            placeholder="Apt 4B"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={addressForm.city}
            onChange={(e) => onFormChange("city", e.target.value)}
            required
          />
        </div>
        <div className="form-group">
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
        <div className="form-group">
          <label>ZIP Code *</label>
          <input
            type="text"
            value={addressForm.zip}
            onChange={(e) => onFormChange("zip", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group-checkbox">
          <input
            type="checkbox"
            id="is_default"
            checked={addressForm.is_default}
            onChange={(e) => onFormChange("is_default", e.target.checked)}
          />
          <label htmlFor="is_default">Set as default address</label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-save" disabled={loading}>
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
