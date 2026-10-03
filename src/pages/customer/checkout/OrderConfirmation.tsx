import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaShoppingBag,
  FaPrint,
  FaHome,
  FaCheck,
} from "react-icons/fa";
import { fetchOrderByNumber, type OrderDetails } from "../../../api/orders";

import DeliveryEstimate from "../../../components/customer/checkout/DeliveryEstimate";

import LoadingSpinner from "../../../components/shared/LoadingSpinner";

const OrderConfirmation = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Order data
  const [order, setOrder] = useState<OrderDetails | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetch order whenever the order number changes
  useEffect(() => {
    if (orderNumber) {
      loadData();
    }
  }, [orderNumber]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetches the order by number, redirecting to login if the token is missing or expired
  const loadData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        const returnUrl = location.pathname;
        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
          state: {
            message: "Please log in to view your order confirmation",
          },
        });
        return;
      }

      const orderData = await fetchOrderByNumber(orderNumber!);
      setOrder(orderData);
      setLoading(false);
    } catch (err) {
      // Clear expired token and redirect to login
      if (err instanceof Error && err.message.includes("401")) {
        localStorage.removeItem("token");
        const returnUrl = location.pathname;
        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
          state: {
            message:
              "Your session has expired. Please log in again to view your order.",
          },
        });
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to load order");
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Triggers the browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Converts a snake_case status string to Title Case for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="order-confirmation-loading">
        <LoadingSpinner message="Loading your order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-error" role="alert">
          <h1 className="order-confirmation-error-title">Order Not Found</h1>
          <p>{error || "Unable to find order details"}</p>
          <Link to="/" className="order-confirmation-btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <main className="order-confirmation-main">
        {/* Back to orders nav */}
        <div className="order-confirmation-back-nav">
          <Link to="/orders" className="order-confirmation-back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Orders
          </Link>
        </div>

        <div className="order-confirmation-container">
          {/* Success header */}
          <header className="order-confirmation-header">
            <span className="order-confirmation-check" aria-hidden="true">
              <FaCheck />
            </span>
            <h1 className="order-confirmation-title">Order Confirmed!</h1>
            <p className="order-confirmation-message">
              Thank you for your order. We've sent a confirmation email to your
              inbox.
            </p>
            <div className="order-confirmation-number-display">
              <span className="label">Order Number</span>
              <span className="number">{orderNumber}</span>
            </div>
          </header>

          {/* Order detail cards — shipping address, delivery info, and summary */}
          <div className="order-confirmation-details-grid">
            {/* Shipping address */}
            <section className="order-confirmation-detail-card">
              <h2 className="order-confirmation-card-title">Shipping Address</h2>
              <address className="order-confirmation-address-info">
                <p>
                  <strong>
                    {order.first_name} {order.last_name}
                  </strong>
                </p>
                <p>{order.address_line1}</p>
                {order.address_line2 && <p>{order.address_line2}</p>}
                <p>
                  {order.city}, {order.state} {order.zip}
                </p>
                {order.country && <p>{order.country}</p>}
              </address>
            </section>

            {/* Delivery info */}
            <section className="order-confirmation-detail-card">
              <h2 className="order-confirmation-card-title">
                Delivery Information
              </h2>
              <div className="order-confirmation-delivery-info">
                <p className="order-confirmation-status-line">
                  <span className="order-confirmation-status-label">Status</span>
                  <span className="order-confirmation-status-badge">
                    {formatStatus(order.status)}
                  </span>
                </p>
                {order.shipping_service && (
                  <DeliveryEstimate
                    shippingMethodName={order.shipping_service}
                    orderDate={new Date(order.created_at)}
                    className="order-confirmation-delivery-estimate-override"
                  />
                )}
                {order.tracking_number && (
                  <p className="order-confirmation-tracking">
                    <span className="order-confirmation-status-label">
                      Tracking Number
                    </span>
                    <span className="order-confirmation-tracking-number">
                      {order.tracking_number}
                    </span>
                  </p>
                )}
                <p className="order-confirmation-info-note">
                  We'll send you an email with tracking information once your
                  order ships.
                </p>
              </div>
            </section>

            {/* Order summary */}
            <section className="order-confirmation-detail-card">
              <h2 className="order-confirmation-card-title">Order Summary</h2>
              <dl className="order-confirmation-summary-info">
                <div className="order-confirmation-summary-row">
                  <dt>Subtotal</dt>
                  <dd>${order.subtotal.toFixed(2)}</dd>
                </div>
                {order.discount_amount > 0 && (
                  <div className="order-confirmation-summary-row order-confirmation-discount">
                    <dt>Discount</dt>
                    <dd>-${order.discount_amount.toFixed(2)}</dd>
                  </div>
                )}
                <div className="order-confirmation-summary-row">
                  <dt>Shipping</dt>
                  <dd>
                    {order.shipping_cost === 0
                      ? "FREE"
                      : `$${order.shipping_cost.toFixed(2)}`}
                  </dd>
                </div>
                <div className="order-confirmation-summary-row">
                  <dt>Tax</dt>
                  <dd>${order.tax_amount.toFixed(2)}</dd>
                </div>
                <div className="order-confirmation-summary-row order-confirmation-total">
                  <dt>Total</dt>
                  <dd>${order.total_price.toFixed(2)}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Order items list */}
          <section className="order-confirmation-items-section">
            <h2 className="order-confirmation-card-title">Order Items</h2>
            <ul className="order-confirmation-items-list">
              {order.items.map((item) => (
                <li key={item.order_item_id} className="order-confirmation-item">
                  <img
                    src={item.img_url || "/placeholder-image.png"}
                    alt=""
                    className="order-confirmation-item-image"
                    loading="lazy"
                  />
                  <div className="order-confirmation-item-details">
                    <h3 className="order-confirmation-item-name">
                      {item.product_name}
                    </h3>
                    {item.variant_details && (
                      <p className="order-confirmation-variant-info">
                        {item.variant_details}
                      </p>
                    )}
                    <p className="order-confirmation-quantity">
                      Quantity: {item.quantity}
                      {item.quantity > 1 &&
                        ` · $${item.price_at_purchase.toFixed(2)} each`}
                    </p>
                  </div>
                  <div className="order-confirmation-item-price">
                    <span>
                      ${(item.price_at_purchase * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Action buttons — print, view orders, continue shopping */}
          <div className="order-confirmation-actions">
            <button
              type="button"
              className="order-confirmation-btn-secondary"
              onClick={handlePrint}
            >
              <FaPrint aria-hidden="true" /> Print Receipt
            </button>
            <Link to="/orders" className="order-confirmation-btn-primary">
              <FaShoppingBag aria-hidden="true" /> View All Orders
            </Link>
            <Link to="/items" className="order-confirmation-btn-outline">
              <FaHome aria-hidden="true" /> Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;