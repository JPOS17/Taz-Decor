import { Search, Filter, Tag, MapPin } from "lucide-react";

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
}: CouponFiltersProps) => {
  return (
    <div className="coupon-filters-container">
      <div className="coupon-filters-grid">
        <div className="coupon-filter-item">
          <label className="mgr-form-label">
            <Search size={16} className="coupon-label-icon" />
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or description"
            className="mgr-form-input"
          />
        </div>

        <div className="coupon-filter-item-narrow">
          <label className="mgr-form-label">
            <Filter size={16} className="coupon-label-icon" />
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mgr-form-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="coupon-filter-item-narrow">
          <label className="mgr-form-label">
            <MapPin size={16} className="coupon-label-icon" />
            Store Location
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="mgr-form-select"
          >
            <option value="all">All Stores</option>
            {locations.map((location) => (
              <option key={location.location_id} value={location.location_id}>
                {location.location_name}
              </option>
            ))}
          </select>
        </div>

        <div className="coupon-filter-item-narrow">
          <label className="mgr-form-label">
            <Tag size={16} className="coupon-label-icon" />
            Applies To
          </label>
          <select
            value={appliesToFilter}
            onChange={(e) => setAppliesToFilter(e.target.value)}
            className="mgr-form-select"
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
    </div>
  );
};
