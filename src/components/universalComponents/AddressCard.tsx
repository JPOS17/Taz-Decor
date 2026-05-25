import { FaEdit, FaTimes } from "react-icons/fa";
import type { Address } from "../../api/user";
import "../../styles/components/universal/Address.css";

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AddressCard = ({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AddressCardProps) => {
  return (
    <div
      className={`ac-address-card ${isSelected ? "ac-address-card-selected" : ""}`}
      onClick={onSelect}
    >
      <div className="ac-address-radio">
        <input
          type="radio"
          name="shipping_address"
          checked={isSelected}
          onChange={onSelect}
        />
      </div>
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
