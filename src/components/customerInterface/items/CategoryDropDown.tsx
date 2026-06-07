import { useRef, useState, useEffect } from "react";
import { type Category } from "../../../api/categories";

import "../../../styles/components/customerInterface/items/CategoryDropDown.css";

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

  // Close the dropdown when the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    <div className="cdd-container">
      <div className="cdd-wrapper" ref={dropdownRef}>
        <button
          className={["cdd-toggle", isOpen ? "cdd-toggle--open" : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={handleToggle}
          type="button"
          aria-expanded={isOpen}
        >
          Category: {activeCategoryName}
          <span className="cdd-icon">▼</span>
        </button>

        <ul
          className={["cdd-menu", isOpen ? "cdd-menu--open" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <li className="cdd-item">
            <button
              className={[
                "cdd-item-btn",
                activeCategoryId === null ? "cdd-item-btn--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSelect(null, "All")}
            >
              All
            </button>
          </li>

          {categories.map((category) => (
            <li key={category.category_id} className="cdd-item">
              <button
                className={[
                  "cdd-item-btn",
                  activeCategoryId === category.category_id
                    ? "cdd-item-btn--active"
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
