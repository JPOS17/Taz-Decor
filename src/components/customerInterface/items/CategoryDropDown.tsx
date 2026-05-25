import { useEffect, useState, useRef } from "react";
import { fetchCategories, type Category } from "../../../api/categories";

import "../../../styles/components/customerInterface/items/CategoryDropDown.css";

interface CategoryDropDownProps {
  activeCategoryId: number | null;
  activeCategoryName: string;
  onSelectCategory: (categoryId: number | null, categoryName: string) => void;
}

const CategoryDropDown = ({
  activeCategoryId,
  activeCategoryName,
  onSelectCategory,
}: CategoryDropDownProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories(false);
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error loading categories:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Close dropdown when clicking outside
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

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (categoryId: number | null, categoryName: string) => {
    onSelectCategory(categoryId, categoryName);
    setIsOpen(false);
  };

  return (
    <div className="cdd-container">
      {loading ? (
        <div className="cdd-loading">Loading categories...</div>
      ) : error ? (
        <div className="cdd-error">Error: {error}</div>
      ) : (
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
            {/* "All" option */}
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

            {/* Fetch categories from DB */}
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
      )}
    </div>
  );
};

export default CategoryDropDown;
