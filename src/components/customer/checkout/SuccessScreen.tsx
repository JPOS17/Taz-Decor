import { Link } from "react-router-dom";
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
  if (!orderResult) return null;

  return (
    <div className="success-screen-checkout-success">
      <div className="success-screen-content">
        <div className="success-screen-icon-large" aria-hidden="true">
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
          <Link
            to={
              isGuest
                ? "/order-lookup"
                : `/order-confirmation/${orderResult.order_number}`
            }
            className="success-screen-btn-primary success-screen-btn-large"
          >
            <FaFileAlt aria-hidden="true" />{" "}
            {isGuest ? "Look Up My Order" : "View Order Details"}
          </Link>
          {!isGuest && (
            <Link
              to="/orders"
              className="success-screen-btn-secondary success-screen-btn-large"
            >
              View All Orders
            </Link>
          )}
          <Link
            to="/"
            className="success-screen-btn-outline success-screen-btn-large"
          >
            <FaHome aria-hidden="true" /> Continue Shopping
          </Link>
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
          <p className="success-screen-note-text">
            We'll send you order updates via email.
          </p>
          {shippingMethodName && (
            <DeliveryEstimate
              shippingMethodName={shippingMethodName}
              className="success-screen-review-delivery-estimate"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;