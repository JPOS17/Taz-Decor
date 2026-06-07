import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  fetchAllOrders,
  fetchOrderDetails,
  updateOrderStatus,
  fetchOrderStatusHistory,
  type Order as APIOrder,
  type OrderDetails as APIOrderDetails,
  type StatusHistoryItem,
  type UpdateOrderStatusPayload,
} from "../../api/orders";
import { fetchSellerLocationById } from "../../api/sellerLocation";
import {
  generatePirateShipCSV,
  downloadCSV,
  generatePirateShipFilename,
} from "../../utils/shippingLabelFormatter";
import { formatDate } from "../../utils/formatDate";

import LoadingSpinner from "../../components/universalComponents/LoadingSpinner";
import { FormField } from "../../components/managerInterface/universal/FormField";
import { TextInput } from "../../components/managerInterface/universal/TextInput";
import ConfirmationModal from "../../components/managerInterface/universal/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";

import ShipByDate from "../../components/managerInterface/orders/ShipByDate";

import "../../styles/pages/managerInterface/Tokens.css";
import "../../styles/pages/managerInterface/Components.css";
import "../../styles/pages/managerInterface/ManagerShared.css";
import "../../styles/pages/managerInterface/OrderStatus.css";

type Order = APIOrder;
type OrderDetails = APIOrderDetails;

interface ExpandedOrderRowProps {
  order: Order;
  onStatusUpdated: () => void;
  onCollapse: () => void;
}

