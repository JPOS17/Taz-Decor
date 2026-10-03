import { FaEdit, FaTimes } from "react-icons/fa";
import type { Address } from "../../../api/user";

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showRadio?: boolean;
}

// Displays a single saved address as a selectable card with edit and delete actions
const AddressCard = ({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showRadio = true,
}: AddressCardProps) => {
  // The address details — shared by the selectable and read-only variants
  const details = (
    <div className="address-card-address-info">
      <h4>{address.address_name}</h4>
      <p>{address.address_line1}</p>
      {address.address_line2 && <p>{address.address_line2}</p>}
      <p>
        {address.city}, {address.state} {address.zip}
      </p>
      {address.is_default && (
        <span className="address-card-default-badge">Default</span>
      )}
    </div>
  );

  return (
    <div
      className={[
        "address-card",
        isSelected ? "address-card-selected" : "",
        !showRadio ? "address-card-no-radio" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Selectable variant — a label, so clicking the details picks the radio */}
      {showRadio ? (
        <label className="address-card-select">
          <span className="address-card-address-radio">
            <input
              type="radio"
              name="shipping_address"
              checked={isSelected}
              onChange={onSelect}
            />
          </span>
          {details}
        </label>
      ) : (
        <div className="address-card-select">{details}</div>
      )}

      {/* Edit and delete action buttons */}
      <div className="address-card-address-actions">
        <button
          type="button"
          className="address-card-btn-icon"
          onClick={onEdit}
          aria-label={`Edit ${address.address_name || "address"}`}
          title="Edit"
        >
          <FaEdit aria-hidden="true" />
        </button>
        <button
          type="button"
          className="address-card-btn-icon address-card-btn-delete"
          onClick={onDelete}
          aria-label={`Delete ${address.address_name || "address"}`}
          title="Delete"
        >
          <FaTimes aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default AddressCard;