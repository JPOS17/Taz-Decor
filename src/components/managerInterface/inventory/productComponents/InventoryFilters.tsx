import { Filter, X } from "lucide-react";
import { useState } from "react";

interface ManagerFilterBarProps {
  onStatusChange: (status: string | null) => void;
  onStockChange: (stockStatus: string | null) => void;
  onCategoryStatusChange: (categoryStatus: string | null) => void;
  onSortChange: (sortBy: string | null) => void;
  currentStatus: string | null;
  currentStockStatus: string | null;
  currentCategoryStatus: string | null;
  currentSortBy: string | null;
  onClearFilters: () => void;
}

const ManagerFilterBar = ({
  onStatusChange,
  onStockChange,
  onCategoryStatusChange,
  onSortChange,
  currentStatus,
  currentStockStatus,
  currentCategoryStatus,
  currentSortBy,
  onClearFilters,
}: ManagerFilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    currentStatus !== null ||
    currentStockStatus !== null ||
    currentCategoryStatus !== null ||
    currentSortBy !== null;

  const getStatusLabel = () => {
    switch (currentStatus) {
      case "active":
        return "Active Only";
      case "inactive":
        return "Inactive Only";
      default:
        return "All Products";
    }
  };

  const getStockLabel = () => {
    switch (currentStockStatus) {
      case "out-of-stock":
        return "Out of Stock";
      case "low-stock":
        return "Low Stock (≤3)";
      default:
        return "Any Stock Level";
    }
  };

  const getCategoryStatusLabel = () => {
    switch (currentCategoryStatus) {
      case "active":
        return "Active Categories";
      case "inactive":
        return "Inactive Categories";
      case "multiple":
        return "Multiple Categories (2+)";
      default:
        return "All Categories";
    }
  };

  const getSortLabel = () => {
    switch (currentSortBy) {
      case "name-asc":
        return "Name (A-Z)";
      case "name-desc":
        return "Name (Z-A)";
      case "price-asc":
        return "Price (Low-High)";
      case "price-desc":
        return "Price (High-Low)";
      case "stock-asc":
        return "Stock (Low-High)";
      case "stock-desc":
        return "Stock (High-Low)";
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      default:
        return "Default Order";
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            backgroundColor: hasActiveFilters ? "#753a1e" : "white",
            color: hasActiveFilters ? "white" : "#753a1e",
            border: "2px solid #753a1e",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 600,
            transition: "all 0.3s ease",
          }}
        >
          <Filter size={18} />
          Filters{" "}
          {hasActiveFilters &&
            `(${
              [
                currentStatus,
                currentStockStatus,
                currentCategoryStatus,
                currentSortBy,
              ].filter(Boolean).length
            })`}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
              transition: "all 0.3s ease",
            }}
          >
            <X size={18} />
            Clear All
          </button>
        )}
      </div>

      {showFilters && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "white",
            border: "2px solid #753a1e",
            borderRadius: "8px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Product Status Filter */}
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#753a1e",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              Product Status
            </label>
            <div className="dropdown" style={{ width: "100%" }}>
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ width: "100%", textAlign: "left" }}
              >
                {getStatusLabel()}
              </button>
              <ul className="dropdown-menu" style={{ width: "100%" }}>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onStatusChange(null)}
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onStatusChange("active")}
                  >
                    Active Only
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onStatusChange("inactive")}
                  >
                    Inactive Only
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Stock Level Filter */}
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#753a1e",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              Stock Level
            </label>
            <div className="dropdown" style={{ width: "100%" }}>
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ width: "100%", textAlign: "left" }}
              >
                {getStockLabel()}
              </button>
              <ul className="dropdown-menu" style={{ width: "100%" }}>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onStockChange(null)}
                  >
                    Any Stock Level
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onStockChange("out-of-stock")}
                  >
                    Out of Stock (0)
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onStockChange("low-stock")}
                  >
                    Low Stock (≤3)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Category Status Filter */}
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#753a1e",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              Category Status
            </label>
            <div className="dropdown" style={{ width: "100%" }}>
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ width: "100%", textAlign: "left" }}
              >
                {getCategoryStatusLabel()}
              </button>
              <ul className="dropdown-menu" style={{ width: "100%" }}>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onCategoryStatusChange(null)}
                  >
                    All Categories
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onCategoryStatusChange("active")}
                  >
                    Active Categories
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onCategoryStatusChange("inactive")}
                  >
                    Inactive Categories
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onCategoryStatusChange("multiple")}
                  >
                    Multiple Categories (2+)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#753a1e",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              Sort By
            </label>
            <div className="dropdown" style={{ width: "100%" }}>
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ width: "100%", textAlign: "left" }}
              >
                {getSortLabel()}
              </button>
              <ul className="dropdown-menu" style={{ width: "100%" }}>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange(null)}
                  >
                    Default Order
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("name-asc")}
                  >
                    Name (A-Z)
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("name-desc")}
                  >
                    Name (Z-A)
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("price-asc")}
                  >
                    Price (Low-High)
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("price-desc")}
                  >
                    Price (High-Low)
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("stock-asc")}
                  >
                    Stock (Low-High)
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("stock-desc")}
                  >
                    Stock (High-Low)
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("newest")}
                  >
                    Newest First
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => onSortChange("oldest")}
                  >
                    Oldest First
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFilterBar;
