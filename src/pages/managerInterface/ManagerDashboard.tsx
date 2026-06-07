import { useNavigate } from "react-router-dom";
import {
  Package,
  BarChart3,
  Tag,
  Settings,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";

import "../../styles/pages/managerInterface/Tokens.css";
import "../../styles/pages/managerInterface/Components.css";

// Each card in the dashboard grid — icon, title, description, route path, accent class, and CTA label
const dashboardCards = [
  {
    title: "Inventory Management",
    description: "Edit products, variants, images, and inventory levels",
    icon: Package,
    path: "/manager/inventory",
    accentClass: "accent-inventory",
    cta: "Manage inventory",
  },
  {
    title: "Analytics",
    description: "View sales, revenue, and activity logs",
    icon: BarChart3,
    path: "/manager/analytics",
    accentClass: "accent-analytics",
    cta: "View analytics",
  },
  {
    title: "Order Management",
    description: "Manage and update order statuses",
    icon: ShoppingCart,
    path: "/manager/orders",
    accentClass: "accent-orders",
    cta: "View orders",
  },
  {
    title: "Coupons & Discounts",
    description: "Create and manage discount codes",
    icon: Tag,
    path: "/manager/coupons",
    accentClass: "accent-coupons",
    cta: "Manage coupons",
  },
  {
    title: "Settings",
    description: "Shipping boxes, categories, and more",
    icon: Settings,
    path: "/manager/settings",
    accentClass: "accent-settings",
    cta: "Open settings",
  },
];

const ManagerDashboard = () => {
  const navigate = useNavigate();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-page">
      {/* Header */}
      <header className="mgr-header">
        <div className="mgr-header-inner">
          <div>
            <p className="mgr-header-label">Taz Decor's Catholic Shop</p>
            <h1 className="mgr-header-title">Manager Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mgr-container">
        <div className="mgr-body">
          <p className="mgr-section-label">Management Areas</p>

          {/* Navigation card grid */}
          <div className="mgr-grid">
            {dashboardCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.path}
                  className={`mgr-card ${card.accentClass}`}
                  onClick={() => navigate(card.path)}
                >
                  <div className="mgr-card-top">
                    {/* Accent-colored section icon */}
                    <div className="mgr-card-icon">
                      <Icon
                        size={20}
                        strokeWidth={2}
                        style={{ color: "var(--accent)" }}
                      />
                    </div>
                    <ArrowRight size={16} className="mgr-card-arrow" />
                  </div>
                  <div>
                    <h3 className="mgr-card-title">{card.title}</h3>
                    <p className="mgr-card-description">{card.description}</p>
                  </div>
                  {/* CTA footer with inline arrow */}
                  <div className="mgr-card-footer">
                    <span>{card.cta}</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
