import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
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

interface FilterOption {
  // null means "no filter" (the default option)
  value: string | null;
  label: string;
  dividerBefore?: boolean;
}

interface FilterConfig {
  key: string;
  groupLabel: string;
  // Prefix for the active-filter chip, e.g. "Sort: Name (A-Z)"
  chipPrefix?: string;
  current: string | null;
  onChange: (value: string | null) => void;
  options: FilterOption[];
}

// A single custom dropdown
const FilterDropdown = ({
  isOpen,
  onToggle,
  onClose,
  label,
  isSet,
  options,
  current,
  onSelect,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  label: string;
  isSet: boolean;
  options: FilterOption[];
  current: string | null;
  onSelect: (value: string | null) => void;
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
    <div className="inventory-list-dropdown" ref={wrapperRef}>
      <button
        className={`inventory-list-dropdown-toggle${
          isSet ? " inventory-list-dropdown-toggle--set" : ""
        }${isOpen ? " inventory-list-dropdown-toggle--open" : ""}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{label}</span>
        <ChevronDown size={14} className="inventory-list-dropdown-chevron" />
      </button>

      {isOpen && (
        <ul className="inventory-list-dropdown-menu" role="listbox">
          {options.map((option) => {
            const selected = option.value === current;
            return (
              <li key={option.label} role="presentation">
                {option.dividerBefore && (
                  <hr className="inventory-list-dropdown-divider" />
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`inventory-list-dropdown-item${
                    selected ? " inventory-list-dropdown-item--selected" : ""
                  }`}
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <span>{option.label}</span>
                  {selected && <Check size={14} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // ============================================================================
  // FILTER DEFINITIONS
  // One config per dropdown — labels, chips and the open/selected state are all
  // derived from these, so adding a filter is a single new entry.
  // ============================================================================

  const filters: FilterConfig[] = [
    {
      key: "status",
      groupLabel: "Product Status",
      current: currentStatus,
      onChange: onStatusChange,
      options: [
        { value: null, label: "All Products" },
        { value: "active", label: "Active Only", dividerBefore: true },
        { value: "inactive", label: "Inactive Only" },
      ],
    },
    {
      key: "stock",
      groupLabel: "Stock Level",
      current: currentStockStatus,
      onChange: onStockChange,
      options: [
        { value: null, label: "Any Stock Level" },
        { value: "out-of-stock", label: "Out of Stock", dividerBefore: true },
        { value: "low-stock", label: "Low Stock (≤3)" },
      ],
    },
    {
      key: "category",
      groupLabel: "Category Status",
      current: currentCategoryStatus,
      onChange: onCategoryStatusChange,
      options: [
        { value: null, label: "All Categories" },
        { value: "active", label: "Active Categories", dividerBefore: true },
        { value: "inactive", label: "Inactive Categories" },
        {
          value: "multiple",
          label: "Multiple Categories (2+)",
          dividerBefore: true,
        },
      ],
    },
    {
      key: "sort",
      groupLabel: "Sort By",
      chipPrefix: "Sort: ",
      current: currentSortBy,
      onChange: onSortChange,
      options: [
        { value: null, label: "Default Order" },
        { value: "name-asc", label: "Name (A-Z)", dividerBefore: true },
        { value: "name-desc", label: "Name (Z-A)" },
        { value: "price-asc", label: "Price (Low-High)", dividerBefore: true },
        { value: "price-desc", label: "Price (High-Low)" },
        { value: "stock-asc", label: "Stock (Low-High)", dividerBefore: true },
        { value: "stock-desc", label: "Stock (High-Low)" },
        { value: "newest", label: "Newest First", dividerBefore: true },
        { value: "oldest", label: "Oldest First" },
      ],
    },
  ];

  // Returns the label of the option matching the filter's current value
  const getLabel = (filter: FilterConfig) =>
    (
      filter.options.find((o) => o.value === filter.current) ??
      filter.options[0]
    ).label;

  const activeFilters = filters.filter((f) => f.current !== null);
  const activeFilterCount = activeFilters.length;
  const hasActiveFilters = activeFilterCount > 0;

  const toggleDropdown = (key: string) =>
    setOpenDropdown((prev) => (prev === key ? null : key));
  const closeDropdown = () => setOpenDropdown(null);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="inventory-list-filters">
      {/* Filter toggle row: toggle button, active filter chips, clear all */}
      <div className="inventory-list-filters-bar">
        <button
          type="button"
          className={`inventory-list-filter-toggle${
            showFilters ? " inventory-list-filter-toggle--open" : ""
          }`}
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="inventory-list-filter-count">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* One removable chip per active filter */}
        {activeFilters.map((filter) => (
          <span key={filter.key} className="inventory-list-chip">
            {filter.chipPrefix}
            {getLabel(filter)}
            <button
              type="button"
              className="inventory-list-chip-remove"
              onClick={() => filter.onChange(null)}
              aria-label={`Remove filter: ${getLabel(filter)}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            className="inventory-list-filter-clear"
            onClick={onClearFilters}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <div className="inventory-list-filter-panel">
          {filters.map((filter) => (
            <div key={filter.key} className="inventory-list-filter-group">
              <span className="inventory-list-filter-group-label">
                {filter.groupLabel}
              </span>
              <FilterDropdown
                isOpen={openDropdown === filter.key}
                onToggle={() => toggleDropdown(filter.key)}
                onClose={closeDropdown}
                label={getLabel(filter)}
                isSet={filter.current !== null}
                options={filter.options}
                current={filter.current}
                onSelect={filter.onChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerFilterBar;
