import { type Category } from "../../../api/categories";
import "../../../styles/components/customerInterface/items/SideBar.css";

interface SideBarProps {
  activeCategoryId: number | null;
  onSelectCategory: (categoryId: number | null, categoryName: string) => void;
  categories: Category[];
}

const SideBar = ({
  activeCategoryId,
  onSelectCategory,
  categories,
}: SideBarProps) => {
  return (
    <nav className="sidebar">
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
    </nav>
  );
};

export default SideBar;
