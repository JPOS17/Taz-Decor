import { useRef, useState, useEffect } from "react";
import { type Category } from "../../../api/categories";

interface CategoryDropDownProps {
  activeCategoryId: number | null;
  activeCategoryName: string;
  onSelectCategory: (categoryId: number | null, categoryName: string) => void;
  // Categories are fetched by Items.tsx and passed down — no independent fetch here
  categories: Category[];
}

const CategoryDropDown = ({
  activeCategoryId,
  activeCategoryName,
  onSelectCategory,
  categories,
}: CategoryDropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when the user clicks outside of it or presses Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Toggles dropdown open/closed
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Handles selecting a category from the dropdown
  const handleSelect = (categoryId: number | null, categoryName: string) => {
    onSelectCategory(categoryId, categoryName);
    setIsOpen(false);
  };

  // Renders the dropdown button and menu
  return (
    <div className="category-dropdown-container">
      <div className="category-dropdown-wrapper" ref={dropdownRef}>
        <button
          className={["category-dropdown-toggle", isOpen ? "category-dropdown-toggle--open" : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={handleToggle}
          type="button"
          aria-expanded={isOpen}
        >
          <span className="category-dropdown-label">Category</span>
          <span className="category-dropdown-value">{activeCategoryName}</span>
          <svg
            className="category-dropdown-icon"
            width="14"
            height="14"
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

        <ul
          className={["category-dropdown-menu", isOpen ? "category-dropdown-menu--open" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <li className="category-dropdown-item">
            <button
              className={[
                "category-dropdown-item-btn",
                activeCategoryId === null ? "category-dropdown-item-btn--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSelect(null, "All")}
            >
              All
            </button>
          </li>

          {categories.map((category) => (
            <li key={category.category_id} className="category-dropdown-item">
              <button
                className={[
                  "category-dropdown-item-btn",
                  activeCategoryId === category.category_id
                    ? "category-dropdown-item-btn--active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  handleSelect(category.category_id, category.category_name)
                }
              >
                {category.category_name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CategoryDropDown;
