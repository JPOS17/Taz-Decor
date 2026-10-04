import { Search, X } from "lucide-react";

interface CouponFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  appliesToFilter: string;
  setAppliesToFilter: (appliesTo: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  locations: Array<{ location_id: number; location_name: string }>;
  // Optional extras for the footer row: result count and a "clear all" shortcut
  resultCount?: number;
  loading?: boolean;
  onClearFilters?: () => void;
}

export const CouponFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  appliesToFilter,
  setAppliesToFilter,
  locationFilter,
  setLocationFilter,
  locations,
  resultCount,
  loading = false,
  onClearFilters,
}: CouponFiltersProps) => {
  // True when any filter differs from its default, so "Clear filters" is worth showing
  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    appliesToFilter !== "all" ||
    locationFilter !== "all";

  return (
    <section className="coupons-toolbar" aria-label="Coupon filters">
      <div className="coupons-toolbar-grid">
        {/* Free-text search */}
        <div className="coupons-field coupons-field--search">
          <label className="coupons-field-label" htmlFor="coupons-search">
            Search
          </label>
          <div className="coupons-search">
            <Search
              className="coupons-search-icon"
              size={16}
              aria-hidden="true"
            />
            <input
              id="coupons-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code or description"
              className="coupons-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="coupons-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Status filter */}
        <div className="coupons-field">
          <label className="coupons-field-label" htmlFor="coupons-status">
            Status
          </label>
          <select
            id="coupons-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="coupons-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Location filter */}
        <div className="coupons-field">
          <label className="coupons-field-label" htmlFor="coupons-location">
            Store Location
          </label>
          <select
            id="coupons-location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="coupons-select"
          >
            <option value="all">All Stores</option>
            {locations.map((location) => (
              <option key={location.location_id} value={location.location_id}>
                {location.location_name}
              </option>
            ))}
          </select>
        </div>

        {/* Applies-to filter */}
        <div className="coupons-field">
          <label className="coupons-field-label" htmlFor="coupons-applies-to">
            Applies To
          </label>
          <select
            id="coupons-applies-to"
            value={appliesToFilter}
            onChange={(e) => setAppliesToFilter(e.target.value)}
            className="coupons-select"
          >
            <option value="all">All Types</option>
            <option value="all_products">Store-Wide</option>
            <option value="category">Category</option>
            <option value="product_type">Product Type</option>
            <option value="product">Specific Product</option>
            <option value="variant">Specific Variant</option>
            <option value="custom_group">Custom Group</option>
          </select>
        </div>
      </div>

      {/* Footer row: result count + clear filters */}
      {(resultCount !== undefined || (hasActiveFilters && onClearFilters)) && (
        <div className="coupons-toolbar-meta">
          <span className="coupons-result-count" aria-live="polite">
            {resultCount !== undefined && !loading && (
              <>
                <strong>{resultCount}</strong>{" "}
                {resultCount === 1 ? "coupon" : "coupons"}
              </>
            )}
          </span>
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              className="coupons-btn coupons-btn--ghost"
              onClick={onClearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
};
