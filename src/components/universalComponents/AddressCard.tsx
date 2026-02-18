import { FaEdit, FaTimes } from "react-icons/fa";
import type { Address } from "../../api/user";

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
      className={`address-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="address-radio">
        <input
          type="radio"
          name="shipping_address"
          checked={isSelected}
          onChange={onSelect}
        />
      </div>
      <div className="address-info">
        <h4>{address.address_name}</h4>
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>
          {address.city}, {address.state} {address.zip}
        </p>
        {address.is_default && <span className="default-badge">Default</span>}
      </div>
      <div className="address-actions">
        <button
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <FaEdit />
        </button>
        <button
          className="btn-icon btn-delete"
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
