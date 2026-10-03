import { useState, useEffect, type JSX } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import {
  FaSearch,
  FaShoppingBag,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaCheck,
} from "react-icons/fa";
import {
  fetchGuestOrderByNumber,
  type GuestOrderDetails,
} from "../../../api/orders";

import DeliveryEstimate from "../../../components/customer/checkout/DeliveryEstimate";

import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import { formatDate } from "../../../utils/formatDate";

// ============================================================================
// CONSTANTS
// ============================================================================

// Human-readable labels for each order status
const STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  processing: "Processing",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// Icon components for each order status
const STATUS_ICONS: Record<string, JSX.Element> = {
  pending: <FaShoppingBag />,
  processing: <FaShoppingBag />,
  ready_to_ship: <FaTruck />,
  shipped: <FaTruck />,
  delivered: <FaCheckCircle />,
  cancelled: <FaTimesCircle />,
  refunded: <FaTimesCircle />,
};

// Maps the status key returned by getStatusClass() to its scoped CSS class
const STATUS_STYLES: Record<string, string> = {
  pending: "guest-order-lookup-status-pending",
  shipped: "guest-order-lookup-status-shipped",
  delivered: "guest-order-lookup-status-delivered",
  cancelled: "guest-order-lookup-status-cancelled",
};

// ============================================================================
// HELPERS
// ============================================================================

// Returns a simplified status key used for icon and style lookups
const getStatusClass = (status: string) => {
  if (status === "delivered") return "delivered";
  if (status === "shipped" || status === "ready_to_ship") return "shipped";
  if (status === "cancelled" || status === "refunded") return "cancelled";
  return "pending";
};

// Steps shown in the progress tracker, in order
const PROGRESS_STEPS = ["Received", "Processing", "Shipped", "Delivered"];

// Maps an order status to its position in PROGRESS_STEPS; null when the order
// was cancelled or refunded, since the tracker no longer applies
const getProgressIndex = (status: string): number | null => {
  if (status === "cancelled" || status === "refunded") return null;
  if (status === "delivered") return 3;
  if (status === "shipped") return 2;
  if (status === "processing" || status === "ready_to_ship") return 1;
  return 0;
};

// ============================================================================
// LOOKUPFORM COMPONENT
// ============================================================================

