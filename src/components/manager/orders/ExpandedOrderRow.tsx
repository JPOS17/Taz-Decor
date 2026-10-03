import { useState, useEffect, useRef } from "react";
import { AlertCircle, Check, ChevronRight, History } from "lucide-react";
import {
  fetchOrderDetails,
  updateOrderStatus,
  fetchOrderStatusHistory,
  type Order,
  type OrderDetails,
  type StatusHistoryItem,
  type UpdateOrderStatusPayload,
} from "../../../api/orders";
import { formatDate } from "../../../utils/formatDate";

import ConfirmationModal from "../shared/ManagerConfirmModal";
import OrderStatusBadge from "./OrderStatusBadge";
import { useConfirmationModal } from "../../../hooks/useConfirmationModal";

// Human-readable labels for the shipping_service API keys
const SHIPPING_SERVICE_LABELS: Record<string, string> = {
  usps_priority_express: "Priority Mail Express",
  usps_priority: "Priority Mail",
  usps_ground_advantage: "Ground Advantage",
};

// Dollar formatting helper for money fields that may be missing
const money = (value?: number | null) => `$${(value ?? 0).toFixed(2)}`;

// ============================================================================
// EXPANDED ORDER ROW COMPONENT
// Detail panel shown under an order row: order info, items, status flow,
// tracking, notes and status history.
// ============================================================================

interface ExpandedOrderRowProps {
  order: Order;
  onStatusUpdated: () => void;
  onCollapse: () => void;
}

