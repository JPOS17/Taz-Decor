import { useState, useEffect, useId, type ReactNode } from "react";
import { type Category } from "../../../api/categories";
import { PRICE_OPTIONS, SORT_OPTIONS } from "./catalogFilterOptions";

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

// ============================================================================
// FILTER ACCORDION
// Collapsible section used for the Price and Sort controls
// ============================================================================

interface FilterAccordionProps {
  title: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

const FilterAccordion = ({
  title,
  isActive,
  isOpen,
  onToggle,
  children,
}: FilterAccordionProps) => {
  // Unique per instance — the sidebar content renders in both the desktop
  // column and the mobile drawer, so static ids would collide
  const panelId = useId();

  return (
    <div className="product-filter-sidebar-filter-section">
      <button
        type="button"
        className="product-filter-sidebar-filter-heading"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span>
          {title}
          {isActive && <span className="product-filter-sidebar-filter-dot" />}
        </span>
        <svg
          className={`product-filter-sidebar-filter-chevron${isOpen ? " product-filter-sidebar-open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="2 4 6 8 10 4" />
        </svg>
      </button>
      {isOpen && (
        <ul id={panelId} className="product-filter-sidebar-filter-options">
          {children}
        </ul>
      )}
    </div>
  );
};

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
  const isPriceActive = currentMinPrice !== null || currentMaxPrice !== null;
  const hasActiveFilters =
    isPriceActive || !!currentSortBy || currentOnSaleOnly;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Sections start open when their filter is already active (e.g. from a shared URL)
  const [priceOpen, setPriceOpen] = useState(isPriceActive);
  const [sortOpen, setSortOpen] = useState(!!currentSortBy);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Returns true when the given price range matches the currently active filter
  const matchesPrice = (min: number | null, max: number | null) =>
    min === currentMinPrice && max === currentMaxPrice;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Prevent body scroll while the mobile drawer is open, and close it on Escape
  useEffect(() => {
    if (!mobileOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Clears every filter and scrolls back to the top of the results
  const handleReset = () => {
    onReset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <nav className="product-filter-sidebar" aria-label="Product filters and categories">
      {/* FILTERS */}
      <div className="product-filter-sidebar-filters">
        <div className="product-filter-sidebar-heading-row">
          <h2 className="product-filter-sidebar-heading">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              className="product-filter-sidebar-reset-btn"
              onClick={handleReset}
            >
              Reset
            </button>
          )}
        </div>

        {/* Price filter */}
        <FilterAccordion
          title="Price"
          isActive={isPriceActive}
          isOpen={priceOpen}
          onToggle={() => setPriceOpen((o) => !o)}
        >
          {PRICE_OPTIONS.map((opt) => (
            <li key={opt.label}>
              <button
                type="button"
                className={`product-filter-sidebar-filter-option${matchesPrice(opt.min, opt.max) ? " product-filter-sidebar-active" : ""}`}
                onClick={() => onPriceChange(opt.min, opt.max)}
                aria-pressed={matchesPrice(opt.min, opt.max)}
              >
                <span className="product-filter-sidebar-filter-radio" />
                {opt.label}
              </button>
            </li>
          ))}
        </FilterAccordion>

        {/* Sort filter */}
        <FilterAccordion
          title="Sort by"
          isActive={!!currentSortBy}
          isOpen={sortOpen}
          onToggle={() => setSortOpen((o) => !o)}
        >
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.label}>
              <button
                type="button"
                className={`product-filter-sidebar-filter-option${currentSortBy === opt.value ? " product-filter-sidebar-active" : ""}`}
                onClick={() => onSortChange(opt.value)}
                aria-pressed={currentSortBy === opt.value}
              >
                <span className="product-filter-sidebar-filter-radio" />
                {opt.label}
              </button>
            </li>
          ))}
        </FilterAccordion>

        {/* Sale toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={currentOnSaleOnly}
          className={`product-filter-sidebar-sale-btn${currentOnSaleOnly ? " product-filter-sidebar-active" : ""}`}
          onClick={() => onSaleFilterChange(!currentOnSaleOnly)}
        >
          <span>On sale only</span>
          <span className="product-filter-sidebar-sale-switch" />
        </button>
      </div>

      {/* CATEGORIES */}
      <div className="product-filter-sidebar-heading-row product-filter-sidebar-heading-row-categories">
        <h2 className="product-filter-sidebar-heading">Categories</h2>
      </div>

      <ul className="product-filter-sidebar-nav">
        <li className="product-filter-sidebar-nav-item">
          <button
            type="button"
            className={`product-filter-sidebar-nav-link${activeCategoryId === null ? " product-filter-sidebar-active" : ""}`}
            onClick={() => handleSelectCategory(null, "All")}
            aria-current={activeCategoryId === null ? "true" : undefined}
          >
            <span className="product-filter-sidebar-link-text">All</span>
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.category_id} className="product-filter-sidebar-nav-item">
            <button
              type="button"
              className={`product-filter-sidebar-nav-link${activeCategoryId === category.category_id ? " product-filter-sidebar-active" : ""}`}
              onClick={() =>
                handleSelectCategory(
                  category.category_id,
                  category.category_name,
                )
              }
              aria-current={
                activeCategoryId === category.category_id ? "true" : undefined
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
      {/* Desktop — sticky sidebar column */}
      <aside className="product-filter-sidebar-desktop">{sidebarContent}</aside>

      {/* Mobile — floating FAB that opens the drawer */}
      <button
        type="button"
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
          aria-hidden="true"
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
      <div
        className={`product-filter-sidebar-drawer${mobileOpen ? " product-filter-sidebar-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Browse and filter"
      >
        <div className="product-filter-sidebar-drawer-header">
          <span className="product-filter-sidebar-drawer-title">Browse & Filter</span>
          <button
            type="button"
            className="product-filter-sidebar-drawer-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>
        {sidebarContent}
      </div>
    </>
  );
};

export default SideBar;