const LookupForm = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Form fields
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    orderNumber?: string;
    email?: string;
  }>({});

  // ============================================================================
  // VALIDATION
  // ============================================================================

  // Validates form fields and populates field-level errors; returns true if valid
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

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Verifies the order exists then navigates to the persistent result URL
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      // Confirm order exists before navigating — email passed as query param so page refresh works
      await fetchGuestOrderByNumber(orderNumber.trim(), email.trim());
      navigate(
        `/order-lookup/${encodeURIComponent(orderNumber.trim())}?email=${encodeURIComponent(email.trim())}`,
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Order not found. Please check your order number and email.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="guest-order-lookup-page">
      <div className="guest-order-lookup-container">
        <div className="guest-order-lookup-header">
          <span className="guest-order-lookup-icon-wrap" aria-hidden="true">
            <FaSearch className="guest-order-lookup-icon" />
          </span>
          <h1>Track Your Order</h1>
          <p>
            Enter your order number and the email address you used at checkout.
          </p>
        </div>

        <form
          className="guest-order-lookup-form"
          onSubmit={handleLookup}
          noValidate
        >
          <div className="guest-order-lookup-form-group">
            <label htmlFor="lookup-order-number">Order Number</label>
            <input
              id="lookup-order-number"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-1234567890-ABCDEFGHI"
              className={
                fieldErrors.orderNumber ? "guest-order-lookup-input-error" : ""
              }
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={!!fieldErrors.orderNumber}
              aria-describedby={
                fieldErrors.orderNumber ? "lookup-order-number-error" : undefined
              }
            />
            {fieldErrors.orderNumber && (
              <span
                id="lookup-order-number-error"
                className="guest-order-lookup-field-error"
                role="alert"
              >
                {fieldErrors.orderNumber}
              </span>
            )}
          </div>

          <div className="guest-order-lookup-form-group">
            <label htmlFor="lookup-email">Email Address</label>
            <input
              id="lookup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={fieldErrors.email ? "guest-order-lookup-input-error" : ""}
              autoComplete="email"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={
                fieldErrors.email ? "lookup-email-error" : undefined
              }
            />
            {fieldErrors.email && (
              <span
                id="lookup-email-error"
                className="guest-order-lookup-field-error"
                role="alert"
              >
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="guest-order-lookup-error" role="alert">
              <FaTimesCircle aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="guest-order-lookup-btn"
            disabled={loading}
          >
            {loading ? (
              "Looking up order..."
            ) : (
              <>
                <FaSearch aria-hidden="true" /> Find My Order
              </>
            )}
          </button>
        </form>

        <p className="guest-order-lookup-help-text">
          Your order number was included in your confirmation email.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// ORDERRESULT COMPONENT
// ============================================================================

const OrderResult = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Order data
  const [order, setOrder] = useState<GuestOrderDetails | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Redirect to lookup form if required params are missing; otherwise load order
  useEffect(() => {
    if (!orderNumber || !email) {
      navigate("/order-lookup", { replace: true });
      return;
    }
    loadOrder();
  }, [orderNumber, email]);

  // Fetches the guest order by order number and email
  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGuestOrderByNumber(
        decodeURIComponent(orderNumber!),
        decodeURIComponent(email),
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

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="guest-order-lookup-loading-state">
        <LoadingSpinner message="Loading your order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="guest-order-lookup-page">
        <div className="guest-order-lookup-container">
          <div className="guest-order-lookup-header">
            <span
              className="guest-order-lookup-icon-wrap guest-order-lookup-icon-wrap--error"
              aria-hidden="true"
            >
              <FaTimesCircle className="guest-order-lookup-icon guest-order-lookup-icon--error" />
            </span>
            <h1>Order Not Found</h1>
            <p role="alert">{error || "We couldn't find that order."}</p>
          </div>
          <Link to="/order-lookup" className="guest-order-lookup-btn">
            <FaSearch aria-hidden="true" /> Try Again
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusIcon = STATUS_ICONS[order.status] || <FaShoppingBag />;
  const statusClass = getStatusClass(order.status);
  const progressIndex = getProgressIndex(order.status);

  return (
    <div className="guest-order-lookup-page">
      <div className="guest-order-lookup-container guest-order-lookup-result">
        <div className="guest-order-lookup-result-header">
          <Link to="/order-lookup" className="guest-order-lookup-btn-back">
            <FaArrowLeft aria-hidden="true" /> Look up another order
          </Link>
          <div className="guest-order-lookup-result-header-row">
            <div>
              <h1>Order {order.order_number}</h1>
              <p className="guest-order-lookup-placed-date">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <div className="guest-order-lookup-result-header-estimate">
              {order.delivered_at ? (
                <div className="guest-order-lookup-delivered-badge">
                  <FaCheckCircle aria-hidden="true" />
                  <div>
                    <span className="guest-order-lookup-delivered-label">
                      Delivered
                    </span>
                    <span className="guest-order-lookup-delivered-date">
                      {formatDate(order.delivered_at)}
                    </span>
                  </div>
                </div>
              ) : (
                order.shipping_service && (
                  <DeliveryEstimate
                    shippingMethodName={order.shipping_service}
                    orderDate={new Date(order.created_at)}
                    className="guest-order-lookup-header-delivery-estimate"
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div
          className={`guest-order-lookup-status-banner ${STATUS_STYLES[statusClass] ?? ""}`}
          role="status"
        >
          <span aria-hidden="true" className="guest-order-lookup-status-icon">
            {statusIcon}
          </span>
          <span>{statusLabel}</span>
        </div>

        {/* Progress tracker — hidden for cancelled and refunded orders */}
        {progressIndex !== null && (
          <ol
            className="guest-order-lookup-progress"
            aria-label="Order progress"
          >
            {PROGRESS_STEPS.map((step, index) => (
              <li
                key={step}
                className={[
                  "guest-order-lookup-progress-step",
                  index < progressIndex
                    ? "guest-order-lookup-progress-step--done"
                    : "",
                  index === progressIndex
                    ? "guest-order-lookup-progress-step--current"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={index === progressIndex ? "step" : undefined}
              >
                <span
                  className="guest-order-lookup-progress-dot"
                  aria-hidden="true"
                >
                  {index <= progressIndex ? <FaCheck /> : null}
                </span>
                <span className="guest-order-lookup-progress-label">{step}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Tracking info — only shown when a tracking number is present */}
        {order.tracking_number && (
          <div className="guest-order-lookup-tracking-section">
            <h2 className="guest-order-lookup-section-title">Tracking Information</h2>
            <p>
              <strong>Carrier:</strong> {order.shipping_carrier}
            </p>
            <p>
              <strong>Tracking Number:</strong>{" "}
              <span className="guest-order-lookup-tracking-number">
                {order.tracking_number}
              </span>
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

        {/* Two-column layout: items on the left, summary and address on the right */}
        <div className="guest-order-lookup-result-body">
          {/* Items ordered */}
          <div className="guest-order-lookup-items-section">
            <h2 className="guest-order-lookup-section-title">Items Ordered</h2>
            <ul className="guest-order-lookup-items-list">
              {order.items.map((item) => (
                <li
                  key={item.order_item_id}
                  className="guest-order-lookup-item-row"
                >
                  {item.img_url && (
                    <img
                      src={item.img_url}
                      alt=""
                      className="guest-order-lookup-item-img"
                      loading="lazy"
                    />
                  )}
                  <div className="guest-order-lookup-item-info">
                    <p className="guest-order-lookup-item-name">
                      {item.product_name}
                    </p>
                    {item.variant_details && (
                      <p className="guest-order-lookup-item-variant">
                        {item.variant_details}
                      </p>
                    )}
                    <p className="guest-order-lookup-item-qty">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="guest-order-lookup-item-price">
                    ${(item.price_at_purchase * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Order summary and shipping address */}
          <div className="guest-order-lookup-summary-sidebar">
            <div className="guest-order-lookup-price-summary">
              <h2 className="guest-order-lookup-section-title">Order Summary</h2>
              <div className="guest-order-lookup-summary-row">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div
                  className={
                    "guest-order-lookup-summary-row guest-order-lookup-summary-discount"
                  }
                >
                  <span>Discount</span>
                  <span>-${order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="guest-order-lookup-summary-row">
                <span>Shipping</span>
                <span>
                  {order.shipping_cost === 0
                    ? "Free"
                    : `$${order.shipping_cost.toFixed(2)}`}
                </span>
              </div>
              <div className="guest-order-lookup-summary-row">
                <span>Tax</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              <hr className="guest-order-lookup-summary-divider" />
              <div
                className={
                  "guest-order-lookup-summary-row guest-order-lookup-summary-total"
                }
              >
                <strong>Total</strong>
                <strong>${order.total_price.toFixed(2)}</strong>
              </div>
            </div>

            <address className="guest-order-lookup-address-summary">
              <h2 className="guest-order-lookup-section-title">Shipping To</h2>
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
            </address>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GUESTORDERLOOKUP COMPONENT
// ============================================================================

export { OrderResult as GuestOrderResult };
export default GuestOrderLookup;

function GuestOrderLookup() {
  return <LookupForm />;
}