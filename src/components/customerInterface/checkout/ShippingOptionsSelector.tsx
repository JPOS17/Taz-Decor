import { FaExclamationTriangle, FaShippingFast, FaCheck } from "react-icons/fa";
import type { ShippingOption } from "../../../api/checkout";
import DeliveryEstimate from "./DeliveryEstimate";
import LoadingSpinner from "../../universalComponents/LoadingSpinner";
import "../../../styles/components/customerInterface/checkout/ShippingOptionsSelector.css";

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
      <div className="sos-container">
        <h3 className="sos-title">Shipping Method</h3>
        <div className="sos-free-shipping-notice">
          <div className="sos-free-shipping-icon-wrap">
            <FaShippingFast size={32} />
            <FaCheck className="sos-check-overlay" size={16} />
          </div>
          <div className="sos-free-shipping-message">
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
      <div className="sos-container">
        <h3 className="sos-title">Shipping Method</h3>
        <LoadingSpinner message="Calculating shipping rates..." />
      </div>
    );
  }

  if (shippingError) {
    return (
      <div className="sos-container">
        <h3 className="sos-title">Shipping Method</h3>
        <div className="sos-error">
          <FaExclamationTriangle />
          <p>{shippingError}</p>
          <button onClick={onRetryCalculation} className="sos-btn-retry">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <div className="sos-container">
        <h3 className="sos-title">Shipping Method</h3>
        <div className="sos-placeholder">
          <p>No Current Carriers Available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sos-container">
      <h3 className="sos-title">
        Shipping Method ({shippingOptions.length} option
        {shippingOptions.length !== 1 ? "s" : ""} available)
      </h3>

      {/* Shipping rate options — each rendered as a radio button card */}
      <div className="sos-options-list">
        {shippingOptions.map((option) => (
          <label
            key={option.rate_id}
            className={[
              "sos-option",
              selectedShipping?.rate_id === option.rate_id
                ? "sos-option--selected"
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
              className="sos-radio"
            />
            <div className="sos-option-details">
              <div className="sos-option-header">
                <p className="sos-carrier-name">
                  {SERVICE_DISPLAY_MAP[option.service]?.carrier ??
                    option.carrier}{" "}
                  -{" "}
                  {SERVICE_DISPLAY_MAP[option.service]?.name ??
                    option.service_level_name}
                </p>
                <p className="sos-price">
                  ${parseFloat(option.amount).toFixed(2)}
                </p>
              </div>
              <p className="sos-estimate">
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
