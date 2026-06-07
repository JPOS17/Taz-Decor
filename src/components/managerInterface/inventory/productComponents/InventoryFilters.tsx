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

// Collapsible filter bar for the manager inventory list
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

  const activeFilterCount = [
    currentStatus,
    currentStockStatus,
    currentCategoryStatus,
    currentSortBy,
  ].filter(Boolean).length;

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Returns the display label for the current product status filter value
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

  // Returns the display label for the current stock level filter value
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

  // Returns the display label for the current category status filter value
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

  // Returns the display label for the current sort order value
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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Filter toggle bar */}
      <div className="mi-filter-bar">
        <button
          className={`mi-filter-toggle ${hasActiveFilters ? "mi-filter-toggle--active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters{hasActiveFilters ? ` (${activeFilterCount})` : ""}
        </button>

        {/* Clear All */}
        {hasActiveFilters && (
          <button className="mi-filter-clear" onClick={onClearFilters}>
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <div className="mi-filter-panel">
          {/* Product Status */}
          <div className="mi-filter-group">
            <span className="mi-filter-group-label">Product Status</span>
            <div className="dropdown">
              <button
                className="mi-filter-dropdown-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {getStatusLabel()}
              </button>
              <ul className="dropdown-menu">
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

          {/* Stock Level */}
          <div className="mi-filter-group">
            <span className="mi-filter-group-label">Stock Level</span>
            <div className="dropdown">
              <button
                className="mi-filter-dropdown-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {getStockLabel()}
              </button>
              <ul className="dropdown-menu">
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

          {/* Category Status */}
          <div className="mi-filter-group">
            <span className="mi-filter-group-label">Category Status</span>
            <div className="dropdown">
              <button
                className="mi-filter-dropdown-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {getCategoryStatusLabel()}
              </button>
              <ul className="dropdown-menu">
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

          {/* Sort By */}
          <div className="mi-filter-group">
            <span className="mi-filter-group-label">Sort By</span>
            <div className="dropdown">
              <button
                className="mi-filter-dropdown-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {getSortLabel()}
              </button>
              <ul className="dropdown-menu">
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
