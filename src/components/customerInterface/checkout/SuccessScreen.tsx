import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaFileAlt, FaHome } from "react-icons/fa";
import DeliveryEstimate from "./DeliveryEstimate";
import "../../../styles/components/customerInterface/checkout/SuccessScreen.css";

interface OrderResult {
  order_id: number;
  order_number: string;
  total_price: number;
  status: string;
  created_at: string;
}

interface SuccessScreenProps {
  orderResult: OrderResult | null;
  userEmail?: string;
  isGuest?: boolean;
  shippingMethodName?: string;
}

const SuccessScreen = ({
  orderResult,
  userEmail,
  isGuest,
  shippingMethodName,
}: SuccessScreenProps) => {
  const navigate = useNavigate();

  if (!orderResult) return null;

  return (
    <div className="ss-checkout-success">
      <div className="ss-content">
        <div className="ss-icon-large">
          <FaCheckCircle />
        </div>
        <h1 className="ss-title">Order Successfully Placed!</h1>
        <p className="ss-message">
          Thank you for your order. We've sent a confirmation email to{" "}
          <strong>{userEmail}</strong>.
        </p>

        <div className="ss-order-info">
          <div className="ss-order-info-item">
            <span className="ss-info-label">Order Number</span>
            <span className="ss-info-value">{orderResult.order_number}</span>
          </div>
          <div className="ss-order-info-item">
            <span className="ss-info-label">Total Amount</span>
            <span className="ss-info-value">
              ${orderResult.total_price.toFixed(2)}
            </span>
          </div>
          <div className="ss-order-info-item">
            <span className="ss-info-label">Status</span>
            <span className="ss-info-value ss-status-badge">
              {orderResult.status}
            </span>
          </div>
        </div>

        <div className="ss-actions">
          <button
            className="ss-btn-primary ss-btn-large"
            onClick={() =>
              isGuest
                ? navigate(`/order-lookup`)
                : navigate(`/order-confirmation/${orderResult.order_number}`)
            }
          >
            <FaFileAlt /> {isGuest ? "Look Up My Order" : "View Order Details"}
          </button>
          {!isGuest && (
            <button
              className="ss-btn-secondary ss-btn-large"
              onClick={() => navigate("/orders")}
            >
              View All Orders
            </button>
          )}
          <button
            className="ss-btn-outline ss-btn-large"
            onClick={() => navigate("/")}
          >
            <FaHome /> Continue Shopping
          </button>
        </div>

        {isGuest && (
          <div className="ss-guest-note">
            <p>
              <strong>Save your order number:</strong>{" "}
              <span className="ss-order-number-highlight">
                {orderResult.order_number}
              </span>
            </p>
            <p>
              You can use it along with your email to look up your order
              anytime.
            </p>
          </div>
        )}

        <div className="ss-note">
          <p>
            <strong>What happens next?</strong>
          </p>
          <ul>
            <li>We'll send you order updates via email</li>
            {shippingMethodName && (
              <DeliveryEstimate
                shippingMethodName={shippingMethodName}
                className="ss-review-delivery-estimate"
              />
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
