import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaCheckCircle, FaShoppingBag, FaPrint, FaHome } from "react-icons/fa";
import {
  fetchUserProfile,
  fetchOrderByNumber,
  type OrderDetails,
} from "../../api/checkout";

import DeliveryEstimate from "../../components/customerInterface/checkout/DeliveryEstimate";

import LoadingSpinner from "../../components/universalComponents/LoadingSpinner";
import ProfileSidebar from "../../components/universalComponents/ProfileSideBar";

import "../../styles/pages/customer/OrderConfirmation.css";

// ============================================================================
// COMPONENT
// ============================================================================

const OrderConfirmation = () => {
  // ============================================================================
  // HOOKS & ROUTING
  // ============================================================================

  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================================
  // STATE
  // ============================================================================

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [userProfile, setUserProfile] = useState<{
    first_name: string;
    last_name: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (orderNumber) {
      loadData();
    }
  }, [orderNumber]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      // If no token, redirect to login with return URL
      if (!token) {
        const returnUrl = location.pathname;
        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
          state: {
            message: "Please log in to view your order confirmation",
          },
        });
        return;
      }

      // Fetch order and profile data using proper API functions
      const [orderData, profileData] = await Promise.all([
        fetchOrderByNumber(orderNumber!),
        fetchUserProfile(),
      ]);

      setOrder(orderData);
      setUserProfile({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name,
        role: profileData.user.role,
      });
      setLoading(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        localStorage.removeItem("token");
        const returnUrl = location.pathname;
        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
          state: {
            message:
              "Your session has expired. Please log in again to view your order.",
          },
        });
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to load order");
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handlePrint = () => {
    window.print();
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // ============================================================================
  // RENDER LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="profile-page order-loading-state">
        <LoadingSpinner message="Loading your order..." />
      </div>
    );
  }

  // ============================================================================
  // RENDER ERROR STATE
  // ============================================================================

  if (error || !order || !userProfile) {
    return (
      <div className="order-confirmation-page">
        <div className="confirmation-layout">
          <div className="error-state">
            <h2>Order Not Found</h2>
            <p>{error || "Unable to find order details"}</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER MAIN CONTENT
  // ============================================================================

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-layout">
        {/* Sidebar */}
        <ProfileSidebar
          firstName={userProfile.first_name}
          lastName={userProfile.last_name}
          role={userProfile.role}
        />

        {/* Main Content */}
        <main className="confirmation-main">
          <div className="confirmation-container">
            {/* Success Header */}
            <div className="confirmation-header">
              <div className="success-icon">
                <FaCheckCircle />
              </div>
              <h1>Order Confirmed!</h1>
              <p className="confirmation-message">
                Thank you for your order. We've sent a confirmation email to
                your inbox.
              </p>
              <div className="order-number-display">
                <span className="label">Order Number:</span>
                <span className="number">{orderNumber}</span>
              </div>
            </div>

            {/* Order Details */}
            <div className="oc-details-section">
              <div className="details-grid">
                {/* Shipping Address */}
                <div className="detail-card">
                  <h3>Shipping Address</h3>
                  <div className="address-info">
                    <p>
                      <strong>
                        {order.first_name} {order.last_name}
                      </strong>
                    </p>
                    <p>{order.address_line1}</p>
                    {order.address_line2 && <p>{order.address_line2}</p>}
                    <p>
                      {order.city}, {order.state} {order.zip}
                    </p>
                    {order.country && <p>{order.country}</p>}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="detail-card">
                  <h3>Order Summary</h3>
                  <div className="summary-info">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="summary-row discount">
                        <span>Discount:</span>
                        <span>-${order.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>
                        {order.shipping_cost === 0
                          ? "FREE"
                          : `$${order.shipping_cost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span>Tax:</span>
                      <span>${order.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row total">
                      <strong>Total:</strong>
                      <strong>${order.total_price.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="detail-card">
                  <h3>Delivery Information</h3>
                  <div className="delivery-info">
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="status-badge">
                        {formatStatus(order.status)}
                      </span>
                    </p>
                    {order.shipping_service && (
                      <DeliveryEstimate
                        shippingMethodName={order.shipping_service}
                        orderDate={new Date(order.created_at)}
                      />
                    )}
                    {order.tracking_number && (
                      <p>
                        <strong>Tracking Number:</strong>{" "}
                        {order.tracking_number}
                      </p>
                    )}
                    {order.box_name && (
                      <p>
                        <strong>Shipping Box:</strong> {order.box_name}
                      </p>
                    )}
                    <p className="info-note">
                      We'll send you an email with tracking information once
                      your order ships.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="oc-items-section">
              <h3>Order Items</h3>
              <div className="items-list">
                {order.items.map((item) => (
                  <div key={item.order_item_id} className="order-item">
                    <img
                      src={item.img_url || "/placeholder-image.png"}
                      alt={item.product_name}
                      className="item-image"
                    />
                    <div className="item-details">
                      <h4>{item.product_name}</h4>
                      {item.variant_details && (
                        <p className="variant-info">{item.variant_details}</p>
                      )}
                      <p className="quantity">Quantity: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      <span>
                        ${(item.price_at_purchase * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="confirmation-actions">
              <button className="btn-secondary" onClick={handlePrint}>
                <FaPrint /> Print Receipt
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/orders")}
              >
                <FaShoppingBag /> View All Orders
              </button>
              <button className="btn-outline" onClick={() => navigate("/")}>
                <FaHome /> Continue Shopping
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderConfirmation;
