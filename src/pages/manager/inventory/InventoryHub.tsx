import { Link } from "react-router-dom";
import { Folder, Plus, ArrowLeft, Edit, Tag, ArrowRight } from "lucide-react";

// Each card in the directory grid — icon, title, description, path, and CTA label
const directoryCards = [
  {
    title: "Edit Products",
    description: "Manage existing products, variants, images, and inventory",
    icon: Edit,
    path: "/manager/inventory/edit",
    cta: "Edit products",
  },
  {
    title: "Create New Product",
    description: "Add a new product to your catalog with variants",
    icon: Plus,
    path: "/manager/inventory/create",
    cta: "Create product",
  },
  {
    title: "Manage Categories",
    description: "Create, edit, and organize product categories",
    icon: Folder,
    path: "/manager/inventory/categories",
    cta: "Manage categories",
  },
  {
    title: "Manage Product Types",
    description: "Create and manage product types and SKU prefixes",
    icon: Tag,
    path: "/manager/inventory/types",
    cta: "Manage types",
  },
];

const InventoryHub = () => {
  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="inventory-hub-page">
      {/* Header */}
      <header className="inventory-hub-header">
        <div className="inventory-hub-container">
          <Link to="/manager" className="inventory-hub-back-link">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <p className="inventory-hub-eyebrow">Inventory</p>
          <h1 className="inventory-hub-title">Product Management</h1>
          <p className="inventory-hub-subtitle">
            Select an option to manage your products and categories.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="inventory-hub-container inventory-hub-main">
        <h2 className="inventory-hub-section-label">Inventory actions</h2>

        {/* Navigation card grid — each card is a real link, so it works with
            keyboard, middle-click and screen readers */}
        <div className="inventory-hub-grid">
          {directoryCards.map(({ icon: Icon, ...card }) => (
            <Link key={card.path} to={card.path} className="inventory-hub-card">
              <span className="inventory-hub-card-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.9} />
              </span>

              <div className="inventory-hub-card-body">
                <h3 className="inventory-hub-card-title">{card.title}</h3>
                <p className="inventory-hub-card-description">
                  {card.description}
                </p>
              </div>

              {/* CTA footer with arrow */}
              <div className="inventory-hub-card-footer">
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

export default InventoryHub;