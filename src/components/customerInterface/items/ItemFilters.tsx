import "../../../styles/components/customerInterface/items/FilterBar.css";

interface FilterBarProps {
  onPriceChange: (minPrice: number | null, maxPrice: number | null) => void;
  onSortChange: (sortBy: string | null) => void;
  onSaleFilterChange: (onSaleOnly: boolean) => void;
  currentMinPrice: number | null;
  currentMaxPrice: number | null;
  currentSortBy: string | null;
  currentOnSaleOnly: boolean;
}

const FilterBar = ({
  onPriceChange,
  onSortChange,
  onSaleFilterChange,
  currentMinPrice,
  currentMaxPrice,
  currentSortBy,
  currentOnSaleOnly,
}: FilterBarProps) => {
  // Determines text display on button
  const getPriceRangeLabel = () => {
    if (!currentMinPrice && !currentMaxPrice) return "Any price";
    if (!currentMinPrice && currentMaxPrice) return `Under $${currentMaxPrice}`;
    if (currentMinPrice && !currentMaxPrice) return `Over $${currentMinPrice}`;
    return `$${currentMinPrice} - $${currentMaxPrice}`;
  };
  const getSortLabel = () => {
    switch (currentSortBy) {
      case "name-asc":
        return "A to Z";
      case "name-desc":
        return "Z to A";
      case "price-asc":
        return "Lowest to Highest";
      case "price-desc":
        return "Highest to Lowest";
      default:
        return "Sort";
    }
  };

  return (
    <div className="filter-bar">
      <button
        className={`filter-sale-button ${currentOnSaleOnly ? "active" : ""}`}
        onClick={() => onSaleFilterChange(!currentOnSaleOnly)}
      >
        {currentOnSaleOnly ? "✓ On Sale" : "Show Sale Items"}
      </button>

      {/* Price Filter Dropdown */}
      <div className="filter-dropdown">
        <button
          className="filter-dropdown-toggle"
          type="button"
          onClick={(e) => {
            const menu = e.currentTarget.nextElementSibling;
            menu?.classList.toggle("open");
          }}
        >
          Price: {getPriceRangeLabel()}
          <span className="filter-dropdown-icon">▼</span>
        </button>
        <ul className="filter-dropdown-menu">
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onPriceChange(null, null);
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              Any price
            </button>
          </li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onPriceChange(null, 25);
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              Under $25
            </button>
          </li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onPriceChange(25, 75);
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              $25 - $75
            </button>
          </li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onPriceChange(75, 100);
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              $75 - $100
            </button>
          </li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onPriceChange(100, null);
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              Over $100
            </button>
          </li>
        </ul>
      </div>

      {/* Sort Dropdown */}
      <div className="filter-dropdown">
        <button
          className="filter-dropdown-toggle"
          type="button"
          onClick={(e) => {
            const menu = e.currentTarget.nextElementSibling;
            menu?.classList.toggle("open");
          }}
        >
          {getSortLabel()}
          <span className="filter-dropdown-icon">▼</span>
        </button>
        <ul className="filter-dropdown-menu">
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onSortChange(null);
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              Default
            </button>
          </li>
          <li className="filter-dropdown-divider"></li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onSortChange("name-asc");
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              A to Z
            </button>
          </li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onSortChange("name-desc");
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              Z to A
            </button>
          </li>
          <li className="filter-dropdown-divider"></li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onSortChange("price-asc");
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              Lowest to Highest
            </button>
          </li>
          <li className="filter-dropdown-item">
            <button
              className="filter-dropdown-item-button"
              onClick={(e) => {
                onSortChange("price-desc");
                e.currentTarget
                  .closest(".filter-dropdown-menu")
                  ?.classList.remove("open");
              }}
            >
              Highest to Lowest
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FilterBar;
