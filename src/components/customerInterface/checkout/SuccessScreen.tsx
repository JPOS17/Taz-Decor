import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaFileAlt, FaHome } from "react-icons/fa";

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
}

const SuccessScreen = ({
  orderResult,
  userEmail,
  isGuest,
}: SuccessScreenProps) => {
  const navigate = useNavigate();

  if (!orderResult) return null;

  return (
    <div className="checkout-success">
      <div className="success-content">
        <div className="success-icon-large">
          <FaCheckCircle />
        </div>
        <h1 className="success-title">Order Successfully Placed!</h1>
        <p className="success-message">
          Thank you for your order. We've sent a confirmation email to{" "}
          <strong>{userEmail}</strong>.
        </p>

        <div className="success-order-info">
          <div className="order-info-item">
            <span className="info-label">Order Number</span>
            <span className="info-value">{orderResult.order_number}</span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Total Amount</span>
            <span className="info-value">
              ${orderResult.total_price.toFixed(2)}
            </span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Status</span>
            <span className="info-value status-badge">
              {orderResult.status}
            </span>
          </div>
        </div>

        <div className="success-actions">
          <button
            className="btn-primary btn-large"
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
              className="btn-secondary btn-large"
              onClick={() => navigate("/orders")}
            >
              View All Orders
            </button>
          )}
          <button
            className="btn-outline btn-large"
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

        <div className="success-note">
          <p>
            <strong>What happens next?</strong>
          </p>
          <ul>
            <li>We'll send you shipping updates via email</li>
            <li>Your order will be processed within 1-2 business days</li>
            <li>Estimated delivery: 5-7 business days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
