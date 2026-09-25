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

// This component is shown after a successful order placement
const SuccessScreen = ({
  orderResult,
  userEmail,
  isGuest,
  shippingMethodName,
}: SuccessScreenProps) => {
  const navigate = useNavigate();

  if (!orderResult) return null;

  return (
    <div className="success-screen-checkout-success">
      <div className="success-screen-content">
        <div className="success-screen-icon-large">
          <FaCheckCircle />
        </div>
        <h1 className="success-screen-title">Order Successfully Placed!</h1>
        <p className="success-screen-message">
          Thank you for your order. We've sent a confirmation email to{" "}
          <strong>{userEmail}</strong>.
        </p>

        {/* Order summary — number, total, and current status */}
        <div className="success-screen-order-info">
          <div className="success-screen-order-info-item">
            <span className="success-screen-info-label">Order Number</span>
            <span className="success-screen-info-value">{orderResult.order_number}</span>
          </div>
          <div className="success-screen-order-info-item">
            <span className="success-screen-info-label">Total Amount</span>
            <span className="success-screen-info-value">
              ${orderResult.total_price.toFixed(2)}
            </span>
          </div>
          <div className="success-screen-order-info-item">
            <span className="success-screen-info-label">Status</span>
            <span className="success-screen-info-value success-screen-status-badge">
              {orderResult.status}
            </span>
          </div>
        </div>

        {/* CTAs — guest users see order lookup; authenticated users see order history */}
        <div className="success-screen-actions">
          <button
            className="success-screen-btn-primary success-screen-btn-large"
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
              className="success-screen-btn-secondary success-screen-btn-large"
              onClick={() => navigate("/orders")}
            >
              View All Orders
            </button>
          )}
          <button
            className="success-screen-btn-outline success-screen-btn-large"
            onClick={() => navigate("/")}
          >
            <FaHome /> Continue Shopping
          </button>
        </div>

        {/* Guest order number reminder */}
        {isGuest && (
          <div className="success-screen-guest-note">
            <p>
              <strong>Save your order number:</strong>{" "}
              <span className="success-screen-order-number-highlight">
                {orderResult.order_number}
              </span>
            </p>
            <p>
              You can use it along with your email to look up your order
              anytime.
            </p>
          </div>
        )}

        <div className="success-screen-note">
          <p>
            <strong>What happens next?</strong>
          </p>
          <ul>
            <li>We'll send you order updates via email</li>
            {shippingMethodName && (
              <DeliveryEstimate
                shippingMethodName={shippingMethodName}
                className="success-screen-review-delivery-estimate"
              />
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
