import { useState, useEffect } from "react";
import { type Category } from "../../../api/categories";
import "../../../styles/components/customerInterface/items/SideBar.css";

interface SideBarProps {
  activeCategoryId: number | null;
  onSelectCategory: (categoryId: number | null, categoryName: string) => void;
  categories: Category[];
  // Filter props
  currentMinPrice: number | null;
  currentMaxPrice: number | null;
  currentSortBy: string | null;
  currentOnSaleOnly: boolean;
  onPriceChange: (min: number | null, max: number | null) => void;
  onSortChange: (sort: string | null) => void;
  onSaleFilterChange: (onSale: boolean) => void;
  onReset: () => void;
}

const PRICE_OPTIONS = [
  { label: "Any price", min: null, max: null },
  { label: "Under $25", min: null, max: 25 },
  { label: "$25 – $75", min: 25, max: 75 },
  { label: "$75 – $100", min: 75, max: 100 },
  { label: "Over $100", min: 100, max: null },
];

const SORT_OPTIONS = [
  { label: "Default", value: null },
  { label: "A to Z", value: "name-asc" },
  { label: "Z to A", value: "name-desc" },
  { label: "Lowest to Highest", value: "price-asc" },
  { label: "Highest to Lowest", value: "price-desc" },
];

const SideBar = ({
  activeCategoryId,
  onSelectCategory,
  categories,
  currentMinPrice,
  currentMaxPrice,
  currentSortBy,
  currentOnSaleOnly,
  onPriceChange,
  onSortChange,
  onSaleFilterChange,
  onReset,
}: SideBarProps) => {
  const [priceOpen, setPriceOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPriceActive = currentMinPrice !== null || currentMaxPrice !== null;
  const hasActiveFilters =
    isPriceActive || !!currentSortBy || currentOnSaleOnly;

  const matchesPrice = (min: number | null, max: number | null) =>
    min === currentMinPrice && max === currentMaxPrice;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSelectCategory = (id: number | null, name: string) => {
    onSelectCategory(id, name);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <nav className="sidebar">
      {/* FILTERS */}
      <div className="sidebar-filters">
        {/* Price */}
        <div className="sidebar-filter-section">
          <button
            className="sidebar-filter-heading"
            onClick={() => setPriceOpen((o) => !o)}
          >
            <span>
              Price
              {isPriceActive && <span className="sidebar-filter-dot" />}
            </span>
            <span
              className={`sidebar-filter-chevron ${priceOpen ? "open" : ""}`}
            >
              ▼
            </span>
          </button>
          {priceOpen && (
            <ul className="sidebar-filter-options">
              {PRICE_OPTIONS.map((opt) => (
                <li key={opt.label}>
                  <button
                    className={`sidebar-filter-option ${matchesPrice(opt.min, opt.max) ? "active" : ""}`}
                    onClick={() => onPriceChange(opt.min, opt.max)}
                  >
                    <span className="sidebar-filter-radio" />
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sort */}
        <div className="sidebar-filter-section">
          <button
            className="sidebar-filter-heading"
            onClick={() => setSortOpen((o) => !o)}
          >
            <span>
              Sort By
              {currentSortBy && <span className="sidebar-filter-dot" />}
            </span>
            <span
              className={`sidebar-filter-chevron ${sortOpen ? "open" : ""}`}
            >
              ▼
            </span>
          </button>
          {sortOpen && (
            <ul className="sidebar-filter-options">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.label}>
                  <button
                    className={`sidebar-filter-option ${currentSortBy === opt.value ? "active" : ""}`}
                    onClick={() => onSortChange(opt.value)}
                  >
                    <span className="sidebar-filter-radio" />
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sale toggle */}
        <button
          className={`sidebar-sale-btn ${currentOnSaleOnly ? "active" : ""}`}
          onClick={() => onSaleFilterChange(!currentOnSaleOnly)}
        >
          <span className="sidebar-sale-check" />
          On Sale Only
        </button>

        {/* Reset filters */}
        {hasActiveFilters && (
          <button className="sidebar-reset-btn" onClick={onReset}>
            Reset Filters
          </button>
        )}
      </div>

      {/* DIVIDER */}
      <div className="sidebar-divider" />

      {/* CATEGORIES */}
      <ul className="sidebar-nav">
        <li className="sidebar-nav-item">
          <button
            className={`sidebar-nav-link ${activeCategoryId === null ? "active" : ""}`}
            onClick={() => handleSelectCategory(null, "All")}
          >
            <span className="sidebar-link-text">All</span>
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.category_id} className="sidebar-nav-item">
            <button
              className={`sidebar-nav-link ${
                activeCategoryId === category.category_id ? "active" : ""
              }`}
              onClick={() =>
                handleSelectCategory(
                  category.category_id,
                  category.category_name,
                )
              }
            >
              <span className="sidebar-link-text">
                {category.category_name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* DESKTOP: normal sidebar */}
      <div className="sidebar-desktop">{sidebarContent}</div>

      {/* MOBILE: floating FAB button */}
      <button
        className={`sidebar-fab ${hasActiveFilters ? "has-filters" : ""}`}
        onClick={() => setMobileOpen(true)}
        aria-label="Open filters and categories"
      >
        {/* Filter / sliders icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="12" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="2" fill="currentColor" stroke="none" />
          <circle cx="8" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
        <span>Browse</span>
        {hasActiveFilters && <span className="sidebar-fab-badge" />}
      </button>

      {/* MOBILE: backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* MOBILE: slide-in drawer */}
      <div className={`sidebar-drawer ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-drawer-header">
          <span className="sidebar-drawer-title">Browse & Filter</span>
          <button
            className="sidebar-drawer-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>
        {sidebarContent}
      </div>
    </>
  );
};

export default SideBar;
