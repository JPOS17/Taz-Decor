import { useNavigate } from "react-router-dom";
import { Folder, Plus, ArrowLeft, Edit, Tag } from "lucide-react";

import "../../../styles/pages/manager/InventoryDashboard.css";

const ProductManagementDirectory = () => {
  const navigate = useNavigate();

  const directoryCards = [
    {
      title: "Edit Products",
      description: "Manage existing products, variants, images, and inventory",
      icon: Edit,
      path: "/manager/inventory/edit",
      color: "#753a1e",
    },
    {
      title: "Create New Product",
      description: "Add a new product to your catalog with variants",
      icon: Plus,
      path: "/manager/inventory/create",
      color: "#753a1e",
    },
    {
      title: "Manage Categories",
      description: "Create, edit, and organize product categories",
      icon: Folder,
      path: "/manager/inventory/categories",
      color: "#753a1e",
    },
    {
      title: "Manage Product Types",
      description: "Create and manage product types and SKU prefixes",
      icon: Tag,
      path: "/manager/inventory/types",
      color: "#753a1e",
    },
  ];

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <button
            onClick={() => navigate("/manager")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              marginBottom: "0.5rem",
              padding: "0.5rem",
            }}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="dashboard-title">Product Management</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Select an option to manage your products and categories
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
          {directoryCards.map((card) => {
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

export default ProductManagementDirectory;
