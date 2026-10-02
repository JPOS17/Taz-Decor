// Shared filter option definitions for the product catalog.
// Single source of truth for the sidebar controls and the active-filter chips.

export interface PriceOption {
  label: string;
  min: number | null;
  max: number | null;
}

export interface SortOption {
  label: string;
  value: string | null;
}

export const PRICE_OPTIONS: PriceOption[] = [
  { label: "Any price", min: null, max: null },
  { label: "Under $25", min: null, max: 25 },
  { label: "$25 – $75", min: 25, max: 75 },
  { label: "$75 – $100", min: 75, max: 100 },
  { label: "Over $100", min: 100, max: null },
];

export const SORT_OPTIONS: SortOption[] = [
  { label: "Default", value: null },
  { label: "Name: A to Z", value: "name-asc" },
  { label: "Name: Z to A", value: "name-desc" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

// Returns the display label for a price range, falling back to a formatted
// range when the URL contains values that don't match a preset option
export const getPriceLabel = (min: number | null, max: number | null): string => {
  const preset = PRICE_OPTIONS.find((o) => o.min === min && o.max === max);
  if (preset) return preset.label;
  if (min !== null && max !== null) return `$${min} – $${max}`;
  if (min !== null) return `Over $${min}`;
  if (max !== null) return `Under $${max}`;
  return "Any price";
};

// Returns the display label for a sort value, or null when it is not recognised
export const getSortLabel = (value: string | null): string | null =>
  SORT_OPTIONS.find((o) => o.value === value)?.label ?? null;
