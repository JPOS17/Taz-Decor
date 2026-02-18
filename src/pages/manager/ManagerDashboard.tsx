import { useNavigate } from "react-router-dom";
import {
  Package,
  BarChart3,
  MapPin,
  Tag,
  Settings,
  ShoppingCart,
} from "lucide-react";

import "../../styles/pages/manager/InventoryDashboard.css";

const ManagerDashboard = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: "Inventory Management",
      description: "Edit products, variants, images, and inventory",
      icon: Package,
      path: "/manager/inventory",
      color: "#753a1e",
    },
    {
      title: "Analytics",
      description: "View sales, revenue, and activity logs",
      icon: BarChart3,
      path: "/manager/analytics",
      color: "#28a745",
    },
    {
      title: "Order Management",
      description: "Manage and update order statuses",
      icon: ShoppingCart,
      path: "/manager/orders",
      color: "#0d6efd",
    },
    {
      title: "Coupons & Discounts",
      description: "Create and manage discount codes",
      icon: Tag,
      path: "/manager/coupons",
      color: "#ffc107",
    },
    {
      title: "Settings",
      description: "Shipping boxes, categories, and more",
      icon: Settings,
      path: "/manager/settings",
      color: "#6c757d",
    },
  ];

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1 className="dashboard-title">Manager Dashboard</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Select a management area to get started
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "2rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  border: `3px solid ${card.color}`,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0, 0, 0, 0.1)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: card.color,
                      borderRadius: "50%",
                      width: "60px",
                      height: "60px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "1rem",
                    }}
                  >
                    <Icon size={32} color="white" />
                  </div>
                  <h3
                    style={{ margin: 0, color: card.color, fontSize: "1.5rem" }}
                  >
                    {card.title}
                  </h3>
                </div>
                <p style={{ margin: 0, color: "#6c757d", lineHeight: 1.5 }}>
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
