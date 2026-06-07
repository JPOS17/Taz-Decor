import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  FaShoppingBag,
  FaTruck,
  FaCheckCircle,
  FaEye,
  FaChevronDown,
} from "react-icons/fa";
import { fetchUserOrders, type Order } from "../../../api/orders";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";
import ProfileSidebar from "../../../components/universalComponents/ProfileSideBar";
import { formatDate } from "../../../utils/formatDate";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/customer/Orders.css";

const Orders = () => {
  const navigate = useNavigate();
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
          <FaCheckCircle className="orders-status-icon orders-status-icon-delivered" />
        );
      case "shipped":
      case "ready_to_ship":
        return (
          <FaTruck className="orders-status-icon orders-status-icon-shipped" />
        );
      case "processing":
      case "pending":
      default:
        return (
          <FaShoppingBag className="orders-status-icon orders-status-icon-pending" />
        );
    }
  };

  // Returns the CSS class for the status badge based on order status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "orders-status-badge orders-status-badge-delivered";
      case "shipped":
      case "ready_to_ship":
        return "orders-status-badge orders-status-badge-shipped";
      case "pending":
      case "processing":
      default:
        return "orders-status-badge orders-status-badge-pending";
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="orders-page orders-loading-state">
        <LoadingSpinner message="Loading your orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-layout">
          <div className="orders-error-state">
            <h2 className="orders-error-state-title">Error Loading Orders</h2>
            <p className="orders-error-state-text">{error}</p>
            <button className="orders-btn-primary" onClick={loadData}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-layout">
        {/* Sidebar */}
        <ProfileSidebar
          firstName={user?.firstName ?? ""}
          lastName={user?.lastName ?? ""}
          role={user?.role ?? ""}
        />

        {/* Main content */}
        <main className="orders-main">
          <div className="orders-header">
            <div className="orders-header-inner">
              <h1 className="orders-header-title">My Orders</h1>
            </div>
            <span className="orders-header-count">
              {orders.length === 0
                ? "No orders yet"
                : `${orders.length} item${orders.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="orders-empty">
              <FaShoppingBag className="orders-empty-icon" />
              <h2 className="orders-empty-title">No Orders Yet</h2>
              <p className="orders-empty-text">
                When you place orders, they will appear here.
              </p>
              <button
                className="orders-btn-primary"
                onClick={() => navigate("/items")}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list-card">
              {orders.map((order) => {
                const isExpanded = expandedOrders.has(order.order_id);
                return (
                  <div key={order.order_id} className="orders-row">
                    {/* Clickable row header — expands/collapses order details */}
                    <div
                      className={`orders-row-header${order.tracking_number ? " orders-row-header-with-tracking" : ""} orders-row-header-clickable`}
                      onClick={() => toggleOrder(order.order_id)}
                      role="button"
                      aria-expanded={isExpanded}
                    >
                      <div className="orders-number-section">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="orders-id-label">
                            {order.order_number}
                          </h3>
                          <p className="orders-date">
                            Placed on {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="orders-row-header-right">
                        <span className={getStatusBadgeClass(order.status)}>
                          {formatStatus(order.status)}
                        </span>
                        <FaChevronDown
                          className={`orders-dropdown-chevron${isExpanded ? " orders-dropdown-chevron-open" : ""}`}
                        />
                      </div>
                    </div>

                    {/* Tracking number row — only shown when a tracking number exists */}
                    {order.tracking_number && (
                      <div className="orders-tracking-row">
                        <span className="orders-info-label">
                          Tracking Number
                        </span>
                        <a
                          href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="orders-tracking-number"
                        >
                          {order.tracking_number}
                        </a>
                      </div>
                    )}

                    {/* Collapsible order details */}
                    <div
                      className={`orders-collapsible${isExpanded ? " orders-collapsible-open" : ""}`}
                    >
                      {/* Info grid */}
                      <div className="orders-row-body">
                        <div className="orders-info-grid">
                          <div className="orders-info-item">
                            <span className="orders-info-label">
                              Total Amount
                            </span>
                            <span className="orders-info-value">
                              ${order.total_price.toFixed(2)}
                            </span>
                          </div>
                          <div className="orders-info-item">
                            <span className="orders-info-label">Items</span>
                            <span className="orders-info-value">
                              {order.item_count || 0} item
                              {order.item_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {order.address_line1 && (
                            <div className="orders-info-item">
                              <span className="orders-info-label">
                                Shipping To
                              </span>
                              <span className="orders-info-value">
                                {order.city}, {order.state}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer — always visible; shows shipping/delivery dates and view details button */}
                    <div className="orders-row-footer">
                      <div className="orders-footer-left">
                        {order.shipped_at && (
                          <div className="orders-shipping-date">
                            <FaTruck />
                            <span>
                              Shipped on {formatDate(order.shipped_at)}
                            </span>
                          </div>
                        )}
                        {order.delivered_at && (
                          <div className="orders-delivery-date">
                            <FaCheckCircle />
                            <span>
                              Delivered on {formatDate(order.delivered_at)}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        className="orders-btn-view-details"
                        onClick={() =>
                          navigate(`/order-confirmation/${order.order_number}`)
                        }
                      >
                        <FaEye /> View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Orders;
