import { useEffect, useState } from "react";
import { fetchCategories, type Category } from "../../../api/categories";
import "../../../styles/components/customerInterface/items/SideBar.css";

interface SideBarProps {
  activeCategoryId: number | null;
  onSelectCategory: (categoryId: number | null, categoryName: string) => void;
}

const SideBar = ({ activeCategoryId, onSelectCategory }: SideBarProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        // Only fetch active categories for customer-facing sidebar
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

  return (
    <nav className="sidebar">
      {loading ? (
        <div className="sidebar-loading">Loading categories...</div>
      ) : error ? (
        <div className="sidebar-error">Error: {error}</div>
      ) : (
        <ul className="sidebar-nav">
          {/* "All" category */}
          <li className="sidebar-nav-item">
            <button
              className={`sidebar-nav-link ${
                activeCategoryId === null ? "active" : ""
              }`}
              onClick={() => onSelectCategory(null, "All")}
            >
              <span className="sidebar-link-text">All</span>
            </button>
          </li>

          {/* Dynamic categories from database - only active ones */}
          {categories.map((category) => (
            <li key={category.category_id} className="sidebar-nav-item">
              <button
                className={`sidebar-nav-link ${
                  activeCategoryId === category.category_id ? "active" : ""
                }`}
                onClick={() =>
                  onSelectCategory(category.category_id, category.category_name)
                }
              >
                <span className="sidebar-link-text">
                  {category.category_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};

export default SideBar;
