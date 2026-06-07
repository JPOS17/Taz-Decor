import { useState, useEffect, type JSX } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaShoppingBag,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  fetchGuestOrderByNumber,
  type GuestOrderDetails,
} from "../../../api/orders";

import DeliveryEstimate from "../../../components/customerInterface/checkout/DeliveryEstimate";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";
import { formatDate } from "../../../utils/formatDate";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/customer/GuestOrderLookup.css";

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
  pending: "guest-lookup-status-pending",
  shipped: "guest-lookup-status-shipped",
  delivered: "guest-lookup-status-delivered",
  cancelled: "guest-lookup-status-cancelled",
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
    <div className={"guest-lookup-page"}>
      <div className={"guest-lookup-container"}>
        <div className={"guest-lookup-header"}>
          <FaSearch size={40} className={"guest-lookup-icon"} />
          <h1>Track Your Order</h1>
          <p>
            Enter your order number and the email address you used at checkout.
          </p>
        </div>

        <form
          className={"guest-lookup-form"}
          onSubmit={handleLookup}
          noValidate
        >
          <div className={"guest-lookup-form-group"}>
            <label htmlFor="lookup-order-number">Order Number</label>
            <input
              id="lookup-order-number"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-1234567890-ABCDEFGHI"
              className={
                fieldErrors.orderNumber ? "guest-lookup-input-error" : ""
              }
              autoComplete="off"
            />
            {fieldErrors.orderNumber && (
              <span className={"guest-lookup-field-error"}>
                {fieldErrors.orderNumber}
              </span>
            )}
          </div>

          <div className={"guest-lookup-form-group"}>
            <label htmlFor="lookup-email">Email Address</label>
            <input
              id="lookup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={fieldErrors.email ? "guest-lookup-input-error" : ""}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className={"guest-lookup-field-error"}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className={"guest-lookup-error"}>
              <FaTimesCircle />
              <span>{error}</span>
            </div>
          )}

          {loading && <LoadingSpinner message="Looking up order..." />}

          <button
            type="submit"
            className={"guest-lookup-btn"}
            disabled={loading}
          >
            {loading ? (
              "Looking up order..."
            ) : (
              <>
                <FaSearch /> Find My Order
              </>
            )}
          </button>
        </form>

        <p className={"guest-lookup-help-text"}>
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
      <div className={"guest-lookup-loading-state"}>
        <LoadingSpinner message="Loading your order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={"guest-lookup-page"}>
        <div className={"guest-lookup-container"}>
          <div className={"guest-lookup-header"}>
            <FaTimesCircle
              size={40}
              className={"guest-lookup-icon"}
              style={{ color: "#8c2515" }}
            />
            <h1>Order Not Found</h1>
            <p>{error || "We couldn't find that order."}</p>
          </div>
          <button
            className={"guest-lookup-btn"}
            onClick={() => navigate("/order-lookup")}
          >
            <FaSearch /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusIcon = STATUS_ICONS[order.status] || <FaShoppingBag />;
  const statusClass = getStatusClass(order.status);

  return (
    <div className={"guest-lookup-page"}>
      <div className={"guest-lookup-container guest-lookup-result"}>
        <div className={"guest-lookup-result-header"}>
          <button
            className={"guest-lookup-btn-back"}
            onClick={() => navigate("/order-lookup")}
          >
            ← Look up another order
          </button>
          <div className={"guest-lookup-result-header-row"}>
            <div>
              <h1>Order {order.order_number}</h1>
              <p className={"guest-lookup-placed-date"}>
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <div className={"guest-lookup-result-header-estimate"}>
              {order.delivered_at ? (
                <div className={"guest-lookup-delivered-badge"}>
                  <FaCheckCircle />
                  <div>
                    <span className={"guest-lookup-delivered-label"}>
                      Delivered
                    </span>
                    <span className={"guest-lookup-delivered-date"}>
                      {formatDate(order.delivered_at)}
                    </span>
                  </div>
                </div>
              ) : (
                order.shipping_service && (
                  <DeliveryEstimate
                    shippingMethodName={order.shipping_service}
                    orderDate={new Date(order.created_at)}
                    className={"guest-lookup-header-delivery-estimate"}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div
          className={`guest-lookup-status-banner ${STATUS_STYLES[statusClass] ?? ""}`}
        >
          {statusIcon}
          <span>{statusLabel}</span>
        </div>

        {/* Tracking info — only shown when a tracking number is present */}
        {order.tracking_number && (
          <div className={"guest-lookup-tracking-section"}>
            <h3>Tracking Information</h3>
            <p>
              <strong>Carrier:</strong> {order.shipping_carrier}
            </p>
            <p>
              <strong>Tracking Number:</strong>{" "}
              <span className={"guest-lookup-tracking-number"}>
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
        <div className={"guest-lookup-result-body"}>
          {/* Items ordered */}
          <div className={"guest-lookup-items-section"}>
            <h3>Items Ordered</h3>
            <div className={"guest-lookup-items-list"}>
              {order.items.map((item) => (
                <div
                  key={item.order_item_id}
                  className={"guest-lookup-item-row"}
                >
                  {item.img_url && (
                    <img
                      src={item.img_url}
                      alt={item.product_name}
                      className={"guest-lookup-item-img"}
                    />
                  )}
                  <div className={"guest-lookup-item-info"}>
                    <p className={"guest-lookup-item-name"}>
                      {item.product_name}
                    </p>
                    {item.variant_details && (
                      <p className={"guest-lookup-item-variant"}>
                        {item.variant_details}
                      </p>
                    )}
                    <p className={"guest-lookup-item-qty"}>
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className={"guest-lookup-item-price"}>
                    ${(item.price_at_purchase * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order summary and shipping address */}
          <div className={"guest-lookup-summary-sidebar"}>
            <div className={"guest-lookup-price-summary"}>
              <h3>Order Summary</h3>
              <div className={"guest-lookup-summary-row"}>
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div
                  className={
                    "guest-lookup-summary-row guest-lookup-summary-discount"
                  }
                >
                  <span>Discount</span>
                  <span>-${order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className={"guest-lookup-summary-row"}>
                <span>Shipping</span>
                <span>
                  {order.shipping_cost === 0
                    ? "Free"
                    : `$${order.shipping_cost.toFixed(2)}`}
                </span>
              </div>
              <div className={"guest-lookup-summary-row"}>
                <span>Tax</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              <hr className={"guest-lookup-summary-divider"} />
              <div
                className={
                  "guest-lookup-summary-row guest-lookup-summary-total"
                }
              >
                <strong>Total</strong>
                <strong>${order.total_price.toFixed(2)}</strong>
              </div>
            </div>

            <div className={"guest-lookup-address-summary"}>
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

// ============================================================================
// GUESTORDERLOOKUP COMPONENT
// ============================================================================

export { OrderResult as GuestOrderResult };
export default GuestOrderLookup;

function GuestOrderLookup() {
  return <LookupForm />;
}
