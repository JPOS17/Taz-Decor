import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaShoppingBag, FaPrint, FaHome } from "react-icons/fa";
import { fetchOrderByNumber, type OrderDetails } from "../../../api/orders";
import { fetchUserProfile } from "../../../api/user";

import DeliveryEstimate from "../../../components/customerInterface/checkout/DeliveryEstimate";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/customer/OrderConfirmation.css";

const OrderConfirmation = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [userProfile, setUserProfile] = useState<{
    first_name: string;
    last_name: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderNumber) {
      loadData();
    }
  }, [orderNumber]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        const returnUrl = location.pathname;
        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
          state: {
            message: "Please log in to view your order confirmation",
          },
        });
        return;
      }

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

  const handlePrint = () => {
    window.print();
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="order-confirm-loading">
        <LoadingSpinner message="Loading your order..." />
      </div>
    );
  }

  if (error || !order || !userProfile) {
    return (
      <div className="order-confirm-page">
        <div className="order-confirm-error">
          <h2>Order Not Found</h2>
          <p>{error || "Unable to find order details"}</p>
          <button
            className="order-confirm-btn-primary"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirm-page">
      <main className="order-confirm-main">
        {/* Back to Orders */}
        <div className="order-confirm-back-nav">
          <button
            className="order-confirm-back-link"
            onClick={() => navigate("/orders")}
          >
            <FaArrowLeft /> Back to Orders
          </button>
        </div>

        <div className="order-confirm-container">
          {/* Success Header */}
          <div className="order-confirm-header">
            <h1>Order Confirmed!</h1>
            <p className="order-confirm-message">
              Thank you for your order. We've sent a confirmation email to your
              inbox.
            </p>
            <div className="order-confirm-number-display">
              <span className="label">Order Number:</span>
              <span className="number">{orderNumber}</span>
            </div>
          </div>

          {/* Order Details */}
          <div className="order-confirm-details-section">
            <div className="order-confirm-details-grid">
              {/* Shipping Address */}
              <div className="order-confirm-detail-card">
                <h3>Shipping Address</h3>
                <div className="order-confirm-address-info">
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

              {/* Delivery Info */}
              <div className="order-confirm-detail-card">
                <h3>Delivery Information</h3>
                <div className="order-confirm-delivery-info">
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="order-confirm-status-badge">
                      {formatStatus(order.status)}
                    </span>
                  </p>
                  {order.shipping_service && (
                    <DeliveryEstimate
                      shippingMethodName={order.shipping_service}
                      orderDate={new Date(order.created_at)}
                      className="order-confirm-delivery-estimate-override"
                    />
                  )}
                  {order.tracking_number && (
                    <p>
                      <strong>Tracking Number:</strong> {order.tracking_number}
                    </p>
                  )}
                  <p className="order-confirm-info-note">
                    We'll send you an email with tracking information once your
                    order ships.
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="order-confirm-detail-card">
                <h3>Order Summary</h3>
                <div className="order-confirm-summary-info">
                  <div className="order-confirm-summary-row">
                    <span>Subtotal:</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="order-confirm-summary-row order-confirm-discount">
                      <span>Discount:</span>
                      <span>-${order.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="order-confirm-summary-row">
                    <span>Shipping:</span>
                    <span>
                      {order.shipping_cost === 0
                        ? "FREE"
                        : `$${order.shipping_cost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="order-confirm-summary-row">
                    <span>Tax:</span>
                    <span>${order.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="order-confirm-summary-divider"></div>
                  <div className="order-confirm-summary-row order-confirm-total">
                    <strong>Total:</strong>
                    <strong>${order.total_price.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-confirm-items-section">
            <h3>Order Items</h3>
            <div className="order-confirm-items-list">
              {order.items.map((item) => (
                <div key={item.order_item_id} className="order-confirm-item">
                  <img
                    src={item.img_url || "/placeholder-image.png"}
                    alt={item.product_name}
                    className="order-confirm-item-image"
                  />
                  <div className="order-confirm-item-details">
                    <h4>{item.product_name}</h4>
                    {item.variant_details && (
                      <p className="order-confirm-variant-info">
                        {item.variant_details}
                      </p>
                    )}
                    <p className="order-confirm-quantity">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="order-confirm-item-price">
                    <span>
                      ${(item.price_at_purchase * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="order-confirm-actions">
            <button
              className="order-confirm-btn-secondary"
              onClick={handlePrint}
            >
              <FaPrint /> Print Receipt
            </button>
            <button
              className="order-confirm-btn-primary"
              onClick={() => navigate("/orders")}
            >
              <FaShoppingBag /> View All Orders
            </button>
            <button
              className="order-confirm-btn-outline"
              onClick={() => navigate("/items")}
            >
              <FaHome /> Continue Shopping
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;
