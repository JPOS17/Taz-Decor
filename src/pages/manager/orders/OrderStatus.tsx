import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  Download,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { fetchAllOrders, fetchOrderDetails, type Order } from "../../../api/orders";
import { fetchSellerLocationById } from "../../../api/sellerLocation";
import {
  generatePirateShipCSV,
  downloadCSV,
  generatePirateShipFilename,
} from "../../../utils/shippingLabelFormatter";
import { formatDate } from "../../../utils/formatDate";

import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import { ToastNotification } from "../../../components/manager/shared/ToastNotifications";
import ShipByDate from "../../../components/manager/orders/ShipByDate";
import OrderStatusBadge from "../../../components/manager/orders/OrderStatusBadge";
import ExpandedOrderRow from "../../../components/manager/orders/ExpandedOrderRow";
import { useToastMessage } from "../../../hooks/useToastMessage";

// Status filter tabs shown above the table
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "ready_to_ship", label: "Ready to Ship" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const OrderStatusPage = () => {
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
  const { message, showMessage } = useToastMessage();

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
  // DERIVED VALUES
  // ============================================================================

  // Applies the active status filter to the full order list
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Number of orders in each status — shown on the filter tabs
  const countFor = (status: string) =>
    status === "all"
      ? orders.length
      : orders.filter((order) => order.status === status).length;

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
      showMessage(
        `Successfully exported ${orderDetailsList.length} order(s) to ${filename}`,
        "success",
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
    <div className="order-status-page">
      {/* Header */}
      <header className="order-status-header">
        <div className="order-status-container">
          <Link to="/manager" className="order-status-back-link">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <p className="order-status-eyebrow">Orders</p>
          <h1 className="order-status-title">Order Management</h1>
          <p className="order-status-subtitle">
            View and update order statuses. The 100 most recent orders are
            shown.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="order-status-container order-status-main">
        {/* Inline error alerts */}
        {error && (
          <div className="order-status-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </div>
        )}
        {exportError && (
          <div className="order-status-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span className="order-status-alert-text">{exportError}</span>
            <button
              onClick={() => setExportError(null)}
              className="order-status-alert-dismiss"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status filter tabs — count shown so the manager can see how many need attention */}
        <div
          className="order-status-filters"
          role="group"
          aria-label="Filter orders by status"
        >
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`order-status-filter ${
                statusFilter === filter.value
                  ? "order-status-filter--active"
                  : ""
              }`}
              aria-pressed={statusFilter === filter.value}
            >
              {filter.label}
              <span className="order-status-filter-count">
                {countFor(filter.value)}
              </span>
            </button>
          ))}
        </div>

        {/* Export actions bar */}
        {readyToShipCount > 0 && (
          <div className="order-status-export">
            <div className="order-status-export-info">
              <p className="order-status-export-selected">
                <strong>{selectedOrderIds.size}</strong> order(s) selected
              </p>
              {selectedOrderIds.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="order-status-text-button"
                >
                  Clear
                </button>
              )}
              <button
                onClick={selectAllReadyToShip}
                className="order-status-text-button"
              >
                Select all ready to ship ({readyToShipCount})
              </button>
            </div>
            {/* Export button */}
            <button
              onClick={exportToPirateShip}
              disabled={selectedOrderIds.size === 0 || isExporting}
              className="order-status-btn order-status-btn--primary"
            >
              <Download size={16} aria-hidden="true" />
              {isExporting ? "Exporting..." : "Export to Pirate Ship CSV"}
            </button>
          </div>
        )}

        {/* Orders table */}
        {loading ? (
          <LoadingSpinner message="Loading orders..." />
        ) : filteredOrders.length === 0 ? (
          <div className="order-status-empty">
            <Package size={26} aria-hidden="true" />
            <h2 className="order-status-empty-title">No orders found</h2>
            <p className="order-status-empty-text">
              There are no orders matching this filter.
            </p>
          </div>
        ) : (
          <div className="order-status-table-card">
            <table className="order-status-table">
              <thead>
                <tr>
                  {/* Checkbox column */}
                  <th className="order-status-col-checkbox">
                    <span className="order-status-visually-hidden">Select</span>
                  </th>
                  <th>Order number</th>
                  <th>Date</th>
                  <th>Ship by</th>
                  <th>Status</th>
                  <th className="order-status-col-total">Total</th>
                  <th>Tracking</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.order_id;
                  const isSelectable = order.status === "ready_to_ship";

                  return (
                    <React.Fragment key={order.order_id}>
                      <tr
                        className={`order-status-row ${
                          isExpanded ? "order-status-row--expanded" : ""
                        }`}
                        onClick={() => handleRowClick(order.order_id)}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(order.order_id);
                          }
                        }}
                        tabIndex={0}
                        aria-expanded={isExpanded}
                      >
                        {/* Checkbox cell — only ready-to-ship orders can be exported */}
                        <td
                          className="order-status-cell-checkbox"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isSelectable && (
                            <label className="order-status-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedOrderIds.has(order.order_id)}
                                onChange={() =>
                                  toggleOrderSelection(order.order_id)
                                }
                                aria-label={`Select order ${order.order_number} for export`}
                              />
                            </label>
                          )}
                        </td>
                        <td className="order-status-cell-number">
                          <ChevronRight
                            size={15}
                            className="order-status-row-chevron"
                            aria-hidden="true"
                          />
                          {order.order_number}
                        </td>
                        <td data-label="Date">{formatDate(order.created_at)}</td>
                        <td data-label="Ship by">
                          <ShipByDate
                            orderCreatedAt={order.created_at}
                            orderStatus={order.status}
                            shippingService={order.shipping_service}
                          />
                        </td>
                        <td data-label="Status">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td
                          className="order-status-col-total"
                          data-label="Total"
                        >
                          ${order.total_price.toFixed(2)}
                        </td>
                        <td data-label="Tracking">
                          {order.tracking_number ? (
                            /* Tracking link */
                            <a
                              href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="order-status-tracking-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.tracking_number}
                            </a>
                          ) : (
                            <span className="order-status-no-tracking">
                              No tracking
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded order row */}
                      {isExpanded && (
                        <ExpandedOrderRow
                          order={order}
                          onStatusUpdated={() => {
                            loadOrders();
                          }}
                          onCollapse={() => setExpandedOrderId(null)}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Toast notifications */}
      {message && (
        <ToastNotification message={message.text} type={message.type} />
      )}
    </div>
  );
};

export default OrderStatusPage;