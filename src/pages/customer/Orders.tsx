import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaShoppingBag, FaTruck, FaCheckCircle, FaEye } from "react-icons/fa";
import {
  fetchUserOrders,
  fetchUserProfile,
  type Order,
} from "../../api/checkout";

import LoadingSpinner from "../../components/universalComponents/LoadingSpinner";
import ProfileSidebar from "../../components/universalComponents/ProfileSideBar";

import "../../styles/pages/customer/Orders.css";

// ============================================================================
// ORDERS COMPONENT
// ============================================================================

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Order data
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<{
    first_name: string;
    last_name: string;
    role: string;
  } | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, profileData] = await Promise.all([
        fetchUserOrders(),
        fetchUserProfile(),
      ]);
      setOrders(ordersData);
      setUserProfile({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name,
        role: profileData.user.role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <FaCheckCircle className="status-icon status-delivered" />;
      case "shipped":
      case "ready_to_ship":
        return <FaTruck className="status-icon status-shipped" />;
      case "processing":
      case "pending":
      default:
        return <FaShoppingBag className="status-icon status-pending" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "status-badge status-delivered";
      case "shipped":
      case "ready_to_ship":
        return "status-badge status-shipped";
      case "pending":
      case "processing":
      default:
        return "status-badge status-pending";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
        <div className="orders-container">
          <div className="error-state">
            <h2>Error Loading Orders</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadData}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="orders-page">
      <div className="orders-layout">
        {/* Sidebar */}
        <ProfileSidebar
          firstName={userProfile.first_name}
          lastName={userProfile.last_name}
          role={userProfile.role}
        />

        {/* Main Content */}
        <main className="orders-main">
          <div className="orders-header">
            <h1>My Orders</h1>
            <p className="orders-subtitle">
              {orders.length === 0
                ? "You haven't placed any orders yet"
                : `${orders.length} order${orders.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="empty-orders">
              <FaShoppingBag className="empty-icon" />
              <h2>No Orders Yet</h2>
              <p>When you place orders, they will appear here.</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/items")}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.order_id} className="order-card">
                  <div className="order-header">
                    <div className="order-number-section">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="order-id-label">{order.order_number}</h3>
                        <p className="order-date">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className={getStatusClass(order.status)}>
                      {formatStatus(order.status)}
                    </span>
                  </div>

                  <div className="order-body">
                    <div className="order-info-grid">
                      <div className="info-item">
                        <span className="info-label">Total Amount</span>
                        <span className="info-value">
                          ${order.total_price.toFixed(2)}
                        </span>
                      </div>

                      <div className="info-item">
                        <span className="info-label">Items</span>
                        <span className="info-value">
                          {order.item_count || 0} item
                          {order.item_count !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {order.tracking_number && (
                        <div className="info-item">
                          <span className="info-label">Tracking Number</span>
                          <span className="info-value tracking-number">
                            {order.tracking_number}
                          </span>
                        </div>
                      )}

                      {order.address_line1 && (
                        <div className="info-item">
                          <span className="info-label">Shipping To</span>
                          <span className="info-value">
                            {order.city}, {order.state}
                          </span>
                        </div>
                      )}
                    </div>

                    {order.shipped_at && (
                      <div className="shipping-date">
                        <FaTruck />
                        <span>Shipped on {formatDate(order.shipped_at)}</span>
                      </div>
                    )}

                    {order.delivered_at && (
                      <div className="delivery-date">
                        <FaCheckCircle />
                        <span>
                          Delivered on {formatDate(order.delivered_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="order-footer">
                    <button
                      className="btn-view-details"
                      onClick={() =>
                        navigate(`/order-confirmation/${order.order_number}`)
                      }
                    >
                      <FaEye /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Orders;
