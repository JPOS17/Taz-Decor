import { useState, useEffect } from "react";
import { type Category } from "../../../api/categories";

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
  // EFFECTS
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

  // Scrolls to the top if reset is clicked
  const handleReset = () => {
    onReset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <nav className="product-filter-sidebar">
      {/* FILTERS */}
      <div className="product-filter-sidebar-filters">
        {/* Price filter */}
        <div className="product-filter-sidebar-filter-section">
          <button
            className="product-filter-sidebar-filter-heading"
            onClick={() => setPriceOpen((o) => !o)}
          >
            <span>
              Price
              {isPriceActive && <span className="product-filter-sidebar-filter-dot" />}
            </span>
            <span
              className={`product-filter-sidebar-filter-chevron${priceOpen ? " product-filter-sidebar-open" : ""}`}
            >
              ▼
            </span>
          </button>
          {priceOpen && (
            <ul className="product-filter-sidebar-filter-options">
              {PRICE_OPTIONS.map((opt) => (
                <li key={opt.label}>
                  <button
                    className={`product-filter-sidebar-filter-option${matchesPrice(opt.min, opt.max) ? " product-filter-sidebar-active" : ""}`}
                    onClick={() => onPriceChange(opt.min, opt.max)}
                  >
                    <span className="product-filter-sidebar-filter-radio" />
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sort filter */}
        <div className="product-filter-sidebar-filter-section">
          <button
            className="product-filter-sidebar-filter-heading"
            onClick={() => setSortOpen((o) => !o)}
          >
            <span>
              Sort By
              {currentSortBy && <span className="product-filter-sidebar-filter-dot" />}
            </span>
            <span
              className={`product-filter-sidebar-filter-chevron${sortOpen ? " product-filter-sidebar-open" : ""}`}
            >
              ▼
            </span>
          </button>
          {sortOpen && (
            <ul className="product-filter-sidebar-filter-options">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.label}>
                  <button
                    className={`product-filter-sidebar-filter-option${currentSortBy === opt.value ? " product-filter-sidebar-active" : ""}`}
                    onClick={() => onSortChange(opt.value)}
                  >
                    <span className="product-filter-sidebar-filter-radio" />
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sale toggle */}
        <button
          className={`product-filter-sidebar-sale-btn${currentOnSaleOnly ? " product-filter-sidebar-active" : ""}`}
          onClick={() => onSaleFilterChange(!currentOnSaleOnly)}
        >
          <span className="product-filter-sidebar-sale-check" />
          On Sale Only
        </button>

        {/* Reset  */}
        {hasActiveFilters && (
          <button className="product-filter-sidebar-reset-btn" onClick={handleReset}>
            Reset Filters
          </button>
        )}
      </div>

      <div className="product-filter-sidebar-divider" />

      {/* CATEGORIES */}
      <ul className="product-filter-sidebar-nav">
        <li className="product-filter-sidebar-nav-item">
          <button
            className={`product-filter-sidebar-nav-link${activeCategoryId === null ? " product-filter-sidebar-active" : ""}`}
            onClick={() => handleSelectCategory(null, "All")}
          >
            <span className="product-filter-sidebar-link-text">All</span>
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.category_id} className="product-filter-sidebar-nav-item">
            <button
              className={`product-filter-sidebar-nav-link${activeCategoryId === category.category_id ? " product-filter-sidebar-active" : ""}`}
              onClick={() =>
                handleSelectCategory(
                  category.category_id,
                  category.category_name,
                )
              }
            >
              <span className="product-filter-sidebar-link-text">
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
      <div className="product-filter-sidebar-desktop">{sidebarContent}</div>

      {/* Mobile — floating FAB that opens the drawer */}
      <button
        className={`product-filter-sidebar-fab${hasActiveFilters ? " product-filter-sidebar-has-filters" : ""}`}
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
        {hasActiveFilters && <span className="product-filter-sidebar-fab-badge" />}
      </button>

      {/* Mobile — backdrop that dismisses the drawer on click */}
      <div
        className={`product-filter-sidebar-backdrop${mobileOpen ? " product-filter-sidebar-open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile — slide-in drawer */}
      <div className={`product-filter-sidebar-drawer${mobileOpen ? " product-filter-sidebar-open" : ""}`}>
        <div className="product-filter-sidebar-drawer-header">
          <span className="product-filter-sidebar-drawer-title">Browse & Filter</span>
          <button
            className="product-filter-sidebar-drawer-close"
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
