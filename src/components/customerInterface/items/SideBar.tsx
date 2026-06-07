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
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [priceOpen, setPriceOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPriceActive = currentMinPrice !== null || currentMaxPrice !== null;
  const hasActiveFilters =
    isPriceActive || !!currentSortBy || currentOnSaleOnly;

  // Returns true when the given price range matches the currently active filter
  const matchesPrice = (min: number | null, max: number | null) =>
    min === currentMinPrice && max === currentMaxPrice;

  // ============================================================================
  // SIDE EFFECTS
  // ============================================================================

  // Prevent body scroll while the mobile drawer is open
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

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Selects a category and closes the mobile drawer
  const handleSelectCategory = (id: number | null, name: string) => {
    onSelectCategory(id, name);
    setMobileOpen(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Shared sidebar content rendered in both desktop and mobile drawer contexts
  const sidebarContent = (
    <nav className="sb-sidebar">
      {/* FILTERS */}
      <div className="sb-sidebar-filters">
        {/* Price filter — collapsible radio list */}
        <div className="sb-sidebar-filter-section">
          <button
            className="sb-sidebar-filter-heading"
            onClick={() => setPriceOpen((o) => !o)}
          >
            <span>
              Price
              {isPriceActive && <span className="sb-sidebar-filter-dot" />}
            </span>
            <span
              className={`sb-sidebar-filter-chevron${priceOpen ? " sb-open" : ""}`}
            >
              ▼
            </span>
          </button>
          {priceOpen && (
            <ul className="sb-sidebar-filter-options">
              {PRICE_OPTIONS.map((opt) => (
                <li key={opt.label}>
                  <button
                    className={`sb-sidebar-filter-option${matchesPrice(opt.min, opt.max) ? " sb-active" : ""}`}
                    onClick={() => onPriceChange(opt.min, opt.max)}
                  >
                    <span className="sb-sidebar-filter-radio" />
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sort filter — collapsible radio list */}
        <div className="sb-sidebar-filter-section">
          <button
            className="sb-sidebar-filter-heading"
            onClick={() => setSortOpen((o) => !o)}
          >
            <span>
              Sort By
              {currentSortBy && <span className="sb-sidebar-filter-dot" />}
            </span>
            <span
              className={`sb-sidebar-filter-chevron${sortOpen ? " sb-open" : ""}`}
            >
              ▼
            </span>
          </button>
          {sortOpen && (
            <ul className="sb-sidebar-filter-options">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.label}>
                  <button
                    className={`sb-sidebar-filter-option${currentSortBy === opt.value ? " sb-active" : ""}`}
                    onClick={() => onSortChange(opt.value)}
                  >
                    <span className="sb-sidebar-filter-radio" />
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sale toggle */}
        <button
          className={`sb-sidebar-sale-btn${currentOnSaleOnly ? " sb-active" : ""}`}
          onClick={() => onSaleFilterChange(!currentOnSaleOnly)}
        >
          <span className="sb-sidebar-sale-check" />
          On Sale Only
        </button>

        {/* Reset — only shown when at least one filter is active */}
        {hasActiveFilters && (
          <button className="sb-sidebar-reset-btn" onClick={onReset}>
            Reset Filters
          </button>
        )}
      </div>

      <div className="sb-sidebar-divider" />

      {/* CATEGORIES */}
      <ul className="sb-sidebar-nav">
        <li className="sb-sidebar-nav-item">
          <button
            className={`sb-sidebar-nav-link${activeCategoryId === null ? " sb-active" : ""}`}
            onClick={() => handleSelectCategory(null, "All")}
          >
            <span className="sb-sidebar-link-text">All</span>
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.category_id} className="sb-sidebar-nav-item">
            <button
              className={`sb-sidebar-nav-link${activeCategoryId === category.category_id ? " sb-active" : ""}`}
              onClick={() =>
                handleSelectCategory(
                  category.category_id,
                  category.category_name,
                )
              }
            >
              <span className="sb-sidebar-link-text">
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
      {/* Desktop — static sidebar */}
      <div className="sb-sidebar-desktop">{sidebarContent}</div>

      {/* Mobile — floating FAB that opens the drawer */}
      <button
        className={`sb-sidebar-fab${hasActiveFilters ? " sb-has-filters" : ""}`}
        onClick={() => setMobileOpen(true)}
        aria-label="Open filters and categories"
      >
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
        {hasActiveFilters && <span className="sb-sidebar-fab-badge" />}
      </button>

      {/* Mobile — backdrop that dismisses the drawer on click */}
      <div
        className={`sb-sidebar-backdrop${mobileOpen ? " sb-open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile — slide-in drawer */}
      <div className={`sb-sidebar-drawer${mobileOpen ? " sb-open" : ""}`}>
        <div className="sb-sidebar-drawer-header">
          <span className="sb-sidebar-drawer-title">Browse & Filter</span>
          <button
            className="sb-sidebar-drawer-close"
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