// ============================================================================
// EXPANDED ORDER ROW COMPONENT
// ============================================================================

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

  // Ref used to scroll the error message into view when a validation error occurs
  const errorRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  // Linear status flow — each step knows its next status for the advance button
  const statusFlow = [
    { value: "pending", label: "Pending", color: "gray", next: "processing" },
    {
      value: "processing",
      label: "Processing",
      color: "blue",
      next: "ready_to_ship",
    },
    {
      value: "ready_to_ship",
      label: "Ready to Ship",
      color: "purple",
      next: "shipped",
    },
    { value: "shipped", label: "Shipped", color: "orange", next: "delivered" },
    { value: "delivered", label: "Delivered", color: "green", next: null },
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
    showConfirmation({
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
    showConfirmation({
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
    showConfirmation({
      title: "Update Tracking Information?",
      message:
        "This will update the tracking number and carrier for this order.",
      onConfirm: handleTrackingUpdateConfirmed,
    });
  };

  // Opens the cancel order confirmation modal
  const handleCancelOrder = () => {
    showConfirmation({
      title: "Cancel Order?",
      message:
        "This action indicates the order will not be fulfilled. The customer will be notified of the cancellation.",
      onConfirm: () => handleStatusUpdate("cancelled"),
    });
  };

  // Opens the refund order confirmation modal
  const handleRefundOrder = () => {
    showConfirmation({
      title: "Refund Order?",
      message:
        "This action indicates the customer will receive their money back. Make sure to process the refund through your payment system.",
      onConfirm: () => handleStatusUpdate("refunded"),
    });
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

  return (
    <tr>
      <td colSpan={7}>
        <div className="expanded-order-content">
          {loadingDetails ? (
            <div className="order-details-loading">
              <div className="mgr-spinner"></div>
              <p>Loading order details...</p>
            </div>
          ) : (
            <>
              {/* Inline error — scrolled into view when a validation error occurs */}
              {error && (
                <div className="order-error-message" ref={errorRef}>
                  {error}
                </div>
              )}

              {/* Order Details Section */}
              <div className="order-details-section">
                <h3>Order Details</h3>

                {/* Identity & Shipping Info — order number, date, status, box, and weight */}
                <div className="order-details-primary">
                  <div className="order-detail-item">
                    <strong>Order Number</strong>
                    {order.order_number}
                  </div>
                  <div className="order-detail-item">
                    <strong>Created</strong>
                    {formatDate(order.created_at, true)}
                  </div>
                  <div className="order-detail-item">
                    <strong>Status</strong>
                    <span
                      className={`order-status-badge order-status-badge-${statusFlow.find((s) => s.value === order.status)?.color || "gray"}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {orderDetails?.box_name && (
                    <div className="order-detail-item">
                      <strong>Selected Box</strong>
                      {orderDetails.box_name}
                    </div>
                  )}
                  {orderDetails?.total_weight_oz != null && (
                    <div className="order-detail-item">
                      <strong>Total Weight</strong>
                      {orderDetails.total_weight_oz.toFixed(2)} oz (
                      {(orderDetails.total_weight_oz / 16).toFixed(2)} lbs)
                    </div>
                  )}
                </div>

                {/* Financials — subtotal, discount, shipping, tax, and total */}
                <div className="order-details-financials">
                  <div className="order-detail-item">
                    <strong>Subtotal</strong>${order.subtotal.toFixed(2)}
                  </div>
                  <div className="order-detail-item">
                    <strong>Discount</strong>$
                    {order.discount_amount?.toFixed(2) || "0.00"}
                  </div>
                  <div className="order-detail-item">
                    <strong>Shipping</strong>${order.shipping_cost.toFixed(2)}
                  </div>
                  <div className="order-detail-item">
                    <strong>Tax</strong>$
                    {order.tax_amount?.toFixed(2) || "0.00"}
                  </div>
                  <div className="order-detail-item">
                    <strong>Total</strong>
                    <span>${order.total_price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping Address — includes email and tracking link if available */}
                {orderDetails && (
                  <div className="shipping-address-section">
                    <h4>Shipping Address</h4>
                    <div className="address-details">
                      <p>
                        <strong>
                          {orderDetails.first_name} {orderDetails.last_name}
                        </strong>
                      </p>
                      <p>{orderDetails.address_line1}</p>
                      {orderDetails.address_line2 && (
                        <p>{orderDetails.address_line2}</p>
                      )}
                      <p>
                        {orderDetails.city}, {orderDetails.state}{" "}
                        {orderDetails.zip}
                      </p>
                      {orderDetails.country && <p>{orderDetails.country}</p>}
                      {orderDetails.customer_email && (
                        <p>
                          <strong>Email: </strong>
                          <a
                            href={`mailto:${orderDetails.customer_email}`}
                            className="order-contact-email"
                          >
                            {orderDetails.customer_email}
                          </a>
                        </p>
                      )}
                      {/* USPS tracking link — only shown when a tracking number exists */}
                      {order.tracking_number && (
                        <p>
                          <strong>Tracking: </strong>
                          <a
                            href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="order-contact-email"
                          >
                            {order.tracking_number}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items — product image, name, variant, quantity, and line total */}
                {orderDetails && orderDetails.items && (
                  <div className="order-items-section">
                    <h4>Items ({orderDetails.items.length})</h4>
                    <div className="order-items-list">
                      {orderDetails.items.map((item) => (
                        <div
                          key={item.order_item_id}
                          className="order-item-row"
                        >
                          {item.img_url && (
                            <img
                              src={item.img_url}
                              alt={item.product_name}
                              className="order-item-image"
                            />
                          )}
                          <div className="order-item-details">
                            <strong>{item.product_name}</strong>
                            {item.variant_details && (
                              <span className="variant-details">
                                {item.variant_details}
                              </span>
                            )}
                            <div className="item-quantity-price">
                              Qty: {item.quantity} × $
                              {item.price_at_purchase.toFixed(2)} = $
                              {(item.quantity * item.price_at_purchase).toFixed(
                                2,
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update Section */}
              <div className="status-update-section">
                <h3>Update Order Status</h3>

                {/* Status Flow — visual step indicator showing current, past, and upcoming steps */}
                <div className="status-flow">
                  {statusFlow.map((status, index) => {
                    const isCurrent = status.value === order.status;
                    const isPast =
                      statusFlow.findIndex((s) => s.value === order.status) >
                      index;
                    return (
                      <div key={status.value} className="status-flow-item">
                        <div
                          className={`status-circle ${isCurrent ? "current" : isPast ? "completed" : ""}`}
                        >
                          {index + 1}
                        </div>
                        <div className="status-label">{status.label}</div>
                        {/* Connector line between steps — filled for completed steps */}
                        {index < statusFlow.length - 1 && (
                          <div
                            className={`status-connector ${isPast ? "completed" : ""}`}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Section — tracking input is only editable at ready_to_ship */}
                <div className="tracking-section">
                  <h4>Tracking Information</h4>
                  <div className="tracking-inputs">
                    <FormField label="Tracking Number">
                      <TextInput
                        value={trackingNumber}
                        onChange={setTrackingNumber}
                        placeholder="Enter tracking number"
                        disabled={order.status !== "ready_to_ship"}
                      />
                    </FormField>
                    <div className="tracking-field">
                      <label>Carrier</label>
                      <div className="tracking-info-block">
                        {shippingCarrier || "—"}
                      </div>
                    </div>
                    <div className="tracking-field">
                      <label>Service</label>
                      {/* Maps the shipping_service API key to a human-readable label */}
                      <div className="tracking-info-block">
                        {orderDetails?.shipping_service
                          ? ((
                              {
                                usps_priority_express: "Priority Mail Express",
                                usps_priority: "Priority Mail",
                                usps_ground_advantage: "Ground Advantage",
                              } as Record<string, string>
                            )[orderDetails.shipping_service] ??
                            orderDetails.shipping_service)
                          : "—"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTrackingUpdate}
                    className="btn-update-tracking"
                    disabled={loading}
                  >
                    Update Tracking
                  </button>
                </div>

                {/* Notes — optional note attached to this status change */}
                <div className="notes-section">
                  <FormField label="Notes (Optional)">
                    <TextInput
                      value={notes}
                      onChange={setNotes}
                      placeholder="Add notes about this status change..."
                      rows={3}
                    />
                  </FormField>
                </div>

                {/* Action Buttons — rollback, advance, cancel, and refund */}
                <div className="status-actions">
                  {previousStatus && (
                    <button
                      onClick={() => handlePreviousStatusClick(previousStatus)}
                      className="btn-prev-status"
                      disabled={loading}
                    >
                      ← Back to {previousStatus.label}
                    </button>
                  )}
                  {nextStatus && (
                    <button
                      onClick={() => handleNextStatusClick(nextStatus)}
                      className="btn-next-status"
                      disabled={loading}
                    >
                      Move to {nextStatus.label}
                    </button>
                  )}
                  {/* Special actions — outside the normal flow */}
                  <div className="special-actions">
                    <button
                      onClick={handleCancelOrder}
                      className="btn-cancel-order"
                      disabled={loading}
                    >
                      Cancel Order
                    </button>
                    <button
                      onClick={handleRefundOrder}
                      className="btn-refund-order"
                      disabled={loading}
                    >
                      Refund Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Status History — toggle visibility; entries shown newest-first */}
              <div className="status-history-section">
                <button onClick={toggleHistory} className="btn-toggle-history">
                  {showHistory ? "Hide" : "Show"} Status History
                </button>
                {showHistory && (
                  <div className="status-history-list">
                    {[...statusHistory].reverse().map((item) => (
                      <div key={item.log_id} className="history-item">
                        <div className="history-item-header">
                          <span
                            className={`history-status-badge order-status-badge order-status-badge-${statusFlow.find((s) => s.value === item.status)?.color || "gray"}`}
                          >
                            {item.status.replace(/_/g, " ")}
                          </span>
                          <span className="order-history-date">
                            {formatDate(item.created_at, true)}
                          </span>
                        </div>
                        {/* Notes are optional — only shown when present */}
                        {item.notes && (
                          <div className="order-history-notes">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Confirmation Modal — shared by all action buttons in this row */}
          {confirmOpen && confirmConfig && (
            <ConfirmationModal
              title={confirmConfig.title}
              message={confirmConfig.message}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              confirmText={confirmConfig.confirmText ?? "Confirm"}
              cancelText={confirmConfig.cancelText ?? "Cancel"}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const OrderStatusPage = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Order data
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Export state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Fetches the most recent 100 orders
  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllOrders(100, 0);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FORMAT HELPERS
  // ============================================================================

  // Maps a status string to its CSS color token
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "gray",
      processing: "blue",
      ready_to_ship: "purple",
      shipped: "orange",
      delivered: "green",
      cancelled: "red",
      refunded: "pink",
    };
    return statusMap[status] || "gray";
  };

  // ============================================================================
  // DERIVED VALUES
  // ============================================================================

  // Applies the active status filter to the full order list
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Count of ready_to_ship orders — drives the export bar and filter label
  const readyToShipCount = orders.filter(
    (order) => order.status === "ready_to_ship",
  ).length;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Toggles the expanded row for the clicked order; collapses it if already open
  const handleRowClick = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Adds or removes an order from the export selection set
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Selects all orders currently in ready_to_ship status
  const selectAllReadyToShip = () => {
    const readyToShipIds = orders
      .filter((order) => order.status === "ready_to_ship")
      .map((order) => order.order_id);
    setSelectedOrderIds(new Set(readyToShipIds));
  };

  // Clears the export selection set
  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  // Validates all selected orders are ready_to_ship, generates a Pirate Ship CSV, and downloads it
  const exportToPirateShip = async () => {
    if (selectedOrderIds.size === 0) {
      setExportError("Please select at least one order to export");
      return;
    }
    setIsExporting(true);
    setExportError(null);
    try {
      const orderDetailsPromises = Array.from(selectedOrderIds).map((orderId) =>
        fetchOrderDetails(orderId),
      );
      const orderDetailsList = await Promise.all(orderDetailsPromises);

      // Guard: block export if any selected order isn't ready to ship
      const nonReadyOrders = orderDetailsList.filter(
        (order) => order.status !== "ready_to_ship",
      );
      if (nonReadyOrders.length > 0) {
        setExportError(
          `Cannot export: ${nonReadyOrders.length} selected order(s) are not in "Ready to Ship" status`,
        );
        setIsExporting(false);
        return;
      }

      const locationId = orderDetailsList[0].location_id;
      if (!locationId) throw new Error("Order is missing location_id");

      const sellerLocation = await fetchSellerLocationById(locationId);
      const csvContent = generatePirateShipCSV(
        orderDetailsList,
        sellerLocation,
      );
      const filename = generatePirateShipFilename();
      downloadCSV(csvContent, filename);
      clearSelection();
      alert(
        `Successfully exported ${orderDetailsList.length} order(s) to ${filename}`,
      );
    } catch (err) {
      console.error("Export error:", err);
      setExportError(
        err instanceof Error ? err.message : "Failed to export orders",
      );
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-page accent-orders">
      {/* Header */}
      <header className="mgr-header">
        <div className="mgr-header-inner">
          <div>
            <button
              onClick={() => navigate("/manager")}
              className="mgr-back-button"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            <h1 className="mgr-header-title">Order Management</h1>
            <p className="mgr-header-subtitle">
              View and update order statuses
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mgr-container">
        <div className="mgr-body">
          {/* Inline error alerts — general and export-specific */}
          {error && <div className="order-error-message">{error}</div>}
          {exportError && (
            <div className="order-error-message order-error-dismissible">
              {exportError}
              <button
                onClick={() => setExportError(null)}
                className="order-error-dismiss"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Status Filter */}
          <div className="order-filters">
            <div className="order-filters-grid">
              <div className="order-filter-item">
                <label>Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  {/* Count shown inline so manager can see how many need exporting */}
                  <option value="ready_to_ship">
                    Ready to Ship ({readyToShipCount})
                  </option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Export Actions Bar — only visible when there are ready_to_ship orders */}
          {readyToShipCount > 0 && (
            <div className="export-actions-bar">
              <div className="export-actions-left">
                <div>
                  <strong>{selectedOrderIds.size}</strong> order(s) selected
                  {selectedOrderIds.size > 0 && (
                    <button
                      onClick={clearSelection}
                      className="btn-clear-selection"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  onClick={selectAllReadyToShip}
                  className="btn-select-all"
                >
                  Select All Ready to Ship ({readyToShipCount})
                </button>
              </div>
              {/* Export button — disabled until at least one order is selected */}
              <button
                onClick={exportToPirateShip}
                disabled={selectedOrderIds.size === 0 || isExporting}
                className={`btn-export-csv ${selectedOrderIds.size === 0 ? "btn-export-csv--disabled" : ""}`}
              >
                <Download size={20} />
                {isExporting ? "Exporting..." : "Export to Pirate Ship CSV"}
              </button>
            </div>
          )}

          {/* Orders Table — loading spinner, empty state, or table */}
          {loading ? (
            <LoadingSpinner message="Loading orders..." />
          ) : filteredOrders.length === 0 ? (
            <div className="order-empty-state">
              <Package className="order-empty-state-icon" size={48} />
              <h3>No Orders Found</h3>
              <p>There are no orders matching your filters.</p>
            </div>
          ) : (
            <div className="mgr-table-wrapper">
              <table className="mgr-table">
                <thead>
                  <tr>
                    {/* Checkbox column — only selectable for ready_to_ship orders */}
                    <th className="order-th-checkbox"></th>
                    <th>Order Number</th>
                    <th>Date</th>
                    <th>Ship By</th>
                    <th>Status</th>
                    <th className="order-col-total">Total</th>
                    <th className="order-col-tracking">Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.order_id}>
                      <tr
                        className={`order-row ${expandedOrderId === order.order_id ? "expanded" : ""}`}
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        {/* Checkbox cell — stopPropagation prevents row expansion when clicking the checkbox */}
                        <td
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.status === "ready_to_ship")
                              toggleOrderSelection(order.order_id);
                          }}
                          className={`order-td-checkbox ${order.status === "ready_to_ship" ? "order-td-checkbox--selectable" : ""}`}
                        >
                          {order.status === "ready_to_ship" &&
                            (selectedOrderIds.has(order.order_id) ? (
                              <CheckSquare
                                size={20}
                                className="checkbox-icon-selected"
                              />
                            ) : (
                              <Square
                                size={20}
                                className="checkbox-icon-unselected"
                              />
                            ))}
                        </td>
                        <td className="order-number-cell">
                          {order.order_number}
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          <ShipByDate
                            orderCreatedAt={order.created_at}
                            orderStatus={order.status}
                            shippingService={order.shipping_service}
                          />
                        </td>
                        <td className="order-status-cell">
                          <span
                            className={`order-status-badge order-status-badge-${getStatusColor(order.status)}`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="order-col-total">
                          ${order.total_price.toFixed(2)}
                        </td>
                        <td className="order-col-tracking">
                          {order.tracking_number ? (
                            /* Tracking link — stopPropagation prevents row expansion when clicking */
                            <a
                              href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="order-tracking-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.tracking_number}
                            </a>
                          ) : (
                            <span className="order-no-tracking">
                              No tracking
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded order row — renders inline below the summary row */}
                      {expandedOrderId === order.order_id && (
                        <ExpandedOrderRow
                          order={order}
                          onStatusUpdated={() => {
                            loadOrders();
                          }}
                          onCollapse={() => setExpandedOrderId(null)}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
