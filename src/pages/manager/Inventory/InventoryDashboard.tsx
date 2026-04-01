import { useNavigate } from "react-router-dom";
import { Folder, Plus, ArrowLeft, Edit, Tag, ArrowRight } from "lucide-react";

import "../../../styles/pages/manager/ManagerShared.css";
import "../../../styles/pages/manager/InventoryDashboard.css";

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

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <button
            className="dashboard-back-button"
            onClick={() => navigate("/manager")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="dashboard-title">Product Management</h1>
          <p className="dashboard-subtitle">
            Select an option to manage your products and categories
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="body">
          <p className="id-section-label">Inventory Dashboard</p>
          <div className="id-grid">
            {directoryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.path}
                  className="id-card"
                  onClick={() => navigate(card.path)}
                >
                  <div className="id-card-top">
                    <div className="id-card-icon">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <ArrowRight size={16} className="id-card-arrow" />
                  </div>
                  <div>
                    <h3 className="id-card-title">{card.title}</h3>
                    <p className="id-card-description">{card.description}</p>
                  </div>
                  <div className="id-card-footer">
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
