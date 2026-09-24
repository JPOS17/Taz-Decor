import { Filter, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

type DropdownKey = "status" | "stock" | "category" | "sort" | null;

interface DropdownOption {
  label: string;
  onSelect: () => void;
  dividerBefore?: boolean;
}

// A single custom dropdown, replacing Bootstrap's data-bs-toggle="dropdown" component
const FilterDropdown = ({
  isOpen,
  onToggle,
  onClose,
  label,
  options,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  label: string;
  options: DropdownOption[];
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the dropdown, or on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div className="mi-dropdown" ref={wrapperRef}>
      <button
        className={`mi-filter-dropdown-btn mi-dropdown-toggle${isOpen ? " mi-dropdown-toggle--open" : ""}`}
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{label}</span>
        <ChevronDown size={14} className="mi-dropdown-chevron" />
      </button>
      {isOpen && (
        <ul className="mi-dropdown-menu">
          {options.map((option, index) => (
            <li key={index}>
              {option.dividerBefore && <hr className="mi-dropdown-divider" />}
              <button
                className="mi-dropdown-item"
                onClick={() => {
                  option.onSelect();
                  onClose();
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);

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

  const toggleDropdown = (key: DropdownKey) =>
    setOpenDropdown((prev) => (prev === key ? null : key));
  const closeDropdown = () => setOpenDropdown(null);

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
            <FilterDropdown
              isOpen={openDropdown === "status"}
              onToggle={() => toggleDropdown("status")}
              onClose={closeDropdown}
              label={getStatusLabel()}
              options={[
                { label: "All Products", onSelect: () => onStatusChange(null) },
                {
                  label: "Active Only",
                  onSelect: () => onStatusChange("active"),
                  dividerBefore: true,
                },
                {
                  label: "Inactive Only",
                  onSelect: () => onStatusChange("inactive"),
                },
              ]}
            />
          </div>

          {/* Stock Level */}
          <div className="mi-filter-group">
            <span className="mi-filter-group-label">Stock Level</span>
            <FilterDropdown
              isOpen={openDropdown === "stock"}
              onToggle={() => toggleDropdown("stock")}
              onClose={closeDropdown}
              label={getStockLabel()}
              options={[
                {
                  label: "Any Stock Level",
                  onSelect: () => onStockChange(null),
                },
                {
                  label: "Out of Stock (0)",
                  onSelect: () => onStockChange("out-of-stock"),
                  dividerBefore: true,
                },
                {
                  label: "Low Stock (≤3)",
                  onSelect: () => onStockChange("low-stock"),
                },
              ]}
            />
          </div>

          {/* Category Status */}
          <div className="mi-filter-group">
            <span className="mi-filter-group-label">Category Status</span>
            <FilterDropdown
              isOpen={openDropdown === "category"}
              onToggle={() => toggleDropdown("category")}
              onClose={closeDropdown}
              label={getCategoryStatusLabel()}
              options={[
                {
                  label: "All Categories",
                  onSelect: () => onCategoryStatusChange(null),
                },
                {
                  label: "Active Categories",
                  onSelect: () => onCategoryStatusChange("active"),
                  dividerBefore: true,
                },
                {
                  label: "Inactive Categories",
                  onSelect: () => onCategoryStatusChange("inactive"),
                },
                {
                  label: "Multiple Categories (2+)",
                  onSelect: () => onCategoryStatusChange("multiple"),
                  dividerBefore: true,
                },
              ]}
            />
          </div>

          {/* Sort By */}
          <div className="mi-filter-group">
            <span className="mi-filter-group-label">Sort By</span>
            <FilterDropdown
              isOpen={openDropdown === "sort"}
              onToggle={() => toggleDropdown("sort")}
              onClose={closeDropdown}
              label={getSortLabel()}
              options={[
                { label: "Default Order", onSelect: () => onSortChange(null) },
                {
                  label: "Name (A-Z)",
                  onSelect: () => onSortChange("name-asc"),
                  dividerBefore: true,
                },
                {
                  label: "Name (Z-A)",
                  onSelect: () => onSortChange("name-desc"),
                },
                {
                  label: "Price (Low-High)",
                  onSelect: () => onSortChange("price-asc"),
                  dividerBefore: true,
                },
                {
                  label: "Price (High-Low)",
                  onSelect: () => onSortChange("price-desc"),
                },
                {
                  label: "Stock (Low-High)",
                  onSelect: () => onSortChange("stock-asc"),
                  dividerBefore: true,
                },
                {
                  label: "Stock (High-Low)",
                  onSelect: () => onSortChange("stock-desc"),
                },
                {
                  label: "Newest First",
                  onSelect: () => onSortChange("newest"),
                  dividerBefore: true,
                },
                {
                  label: "Oldest First",
                  onSelect: () => onSortChange("oldest"),
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFilterBar;
