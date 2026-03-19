import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaFileAlt, FaHome } from "react-icons/fa";
import DeliveryEstimate from "./DeliveryEstimate";

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
    <div className="cp-checkout-success">
      <div className="cp-success-content">
        <div className="cp-success-icon-large">
          <FaCheckCircle />
        </div>
        <h1 className="cp-success-title">Order Successfully Placed!</h1>
        <p className="cp-success-message">
          Thank you for your order. We've sent a confirmation email to{" "}
          <strong>{userEmail}</strong>.
        </p>

        <div className="cp-success-order-info">
          <div className="cp-order-info-item">
            <span className="cp-info-label">Order Number</span>
            <span className="cp-info-value">{orderResult.order_number}</span>
          </div>
          <div className="cp-order-info-item">
            <span className="cp-info-label">Total Amount</span>
            <span className="cp-info-value">
              ${orderResult.total_price.toFixed(2)}
            </span>
          </div>
          <div className="cp-order-info-item">
            <span className="cp-info-label">Status</span>
            <span className="cp-info-value cp-status-badge">
              {orderResult.status}
            </span>
          </div>
        </div>

        <div className="cp-success-actions">
          <button
            className="cp-btn-primary cp-btn-large"
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
              className="cp-btn-secondary cp-btn-large"
              onClick={() => navigate("/orders")}
            >
              View All Orders
            </button>
          )}
          <button
            className="cp-btn-outline cp-btn-large"
            onClick={() => navigate("/")}
          >
            <FaHome /> Continue Shopping
          </button>
        </div>

        {isGuest && (
          <div className="success-guest-note">
            <p>
              <strong>Save your order number:</strong>{" "}
              <span className="order-number-highlight">
                {orderResult.order_number}
              </span>
            </p>
            <p>
              You can use it along with your email to look up your order
              anytime.
            </p>
          </div>
        )}

        <div className="cp-success-note">
          <p>
            <strong>What happens next?</strong>
          </p>
          <ul>
            <li>We'll send you shipping updates via email</li>
            {shippingMethodName && (
              <DeliveryEstimate
                shippingMethodName={shippingMethodName}
                className="cp-review-delivery-estimate"
              />
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
