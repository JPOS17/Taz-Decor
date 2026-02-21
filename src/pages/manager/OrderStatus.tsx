import React, { useState, useEffect } from "react";
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
} from "../../api/checkout";
import { fetchSellerLocationById } from "../../api/sellerLocation";
import {
  generatePirateShipCSV,
  downloadCSV,
  generatePirateShipFilename,
} from "../../utils/shippingLabelFormatter";

import ConfirmationModal from "../../components/managerInterface/universal/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import ShipByDate from "../../components/managerInterface/orders/ShipByDate";

import "../../styles/pages/manager/OrderStatus.css";

type Order = APIOrder;
type OrderDetails = APIOrderDetails;

interface ExpandedOrderRowProps {
  order: Order;
  onStatusUpdated: () => void;
  onCollapse: () => void;
}

const ExpandedOrderRow = ({
  order,
  onStatusUpdated,
}: ExpandedOrderRowProps) => {
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const {
    isOpen: confirmOpen,
    config: confirmConfig,
    showConfirmation,
    handleConfirm,
    handleCancel,
  } = useConfirmationModal();

  useEffect(() => {
    loadOrderDetails();
    setShippingCarrier("USPS");
  }, [order.order_id]);

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

  const getCurrentStatusIndex = () =>
    statusFlow.findIndex((s) => s.value === order.status);

  const getNextStatus = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1)
      return null;
    return statusFlow[currentIndex + 1];
  };

  const getPreviousStatus = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex <= 0) return null;
    return statusFlow[currentIndex - 1];
  };

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
    const message =
      statusMessages[nextStatus.value] ||
      `This will move the order to ${nextStatus.label}.`;
    showConfirmation({
      title: `Move to ${nextStatus.label}?`,
      message,
      onConfirm: () => handleStatusUpdate(nextStatus.value),
    });
  };

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

  const handleTrackingUpdateConfirmed = async () => {
    setLoading(true);
    setError(null);
    try {
      const trackingNote = `Tracking number updated: ${trackingNumber}${shippingCarrier ? ` (${shippingCarrier})` : ""}`;
      const payload: UpdateOrderStatusPayload = {
        status: order.status,
        notes: trackingNote,
        tracking_number: trackingNumber || undefined,
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

  const handleTrackingUpdate = () => {
    showConfirmation({
      title: "Update Tracking Information?",
      message:
        "This will update the tracking number and carrier for this order.",
      onConfirm: handleTrackingUpdateConfirmed,
    });
  };

  const handleCancelOrder = () => {
    showConfirmation({
      title: "Cancel Order?",
      message:
        "This action indicates the order will not be fulfilled. The customer will be notified of the cancellation.",
      onConfirm: () => handleStatusUpdate("cancelled"),
    });
  };

  const handleRefundOrder = () => {
    showConfirmation({
      title: "Refund Order?",
      message:
        "This action indicates the customer will receive their money back. Make sure to process the refund through your payment system.",
      onConfirm: () => handleStatusUpdate("refunded"),
    });
  };

  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
    } else {
      await loadStatusHistory();
    }
  };

  const loadStatusHistory = async () => {
    try {
      const data = await fetchOrderStatusHistory(order.order_id);
      setStatusHistory(data.status_history);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to load status history:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nextStatus = getNextStatus();
  const previousStatus = getPreviousStatus();

  return (
    <tr>
      <td colSpan={7}>
        <div className="expanded-order-content">
          {loadingDetails ? (
            <div className="order-details-loading">
              <div className="order-spinner"></div>
              <p>Loading order details...</p>
            </div>
          ) : (
            <>
              {error && <div className="order-error-message">{error}</div>}

              {/* Order Details */}
              <div className="order-details-section">
                <h3>Order Details</h3>
                <div className="order-details-grid">
                  <div className="order-detail-item">
                    <strong>Order Number:</strong> {order.order_number}
                  </div>
                  <div className="order-detail-item">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`order-status-badge order-status-badge-${statusFlow.find((s) => s.value === order.status)?.color || "gray"}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="order-detail-item">
                    <strong>Subtotal:</strong> ${order.subtotal.toFixed(2)}
                  </div>
                  <div className="order-detail-item">
                    <strong>Discount:</strong> $
                    {order.discount_amount?.toFixed(2) || "0.00"}
                  </div>
                  <div className="order-detail-item">
                    <strong>Shipping:</strong> ${order.shipping_cost.toFixed(2)}
                  </div>
                  <div className="order-detail-item">
                    <strong>Tax:</strong> $
                    {order.tax_amount?.toFixed(2) || "0.00"}
                  </div>
                  <div className="order-detail-item">
                    <strong>Total:</strong> ${order.total_price.toFixed(2)}
                  </div>
                  <div className="order-detail-item">
                    <strong>Created:</strong> {formatDate(order.created_at)}
                  </div>
                  <div className="order-detail-item">
                    <strong>Ship By:</strong>
                    <ShipByDate
                      orderCreatedAt={order.created_at}
                      orderStatus={order.status}
                      shippingService={orderDetails?.shipping_service}
                    />
                  </div>

                  {/* Weight & Box — from orderDetails since base Order type doesn't include these */}
                  {orderDetails?.total_weight_oz != null && (
                    <div className="order-detail-item">
                      <strong>Total Weight:</strong>{" "}
                      {orderDetails.total_weight_oz.toFixed(2)} oz (
                      {(orderDetails.total_weight_oz / 16).toFixed(2)} lbs)
                    </div>
                  )}
                  {orderDetails?.box_name && (
                    <div className="order-detail-item">
                      <strong>Selected Box:</strong> {orderDetails.box_name}
                      {orderDetails.box_length &&
                        orderDetails.box_width &&
                        orderDetails.box_height && (
                          <span className="order-detail-box-dims">
                            ({orderDetails.box_length}×{orderDetails.box_width}×
                            {orderDetails.box_height} in)
                          </span>
                        )}
                    </div>
                  )}
                </div>

                {/* Shipping Address */}
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
                    </div>
                  </div>
                )}

                {/* Order Items */}
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

                {/* Status Flow */}
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
                        {index < statusFlow.length - 1 && (
                          <div
                            className={`status-connector ${isPast ? "completed" : ""}`}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tracking */}
                <div className="tracking-section">
                  <h4>Tracking Information</h4>
                  <div className="tracking-inputs">
                    <div className="form-group">
                      <label>Tracking Number</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Carrier</label>
                      <div className="tracking-info-block">
                        {shippingCarrier || "—"}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Service</label>
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
                    <button
                      onClick={handleTrackingUpdate}
                      className="btn-update-tracking"
                      disabled={loading}
                    >
                      Update Tracking
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="notes-section">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this status change..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
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

              {/* Status History */}
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
                            className={`history-status-badge order-status-badge-${statusFlow.find((s) => s.value === item.status)?.color || "gray"}`}
                          >
                            {item.status.replace(/_/g, " ")}
                          </span>
                          <span className="order-history-date">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

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

  const handleRowClick = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

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

  const selectAllReadyToShip = () => {
    const readyToShipIds = orders
      .filter((order) => order.status === "ready_to_ship")
      .map((order) => order.order_id);
    setSelectedOrderIds(new Set(readyToShipIds));
  };

  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

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

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const readyToShipCount = orders.filter(
    (order) => order.status === "ready_to_ship",
  ).length;

  if (loading) {
    return (
      <div className="order-status-page-container">
        <div className="order-dashboard-header">
          <div className="container">
            <button
              onClick={() => navigate("/manager")}
              className="order-back-button"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <div className="order-status-dashboard-header-content">
              <div>
                <h1 className="order-dashboard-title">Order Management</h1>
                <p className="order-status-dashboard-subtitle">
                  View and update order statuses
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="container order-container-spacing">
          <div className="order-loading-state">
            <div className="order-spinner"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-status-page-container">
      <div className="order-dashboard-header">
        <div className="container">
          <button
            onClick={() => navigate("/manager")}
            className="order-back-button"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="order-status-dashboard-header-content">
            <div>
              <h1 className="order-dashboard-title">Order Management</h1>
              <p className="order-status-dashboard-subtitle">
                View and update order statuses
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container order-container-spacing">
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

        {/* Export Actions Bar */}
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
              <button onClick={selectAllReadyToShip} className="btn-select-all">
                Select All Ready to Ship ({readyToShipCount})
              </button>
            </div>
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

        {/* Filters */}
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

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="order-empty-state">
            <Package className="order-empty-state-icon" size={48} />
            <h3>No Orders Found</h3>
            <p>There are no orders matching your filters.</p>
          </div>
        ) : (
          <div className="order-table-wrapper">
            <table className="order-table">
              <thead>
                <tr>
                  <th className="order-th-checkbox">{/* Checkbox column */}</th>
                  <th>Order Number</th>
                  <th>Date</th>
                  <th>Ship By</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Tracking</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <React.Fragment key={order.order_id}>
                    <tr
                      className={`order-row ${expandedOrderId === order.order_id ? "expanded" : ""}`}
                    >
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
                            <CheckSquare size={20} color="#28a745" />
                          ) : (
                            <Square size={20} color="#6c757d" />
                          ))}
                      </td>
                      <td
                        className="order-number-cell order-td-clickable"
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        {order.order_number}
                      </td>
                      <td
                        className="order-td-clickable"
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        {formatDate(order.created_at)}
                      </td>
                      <td
                        className="order-td-clickable"
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        <ShipByDate
                          orderCreatedAt={order.created_at}
                          orderStatus={order.status}
                          shippingService={order.shipping_service}
                        />
                      </td>
                      <td
                        className="order-td-clickable"
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        ${order.total_price.toFixed(2)}
                      </td>
                      <td
                        className="order-status-cell order-td-clickable"
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        <span
                          className={`order-status-badge order-status-badge-${getStatusColor(order.status)}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td
                        className="order-td-clickable"
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        {order.tracking_number ? (
                          <span className="order-tracking-number">
                            {order.tracking_number}
                          </span>
                        ) : (
                          <span className="order-no-tracking">No tracking</span>
                        )}
                      </td>
                      <td
                        className="order-td-clickable"
                        onClick={() => handleRowClick(order.order_id)}
                      >
                        <div className="expand-icon">
                          {expandedOrderId === order.order_id ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                      </td>
                    </tr>
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
  );
};

export default OrderStatusPage;
