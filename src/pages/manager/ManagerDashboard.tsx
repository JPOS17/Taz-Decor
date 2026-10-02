import { Link } from "react-router-dom";
import {
  Package,
  BarChart3,
  Tag,
  Settings,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";

// Each card in the dashboard grid — icon, title, description, route path, color modifier, CTA label
// `badge` is optional small text shown next to the title (e.g. for pages still in progress)
const dashboardCards = [
  {
    title: "Inventory Management",
    description: "Edit products, variants, images, and inventory levels",
    icon: Package,
    path: "/manager/inventory",
    tone: "red",
    cta: "Manage inventory",
  },
  {
    title: "Order Management",
    description: "Manage and update order statuses",
    icon: ShoppingCart,
    path: "/manager/orders",
    tone: "blue",
    cta: "View orders",
  },
  {
    title: "Coupons & Discounts",
    description: "Create and manage discount codes",
    icon: Tag,
    path: "/manager/coupons",
    tone: "yellow",
    cta: "Manage coupons",
  },
  {
    title: "Analytics",
    description: "View sales, revenue, and activity logs",
    icon: BarChart3,
    path: "/manager/analytics",
    tone: "green",
    cta: "View analytics",
    badge: "Coming soon",
  },
  {
    title: "Settings",
    description: "Shipping boxes, categories, and more",
    icon: Settings,
    path: "/manager/settings",
    tone: "grey",
    cta: "Open settings",
  },
];

const ManagerDashboard = () => {
  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-dashboard-page">
      {/* Header */}
      <header className="manager-dashboard-header">
        <div className="manager-dashboard-container">
          <p className="manager-dashboard-eyebrow">Taz Decor's Catholic Shop</p>
          <h1 className="manager-dashboard-title">Manager Dashboard</h1>
          <p className="manager-dashboard-subtitle">
            Choose an area to manage your store.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="manager-dashboard-container manager-dashboard-main">
        <h2 className="manager-dashboard-section-label">Management areas</h2>

        {/* Navigation card grid — each card is a real link, so it works with
            keyboard, middle-click and screen readers */}
        <div className="manager-dashboard-grid">
          {dashboardCards.map(({ icon: Icon, ...card }) => (
            <Link
              key={card.path}
              to={card.path}
              className={`manager-dashboard-card manager-dashboard-card--${card.tone}`}
            >
              <div className="manager-dashboard-card-top">
                {/* Color-coded section icon */}
                <span className="manager-dashboard-card-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                {card.badge && (
                  <span className="manager-dashboard-card-badge">{card.badge}</span>
                )}
              </div>

              <div className="manager-dashboard-card-body">
                <h3 className="manager-dashboard-card-title">{card.title}</h3>
                <p className="manager-dashboard-card-description">{card.description}</p>
              </div>

              {/* CTA footer with arrow */}
              <div className="manager-dashboard-card-footer">
                <span>{card.cta}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;