const ExpandedOrderRow = ({
  order,
  onStatusUpdated,
}: ExpandedOrderRowProps) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Order details data
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);

  // Loading / error state
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");

  // Confirmation modal
  const {
    isOpen: confirmOpen,
    config: confirmConfig,
    showConfirmation,
    handleConfirm,
    handleCancel,
  } = useConfirmationModal();

  // Tone of the confirm button — destructive actions (cancel / refund) use "danger"
  const [confirmTone, setConfirmTone] = useState<"default" | "danger">(
    "default",
  );

  // Opens the confirmation modal with the given tone for its confirm button
  const askConfirmation = (
    config: Parameters<typeof showConfirmation>[0],
    tone: "default" | "danger" = "default",
  ) => {
    setConfirmTone(tone);
    showConfirmation(config);
  };

  // Ref used to scroll the error message into view when a validation error occurs
  const errorRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  // Linear status flow — each step knows its next status for the advance button
  const statusFlow = [
    { value: "pending", label: "Pending", next: "processing" },
    {
      value: "processing",
      label: "Processing",
      next: "ready_to_ship",
    },
    {
      value: "ready_to_ship",
      label: "Ready to Ship",
      next: "shipped",
    },
    { value: "shipped", label: "Shipped", next: "delivered" },
    { value: "delivered", label: "Delivered", next: null },
  ];

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Load order details on mount; default shipping carrier to USPS
  useEffect(() => {
    loadOrderDetails();
    setShippingCarrier("USPS");
  }, [order.order_id]);

  // Fetches full order details and pre-fills tracking fields if they already exist
  const loadOrderDetails = async () => {
    try {
      setLoadingDetails(true);
      const data = await fetchOrderDetails(order.order_id);
      setOrderDetails(data);
      if (data.tracking_number) setTrackingNumber(data.tracking_number);
      if (data.shipping_carrier) setShippingCarrier(data.shipping_carrier);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load order details",
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetches the status history log and shows it in the history panel
  const loadStatusHistory = async () => {
    try {
      const data = await fetchOrderStatusHistory(order.order_id);
      setStatusHistory(data.status_history);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to load status history:", err);
    }
  };

  // ============================================================================
  // STATUS HELPERS
  // ============================================================================

  // Returns the index of the current status in the flow array
  const getCurrentStatusIndex = () =>
    statusFlow.findIndex((s) => s.value === order.status);

  // Returns the next status object, or null if already at the final step
  const getNextStatus = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1)
      return null;
    return statusFlow[currentIndex + 1];
  };

  // Returns the previous status object for rollback; null if at the start or already shipped
  const getPreviousStatus = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex <= 0) return null;
    if (order.status === "shipped") return null;
    return statusFlow[currentIndex - 1];
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Sends the status update to the API and refreshes the parent order list
  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload: UpdateOrderStatusPayload = {
        status: newStatus,
        notes: notes || undefined,
      };
      await updateOrderStatus(order.order_id, payload);
      setNotes("");
      if (showHistory) loadStatusHistory();
      onStatusUpdated();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  // Validates tracking is present before shipping, then opens the advance confirmation modal
  const handleNextStatusClick = (nextStatus: {
    value: string;
    label: string;
  }) => {
    const statusMessages: Record<string, string> = {
      processing:
        "This indicates you have reviewed the order and it's ready to be prepared.",
      ready_to_ship:
        "This indicates the box is prepared and ready to be shipped.",
      shipped: "Make sure you've added tracking information before proceeding.",
      delivered: "This indicates the customer has received their package.",
    };

    // Block advancing to 'shipped' if no tracking number is entered
    if (nextStatus.value === "shipped" && !trackingNumber.trim()) {
      setError(
        "Please enter a tracking number before marking the order as shipped.",
      );
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        0,
      );
      return;
    }

    const message =
      statusMessages[nextStatus.value] ||
      `This will move the order to ${nextStatus.label}.`;
    askConfirmation({
      title: `Move to ${nextStatus.label}?`,
      message,
      onConfirm: () => handleStatusUpdate(nextStatus.value),
    });
  };

  // Opens the rollback confirmation modal — always records a rollback note in history
  const handlePreviousStatusClick = (prevStatus: {
    value: string;
    label: string;
  }) => {
    askConfirmation({
      title: `Roll back to ${prevStatus.label}?`,
      message: `This will move the order back to "${prevStatus.label}". A rollback entry will be recorded in the status history.`,
      onConfirm: () => handleStatusUpdate(prevStatus.value),
    });
  };

  // Saves updated tracking number and carrier without changing the order status
  const handleTrackingUpdateConfirmed = async () => {
    setLoading(true);
    setError(null);
    try {
      const trackingNote = `Tracking number updated: ${trackingNumber}${shippingCarrier ? ` (${shippingCarrier})` : ""}`;
      const payload: UpdateOrderStatusPayload = {
        status: order.status,
        notes: trackingNote,
        tracking_number: trackingNumber.trim() || null,
        shipping_carrier: shippingCarrier || undefined,
      };
      await updateOrderStatus(order.order_id, payload);
      if (showHistory) loadStatusHistory();
      onStatusUpdated();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update tracking",
      );
    } finally {
      setLoading(false);
    }
  };

  // Opens the tracking update confirmation modal
  const handleTrackingUpdate = () => {
    askConfirmation({
      title: "Update Tracking Information?",
      message:
        "This will update the tracking number and carrier for this order.",
      onConfirm: handleTrackingUpdateConfirmed,
    });
  };

  // Opens the cancel order confirmation modal
  const handleCancelOrder = () => {
    askConfirmation({
      title: "Cancel Order?",
      message:
        "This action indicates the order will not be fulfilled. The customer will be notified of the cancellation.",
      onConfirm: () => handleStatusUpdate("cancelled"),
    }, "danger");
  };

  // Opens the refund order confirmation modal
  const handleRefundOrder = () => {
    askConfirmation({
      title: "Refund Order?",
      message:
        "This action indicates the customer will receive their money back. Make sure to process the refund through your payment system.",
      onConfirm: () => handleStatusUpdate("refunded"),
    }, "danger");
  };

  // Toggles the status history panel; fetches history from the API when opening for the first time
  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
    } else {
      await loadStatusHistory();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const nextStatus = getNextStatus();
  const previousStatus = getPreviousStatus();
  const currentIndex = getCurrentStatusIndex();

  return (
    <tr className="expanded-order-row">
      <td colSpan={7}>
        <div className="expanded-order-row-content">
          {loadingDetails ? (
            <div className="expanded-order-row-loading" role="status">
              <span className="expanded-order-row-spinner" aria-hidden="true" />
              <p>Loading order details...</p>
            </div>
          ) : (
            <>
              {/* Inline error */}
              {error && (
                <div
                  className="expanded-order-row-alert"
                  role="alert"
                  ref={errorRef}
                >
                  <AlertCircle size={16} aria-hidden="true" />
                  {error}
                </div>
              )}

              <div className="expanded-order-row-grid">
                {/* ===================== LEFT: order details ===================== */}
                <div className="expanded-order-row-column">
                  <section className="expanded-order-row-section">
                    <h3 className="expanded-order-row-heading">Order details</h3>

                    {/* Identity & shipping info */}
                    <dl className="expanded-order-row-facts">
                      <div className="expanded-order-row-fact">
                        <dt>Order number</dt>
                        <dd>{order.order_number}</dd>
                      </div>
                      <div className="expanded-order-row-fact">
                        <dt>Created</dt>
                        <dd>{formatDate(order.created_at, true)}</dd>
                      </div>
                      <div className="expanded-order-row-fact">
                        <dt>Status</dt>
                        <dd>
                          <OrderStatusBadge status={order.status} />
                        </dd>
                      </div>
                      {orderDetails?.box_name && (
                        <div className="expanded-order-row-fact">
                          <dt>Selected box</dt>
                          <dd>{orderDetails.box_name}</dd>
                        </div>
                      )}
                      {orderDetails?.total_weight_oz != null && (
                        <div className="expanded-order-row-fact">
                          <dt>Total weight</dt>
                          <dd>
                            {orderDetails.total_weight_oz.toFixed(2)} oz (
                            {(orderDetails.total_weight_oz / 16).toFixed(2)}{" "}
                            lbs)
                          </dd>
                        </div>
                      )}
                    </dl>
                  </section>

                  {/* Financials */}
                  <section className="expanded-order-row-section">
                    <h3 className="expanded-order-row-heading">Payment</h3>
                    <dl className="expanded-order-row-totals">
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{money(order.subtotal)}</dd>
                      </div>
                      <div>
                        <dt>Discount</dt>
                        <dd>{money(order.discount_amount)}</dd>
                      </div>
                      <div>
                        <dt>Shipping</dt>
                        <dd>{money(order.shipping_cost)}</dd>
                      </div>
                      <div>
                        <dt>Tax</dt>
                        <dd>{money(order.tax_amount)}</dd>
                      </div>
                      <div className="expanded-order-row-totals-final">
                        <dt>Total</dt>
                        <dd>{money(order.total_price)}</dd>
                      </div>
                    </dl>
                  </section>

                  {/* Shipping address */}
                  {orderDetails && (
                    <section className="expanded-order-row-section">
                      <h3 className="expanded-order-row-heading">
                        Shipping address
                      </h3>
                      <address className="expanded-order-row-address">
                        <strong>
                          {orderDetails.first_name} {orderDetails.last_name}
                        </strong>
                        <span>{orderDetails.address_line1}</span>
                        {orderDetails.address_line2 && (
                          <span>{orderDetails.address_line2}</span>
                        )}
                        <span>
                          {orderDetails.city}, {orderDetails.state}{" "}
                          {orderDetails.zip}
                        </span>
                        {orderDetails.country && (
                          <span>{orderDetails.country}</span>
                        )}
                      </address>
                      <div className="expanded-order-row-contact">
                        {orderDetails.customer_email && (
                          <p>
                            <span>Email</span>
                            <a
                              href={`mailto:${orderDetails.customer_email}`}
                              className="expanded-order-row-link"
                            >
                              {orderDetails.customer_email}
                            </a>
                          </p>
                        )}
                        {/* USPS tracking link */}
                        {order.tracking_number && (
                          <p>
                            <span>Tracking</span>
                            <a
                              href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="expanded-order-row-link"
                            >
                              {order.tracking_number}
                            </a>
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Order items */}
                  {orderDetails && orderDetails.items && (
                    <section className="expanded-order-row-section">
                      <h3 className="expanded-order-row-heading">
                        Items ({orderDetails.items.length})
                      </h3>
                      <ul className="expanded-order-row-items">
                        {orderDetails.items.map((item) => (
                          <li
                            key={item.order_item_id}
                            className="expanded-order-row-item"
                          >
                            {item.img_url ? (
                              <img
                                src={item.img_url}
                                alt={item.product_name}
                                className="expanded-order-row-item-image"
                              />
                            ) : (
                              <span
                                className="expanded-order-row-item-image expanded-order-row-item-image--empty"
                                aria-hidden="true"
                              />
                            )}
                            <div className="expanded-order-row-item-details">
                              <strong>{item.product_name}</strong>
                              {item.variant_details && (
                                <span className="expanded-order-row-item-variant">
                                  {item.variant_details}
                                </span>
                              )}
                              <span className="expanded-order-row-item-qty">
                                Qty {item.quantity} ×{" "}
                                {money(item.price_at_purchase)}
                              </span>
                            </div>
                            <span className="expanded-order-row-item-total">
                              {money(item.quantity * item.price_at_purchase)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                {/* ===================== RIGHT: status update ===================== */}
                <div className="expanded-order-row-column">
                  <section className="expanded-order-row-section">
                    <h3 className="expanded-order-row-heading">
                      Update order status
                    </h3>

                    {/* Status flow */}
                    <ol className="expanded-order-row-flow">
                      {statusFlow.map((status, index) => {
                        const isCurrent = status.value === order.status;
                        const isPast = currentIndex > index;
                        const stateClass = isCurrent
                          ? "expanded-order-row-flow-step--current"
                          : isPast
                            ? "expanded-order-row-flow-step--done"
                            : "";
                        return (
                          <li
                            key={status.value}
                            className={`expanded-order-row-flow-step ${stateClass}`}
                            aria-current={isCurrent ? "step" : undefined}
                          >
                            <span className="expanded-order-row-flow-circle">
                              {isPast ? <Check size={14} /> : index + 1}
                            </span>
                            <span className="expanded-order-row-flow-label">
                              {status.label}
                            </span>
                          </li>
                        );
                      })}
                    </ol>

                    {/* Tracking */}
                    <div className="expanded-order-row-block">
                      <h4 className="expanded-order-row-subheading">
                        Tracking information
                      </h4>
                      <div className="expanded-order-row-tracking-grid">
                        <div className="expanded-order-row-field">
                          <label
                            className="expanded-order-row-label"
                            htmlFor={`expanded-order-row-tracking-${order.order_id}`}
                          >
                            Tracking number
                          </label>
                          <input
                            id={`expanded-order-row-tracking-${order.order_id}`}
                            type="text"
                            className="expanded-order-row-input"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            disabled={order.status !== "ready_to_ship"}
                          />
                        </div>
                        <div className="expanded-order-row-field">
                          <span className="expanded-order-row-label">
                            Carrier
                          </span>
                          <div className="expanded-order-row-readonly">
                            {shippingCarrier || "—"}
                          </div>
                        </div>
                        <div className="expanded-order-row-field">
                          <span className="expanded-order-row-label">
                            Service
                          </span>
                          {/* Maps the shipping_service API key to a human-readable label */}
                          <div className="expanded-order-row-readonly">
                            {orderDetails?.shipping_service
                              ? (SHIPPING_SERVICE_LABELS[
                                  orderDetails.shipping_service
                                ] ?? orderDetails.shipping_service)
                              : "—"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleTrackingUpdate}
                        className="expanded-order-row-btn expanded-order-row-btn--sm"
                        disabled={loading}
                      >
                        Update tracking
                      </button>
                    </div>

                    {/* Notes — optional note attached to this status change */}
                    <div className="expanded-order-row-block">
                      <div className="expanded-order-row-field">
                        <label
                          className="expanded-order-row-label"
                          htmlFor={`expanded-order-row-notes-${order.order_id}`}
                        >
                          Notes (optional)
                        </label>
                        <textarea
                          id={`expanded-order-row-notes-${order.order_id}`}
                          className="expanded-order-row-input expanded-order-row-textarea"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes about this status change..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="expanded-order-row-actions">
                      {previousStatus && (
                        <button
                          onClick={() => handlePreviousStatusClick(previousStatus)}
                          className="expanded-order-row-btn"
                          disabled={loading}
                        >
                          ← Back to {previousStatus.label}
                        </button>
                      )}
                      {nextStatus && (
                        <button
                          onClick={() => handleNextStatusClick(nextStatus)}
                          className="expanded-order-row-btn expanded-order-row-btn--primary"
                          disabled={loading}
                        >
                          Move to {nextStatus.label}
                          <ChevronRight size={16} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    {/* Special actions */}
                    <div className="expanded-order-row-danger-zone">
                      <button
                        onClick={handleCancelOrder}
                        className="expanded-order-row-btn expanded-order-row-btn--outline-danger"
                        disabled={loading}
                      >
                        Cancel order
                      </button>
                      <button
                        onClick={handleRefundOrder}
                        className="expanded-order-row-btn expanded-order-row-btn--outline-danger"
                        disabled={loading}
                      >
                        Refund order
                      </button>
                    </div>
                  </section>

                  {/* Status history */}
                  <section className="expanded-order-row-section">
                    <button
                      onClick={toggleHistory}
                      className="expanded-order-row-history-toggle"
                      aria-expanded={showHistory}
                    >
                      <History size={15} aria-hidden="true" />
                      {showHistory ? "Hide" : "Show"} status history
                    </button>
                    {showHistory && (
                      <ol className="expanded-order-row-history">
                        {[...statusHistory].reverse().map((item) => (
                          <li
                            key={item.log_id}
                            className="expanded-order-row-history-item"
                          >
                            <div className="expanded-order-row-history-header">
                              <OrderStatusBadge status={item.status} />
                              <span className="expanded-order-row-history-date">
                                {formatDate(item.created_at, true)}
                              </span>
                            </div>
                            {/* Notes are optional — only shown when present */}
                            {item.notes && (
                              <p className="expanded-order-row-history-notes">
                                {item.notes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* Confirmation Modal */}
          {confirmOpen && confirmConfig && (
            <ConfirmationModal
              title={confirmConfig.title}
              message={confirmConfig.message}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              confirmText={confirmConfig.confirmText ?? "Confirm"}
              cancelText={confirmConfig.cancelText ?? "Cancel"}
              tone={confirmTone}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

export default ExpandedOrderRow;