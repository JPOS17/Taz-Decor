import { useNavigate } from "react-router-dom";
import {
  Package,
  BarChart3,
  Tag,
  Settings,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";

import "../../styles/pages/manager/ManagerDashboard.css";

const dashboardCards = [
  {
    title: "Inventory Management",
    description: "Edit products, variants, images, and inventory levels",
    icon: Package,
    path: "/manager/inventory",
    accent: "#c2410c",
    iconBg: "#fff7ed",
    cta: "Manage inventory",
  },
  {
    title: "Analytics",
    description: "View sales, revenue, and activity logs",
    icon: BarChart3,
    path: "/manager/analytics",
    accent: "#16a34a",
    iconBg: "#f0fdf4",
    cta: "View analytics",
  },
  {
    title: "Order Management",
    description: "Manage and update order statuses",
    icon: ShoppingCart,
    path: "/manager/orders",
    accent: "#1d4ed8",
    iconBg: "#eff6ff",
    cta: "View orders",
  },
  {
    title: "Coupons & Discounts",
    description: "Create and manage discount codes",
    icon: Tag,
    path: "/manager/coupons",
    accent: "#b45309",
    iconBg: "#fffbeb",
    cta: "Manage coupons",
  },
  {
    title: "Settings",
    description: "Shipping boxes, categories, and more",
    icon: Settings,
    path: "/manager/settings",
    accent: "#4b5563",
    iconBg: "#f9fafb",
    cta: "Open settings",
  },
];

const ManagerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="md-page">
      <header className="md-header">
        <div className="md-header-inner">
          <div>
            <p className="md-header-label">Taz Decor's Catholic Shop</p>
            <h1 className="md-header-title">Manager Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="md-body">
        <p className="md-section-label">Management Areas</p>
        <div className="md-grid">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.path}
                className="md-card"
                style={
                  {
                    "--md-card-accent": card.accent,
                    "--md-card-icon-bg": card.iconBg,
                  } as React.CSSProperties
                }
                onClick={() => navigate(card.path)}
              >
                <div className="md-card-top">
                  <div className="md-card-icon">
                    <Icon size={20} color={card.accent} strokeWidth={2} />
                  </div>
                  <ArrowRight size={16} className="md-card-arrow" />
                </div>
                <div>
                  <h3 className="md-card-title">{card.title}</h3>
                  <p className="md-card-description">{card.description}</p>
                </div>
                <div className="md-card-footer">
                  <span>{card.cta}</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
