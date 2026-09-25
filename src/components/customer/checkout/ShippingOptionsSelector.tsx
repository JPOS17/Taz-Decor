import { FaExclamationTriangle, FaShippingFast, FaCheck } from "react-icons/fa";
import type { ShippingOption } from "../../../api/checkout";
import DeliveryEstimate from "./DeliveryEstimate";
import LoadingSpinner from "../../shared/LoadingSpinner";

// Maps DB service keys to carrier/name labels for display
const SERVICE_DISPLAY_MAP: Record<string, { carrier: string; name: string }> = {
  usps_ground_advantage: { carrier: "USPS", name: "Ground Advantage" },
  usps_priority: { carrier: "USPS", name: "Priority Mail" },
  usps_priority_express: { carrier: "USPS", name: "Priority Mail Express" },
};

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
  // ============================================================================
  // RENDER
  // ============================================================================

  // Free shipping coupon applied — skip rate selection and show a confirmation banner
  if (isFreeShippingCoupon) {
    return (
      <div className="shipping-options-selector-container">
        <h3 className="shipping-options-selector-title">Shipping Method</h3>
        <div className="shipping-options-selector-free-shipping-notice">
          <div className="shipping-options-selector-free-shipping-icon-wrap">
            <FaShippingFast size={32} />
            <FaCheck className="shipping-options-selector-check-overlay" size={16} />
          </div>
          <div className="shipping-options-selector-free-shipping-message">
            <h4>Shipping is covered!</h4>
            <p>
              Your free shipping coupon has been applied. Our team will select
              the best shipping method for your order.
            </p>
          </div>
        </div>
        <DeliveryEstimate shippingMethodName="usps ground advantage" />
      </div>
    );
  }

  if (loadingShipping) {
    return (
      <div className="shipping-options-selector-container">
        <h3 className="shipping-options-selector-title">Shipping Method</h3>
        <LoadingSpinner message="Calculating shipping rates..." />
      </div>
    );
  }

  if (shippingError) {
    return (
      <div className="shipping-options-selector-container">
        <h3 className="shipping-options-selector-title">Shipping Method</h3>
        <div className="shipping-options-selector-error">
          <FaExclamationTriangle />
          <p>{shippingError}</p>
          <button onClick={onRetryCalculation} className="shipping-options-selector-btn-retry">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <div className="shipping-options-selector-container">
        <h3 className="shipping-options-selector-title">Shipping Method</h3>
        <div className="shipping-options-selector-placeholder">
          <p>No Current Carriers Available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shipping-options-selector-container">
      <h3 className="shipping-options-selector-title">
        Shipping Method ({shippingOptions.length} option
        {shippingOptions.length !== 1 ? "s" : ""} available)
      </h3>

      {/* Shipping rate options — each rendered as a radio button card */}
      <div className="shipping-options-selector-options-list">
        {shippingOptions.map((option) => (
          <label
            key={option.rate_id}
            className={[
              "shipping-options-selector-option",
              selectedShipping?.rate_id === option.rate_id
                ? "shipping-options-selector-option--selected"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="radio"
              name="shipping"
              value={option.rate_id}
              checked={selectedShipping?.rate_id === option.rate_id}
              onChange={() => onShippingOptionSelect(option)}
              className="shipping-options-selector-radio"
            />
            <div className="shipping-options-selector-option-details">
              <div className="shipping-options-selector-option-header">
                <p className="shipping-options-selector-carrier-name">
                  {SERVICE_DISPLAY_MAP[option.service]?.carrier ??
                    option.carrier}{" "}
                  -{" "}
                  {SERVICE_DISPLAY_MAP[option.service]?.name ??
                    option.service_level_name}
                </p>
                <p className="shipping-options-selector-price">
                  ${parseFloat(option.amount).toFixed(2)}
                </p>
              </div>
              <p className="shipping-options-selector-estimate">
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
