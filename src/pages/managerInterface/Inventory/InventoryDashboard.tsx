import { useNavigate } from "react-router-dom";
import { Folder, Plus, ArrowLeft, Edit, Tag, ArrowRight } from "lucide-react";

import "../../../styles/pages/managerInterface/Tokens.css";
import "../../../styles/pages/managerInterface/Components.css";

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

const ProductManagementDirectory = () => {
  const navigate = useNavigate();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-page accent-inventory">
      {/* Header */}
      <div className="mgr-header">
        <div className="mgr-header-inner">
          <div>
            <button
              className="mgr-back-button"
              onClick={() => navigate("/manager")}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            <h1 className="mgr-header-title">Product Management</h1>
            <p className="mgr-header-subtitle">
              Select an option to manage your products and categories
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mgr-container">
        <div className="mgr-body">
          <p className="mgr-section-label">Inventory Dashboard</p>

          {/* Navigation card grid — each card routes to a management sub-page */}
          <div className="mgr-grid">
            {directoryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.path}
                  className="mgr-card"
                  onClick={() => navigate(card.path)}
                >
                  <div className="mgr-card-top">
                    <div className="mgr-card-icon">
                      <Icon size={20} strokeWidth={2} />
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

export default ProductManagementDirectory;
