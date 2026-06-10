import { FaEdit, FaTimes } from "react-icons/fa";
import type { Address } from "../../api/user";
import "../../styles/components/universal/Address.css";

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
  return (
    <div
      className={`ac-address-card ${isSelected ? "ac-address-card-selected" : ""} ${!showRadio ? "ac-address-card-no-radio" : ""}`}
      onClick={onSelect}
    >
      {/* Radio indicator */}
      {showRadio && (
        <div className="ac-address-radio">
          <input
            type="radio"
            name="shipping_address"
            checked={isSelected}
            onChange={onSelect}
          />
        </div>
      )}

      {/* Address details */}
      <div className="ac-address-info">
        <h4>{address.address_name}</h4>
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>
          {address.city}, {address.state} {address.zip}
        </p>
        {address.is_default && (
          <span className="ac-default-badge">Default</span>
        )}
      </div>

      {/* Edit and delete action buttons */}
      <div className="ac-address-actions">
        <button
          className="ac-btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <FaEdit />
        </button>
        <button
          className="ac-btn-icon ac-btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default AddressCard;
