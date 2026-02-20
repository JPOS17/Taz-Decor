import { FaExclamationTriangle, FaShippingFast, FaCheck } from "react-icons/fa";
import type { ShippingOption } from "../../../api/checkout";

interface ShippingOptionsSelectorProps {
  loadingShipping: boolean;
  shippingError: string | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  onShippingOptionSelect: (option: ShippingOption) => void;
  onRetryCalculation: () => void;
  isFreeShippingCoupon?: boolean;
}

const ShippingOptionsSelector = ({
  loadingShipping,
  shippingError,
  shippingOptions,
  selectedShipping,
  onShippingOptionSelect,
  onRetryCalculation,
  isFreeShippingCoupon = false,
}: ShippingOptionsSelectorProps) => {
  // If free shipping coupon is applied, show special message
  if (isFreeShippingCoupon) {
    return (
      <div className="cp-shipping-options-container">
        <h3 className="cp-shipping-title">Shipping Method</h3>
        <div className="cp-free-shipping-coupon-notice">
          <div className="cp-free-shipping-icon-wrapper">
            <FaShippingFast size={32} />
            <FaCheck className="cp-check-overlay" size={16} />
          </div>
          <div className="cp-free-shipping-message">
            <h4>Shipping is covered! 🎉</h4>
            <p>
              Your free shipping coupon has been applied. Our team will select
              the best shipping method for your order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingShipping) {
    return (
      <div className="cp-shipping-options-container">
        <h3 className="cp-shipping-title">Shipping Method</h3>
        <div className="cp-shipping-loading">
          <div className="cp-spinner"></div>
          <p>Calculating shipping rates...</p>
        </div>
      </div>
    );
  }

  if (shippingError) {
    return (
      <div className="cp-shipping-options-container">
        <h3 className="cp-shipping-title">Shipping Method</h3>
        <div className="cp-shipping-error">
          <FaExclamationTriangle />
          <p>{shippingError}</p>
          <button onClick={onRetryCalculation} className="cp-btn-retry">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <div className="cp-shipping-options-container">
        <h3 className="cp-shipping-title">Shipping Method</h3>
        <div className="cp-shipping-placeholder">
          <p>Select a shipping address to see available rates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-shipping-options-container">
      <h3 className="cp-shipping-title">
        Shipping Method ({shippingOptions.length} option
        {shippingOptions.length !== 1 ? "s" : ""} available)
      </h3>

      <div className="cp-shipping-options-list">
        {shippingOptions.map((option) => (
          <label
            key={option.rate_id}
            className={`cp-shipping-option ${
              selectedShipping?.rate_id === option.rate_id ? "selected" : ""
            }`}
          >
            <input
              type="radio"
              name="shipping"
              value={option.rate_id}
              checked={selectedShipping?.rate_id === option.rate_id}
              onChange={() => onShippingOptionSelect(option)}
              className="cp-shipping-radio"
            />
            <div className="cp-shipping-option-details">
              <div className="cp-shipping-option-header">
                <p className="cp-shipping-carrier-name">
                  {option.carrier} - {option.service_level_name}
                </p>
                <p className="cp-shipping-price">
                  ${parseFloat(option.amount).toFixed(2)}
                </p>
              </div>
              <p className="cp-shipping-estimate">
                {option.estimated_days
                  ? `Estimated delivery: ${option.estimated_days} business day${option.estimated_days !== 1 ? "s" : ""}`
                  : "Delivery time varies"}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ShippingOptionsSelector;
