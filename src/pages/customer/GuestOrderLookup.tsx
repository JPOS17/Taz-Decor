import { useState, type JSX } from "react";
import {
  FaSearch,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import {
  fetchGuestOrderByNumber,
  type GuestOrderDetails,
} from "../../api/checkout";

import "../../styles/pages/customer/GuestOrderLookup.css";

// Status helpers

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  processing: "Processing",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_ICONS: Record<string, JSX.Element> = {
  pending: <FaBox />,
  processing: <FaBox />,
  ready_to_ship: <FaBox />,
  shipped: <FaTruck />,
  delivered: <FaCheckCircle />,
  cancelled: <FaTimesCircle />,
  refunded: <FaTimesCircle />,
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Component

const GuestOrderLookup = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<GuestOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    orderNumber?: string;
    email?: string;
  }>({});

  const validate = (): boolean => {
    const errs: { orderNumber?: string; email?: string } = {};
    if (!orderNumber.trim()) errs.orderNumber = "Order number is required";
    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const result = await fetchGuestOrderByNumber(
        orderNumber.trim(),
        email.trim(),
      );
      setOrder(result);
    } catch (err: any) {
      setError(
        err.message ||
          "Order not found. Please check your order number and email.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setError(null);
    setFieldErrors({});
  };

  // Lookup Form

  if (!order) {
    return (
      <div className="guest-lookup-page">
        <div className="guest-lookup-container">
          <div className="guest-lookup-header">
            <FaSearch size={40} className="lookup-icon" />
            <h1>Track Your Order</h1>
            <p>
              Enter your order number and the email address you used at
              checkout.
            </p>
          </div>

          <form
            className="guest-lookup-form"
            onSubmit={handleLookup}
            noValidate
          >
            <div className="form-group">
              <label htmlFor="lookup-order-number">Order Number</label>
              <input
                id="lookup-order-number"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-1234567890-ABCDEFGHI"
                className={fieldErrors.orderNumber ? "input-error" : ""}
                autoComplete="off"
              />
              {fieldErrors.orderNumber && (
                <span className="field-error">{fieldErrors.orderNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lookup-email">Email Address</label>
              <input
                id="lookup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldErrors.email ? "input-error" : ""}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>

            {error && (
              <div className="lookup-error">
                <FaTimesCircle />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-lookup" disabled={loading}>
              {loading ? (
                <>
                  <FaSpinner className="spin" /> Looking up order...
                </>
              ) : (
                <>
                  <FaSearch /> Find My Order
                </>
              )}
            </button>
          </form>

          <p className="lookup-help-text">
            Your order number was included in your confirmation email. If you
            have an account, <a href="/login">sign in</a> to view your full
            order history.
          </p>
        </div>
      </div>
    );
  }

  // Order Details

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusIcon = STATUS_ICONS[order.status] || <FaBox />;

  return (
    <div className="guest-lookup-page">
      <div className="guest-lookup-container guest-lookup-result">
        <div className="order-result-header">
          <button className="btn-back-lookup" onClick={handleReset}>
            ← Look up another order
          </button>
          <h1>Order {order.order_number}</h1>
          <p className="order-placed-date">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        {/* Status badge */}
        <div className={`order-status-banner status-${order.status}`}>
          {statusIcon}
          <span>{statusLabel}</span>
        </div>

        {/* Tracking info */}
        {order.tracking_number && (
          <div className="order-tracking-section">
            <h3>Tracking Information</h3>
            <p>
              <strong>Carrier:</strong> {order.shipping_carrier}
            </p>
            <p>
              <strong>Tracking Number:</strong>{" "}
              <span className="tracking-number">{order.tracking_number}</span>
            </p>
            {order.shipped_at && (
              <p>
                <strong>Shipped:</strong> {formatDate(order.shipped_at)}
              </p>
            )}
            {order.delivered_at && (
              <p>
                <strong>Delivered:</strong> {formatDate(order.delivered_at)}
              </p>
            )}
          </div>
        )}

        {/* Two-column layout: items + summary */}
        <div className="order-result-body">
          {/* Items */}
          <div className="order-items-section">
            <h3>Items Ordered</h3>
            <div className="order-items-list">
              {order.items.map((item) => (
                <div key={item.order_item_id} className="order-item-row">
                  {item.img_url && (
                    <img
                      src={item.img_url}
                      alt={item.product_name}
                      className="order-item-img"
                    />
                  )}
                  <div className="order-item-info">
                    <p className="order-item-name">{item.product_name}</p>
                    {item.variant_details && (
                      <p className="order-item-variant">
                        {item.variant_details}
                      </p>
                    )}
                    <p className="order-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <p className="order-item-price">
                    ${(item.price_at_purchase * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary + Address */}
          <div className="order-summary-sidebar">
            {/* Price breakdown */}
            <div className="order-price-summary">
              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="summary-row summary-discount">
                  <span>Discount</span>
                  <span>-${order.discount_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {order.shipping_cost === 0
                    ? "Free"
                    : `$${order.shipping_cost.toFixed(2)}`}
                </span>
              </div>

              <div className="summary-row">
                <span>Tax</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row summary-total">
                <strong>Total</strong>
                <strong>${order.total_price.toFixed(2)}</strong>
              </div>
            </div>

            {/* Shipping address */}
            <div className="order-address-summary">
              <h3>Shipping To</h3>
              <p>
                <strong>
                  {order.guest_first_name} {order.guest_last_name}
                </strong>
              </p>
              <p>{order.address_line1}</p>
              {order.address_line2 && <p>{order.address_line2}</p>}
              <p>
                {order.city}, {order.state} {order.zip}
              </p>
              <p>{order.country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestOrderLookup;
