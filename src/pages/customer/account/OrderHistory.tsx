import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  FaShoppingBag,
  FaTruck,
  FaCheckCircle,
  FaEye,
  FaChevronDown,
} from "react-icons/fa";
import { fetchUserOrders, type Order } from "../../../api/orders";

import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import ProfileSidebar from "../../../components/customer/shared/ProfileSidebar";
import { formatDate } from "../../../utils/formatDate";

const Orders = () => {
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Order data
  // user profile fields (first_name, last_name, role) come from useAuth() — no separate fetch needed
  const [orders, setOrders] = useState<Order[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch orders once on mount
  useEffect(() => {
    loadData();
  }, []);

  // Loads all orders for the authenticated user
  const loadData = async () => {
    try {
      setLoading(true);
      const ordersData = await fetchUserOrders();
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Toggles the expanded state of a given order row
  const toggleOrder = (orderId: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Converts a snake_case status string to Title Case for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Returns the appropriate status icon based on order status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return (
          <FaCheckCircle className="order-history-status-icon order-history-status-icon-delivered" aria-hidden="true" />
        );
      case "shipped":
      case "ready_to_ship":
        return (
          <FaTruck className="order-history-status-icon order-history-status-icon-shipped" aria-hidden="true" />
        );
      case "processing":
      case "pending":
      default:
        return (
          <FaShoppingBag className="order-history-status-icon order-history-status-icon-pending" aria-hidden="true" />
        );
    }
  };

  // Returns the CSS class for the status badge based on order status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "order-history-status-badge order-history-status-badge-delivered";
      case "shipped":
      case "ready_to_ship":
        return "order-history-status-badge order-history-status-badge-shipped";
      case "pending":
      case "processing":
      default:
        return "order-history-status-badge order-history-status-badge-pending";
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="order-history-page order-history-loading-state">
        <LoadingSpinner message="Loading your orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-page">
        <div className="order-history-layout">
          <div className="order-history-error-state" role="alert">
            <h2 className="order-history-error-state-title">Error Loading Orders</h2>
            <p className="order-history-error-state-text">{error}</p>
            <button
              type="button"
              className="order-history-btn-primary"
              onClick={loadData}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="order-history-layout">
        {/* Sidebar */}
        <ProfileSidebar
          firstName={user?.firstName ?? ""}
          lastName={user?.lastName ?? ""}
          role={user?.role ?? ""}
        />

        {/* Main content */}
        <main className="order-history-main">
          <header className="order-history-header">
            <h1 className="order-history-header-title">My Orders</h1>
            <span className="order-history-header-count">
              {orders.length === 0
                ? "No orders yet"
                : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
            </span>
          </header>

          {orders.length === 0 ? (
            <div className="order-history-empty">
              <span className="order-history-empty-icon-wrap" aria-hidden="true">
                <FaShoppingBag className="order-history-empty-icon" />
              </span>
              <h2 className="order-history-empty-title">No Orders Yet</h2>
              <p className="order-history-empty-text">
                When you place orders, they will appear here.
              </p>
              <Link to="/product-catalog" className="order-history-btn-primary">
                Start Shopping
              </Link>
            </div>
          ) : (
            <ul className="order-history-list">
              {orders.map((order) => {
                const isExpanded = expandedOrders.has(order.order_id);
                const detailsId = `order-details-${order.order_id}`;
                return (
                  <li key={order.order_id} className="order-history-row">
                    {/* Row header — a button inside the heading, so the whole row
                        toggles the order details and works from the keyboard */}
                    <h2 className="order-history-row-heading">
                      <button
                        type="button"
                        className="order-history-row-header"
                        onClick={() => toggleOrder(order.order_id)}
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                      >
                        <span className="order-history-number-section">
                          {getStatusIcon(order.status)}
                          <span className="order-history-number-text">
                            <span className="order-history-id-label">
                              {order.order_number}
                            </span>
                            <span className="order-history-date">
                              Placed on {formatDate(order.created_at)}
                            </span>
                          </span>
                        </span>
                        <span className="order-history-row-header-right">
                          <span className={getStatusBadgeClass(order.status)}>
                            {formatStatus(order.status)}
                          </span>
                          <FaChevronDown
                            className={`order-history-dropdown-chevron${isExpanded ? " order-history-dropdown-chevron-open" : ""}`}
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </h2>

                    {/* Tracking number row — only shown when a tracking number exists */}
                    {order.tracking_number && (
                      <div className="order-history-tracking-row">
                        <span className="order-history-info-label">
                          Tracking Number
                        </span>
                        <a
                          href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-history-tracking-number"
                        >
                          {order.tracking_number}
                        </a>
                      </div>
                    )}

                    {/* Collapsible order details */}
                    <div
                      id={detailsId}
                      className={`order-history-collapsible${isExpanded ? " order-history-collapsible-open" : ""}`}
                    >
                      {/* Info grid */}
                      <div className="order-history-row-body">
                        <div className="order-history-info-grid">
                          <div className="order-history-info-item">
                            <span className="order-history-info-label">
                              Total Amount
                            </span>
                            <span className="order-history-info-value">
                              ${order.total_price.toFixed(2)}
                            </span>
                          </div>
                          <div className="order-history-info-item">
                            <span className="order-history-info-label">Items</span>
                            <span className="order-history-info-value">
                              {order.item_count || 0} item
                              {order.item_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {order.address_line1 && (
                            <div className="order-history-info-item">
                              <span className="order-history-info-label">
                                Shipping To
                              </span>
                              <span className="order-history-info-value">
                                {order.city}, {order.state}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer — always visible; shows shipping/delivery dates and view details button */}
                    <div className="order-history-row-footer">
                      <div className="order-history-footer-left">
                        {order.shipped_at && (
                          <div className="order-history-shipping-date">
                            <FaTruck aria-hidden="true" />
                            <span>
                              Shipped on {formatDate(order.shipped_at)}
                            </span>
                          </div>
                        )}
                        {order.delivered_at && (
                          <div className="order-history-delivery-date">
                            <FaCheckCircle aria-hidden="true" />
                            <span>
                              Delivered on {formatDate(order.delivered_at)}
                            </span>
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/order-confirmation/${order.order_number}`}
                        className="order-history-btn-view-details"
                      >
                        <FaEye aria-hidden="true" /> View Details
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
};

export default Orders;