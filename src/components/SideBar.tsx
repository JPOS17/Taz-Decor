import "../styles/SideBar.css";

const categories = ["All", "Our Lady of Guadalupe", "Womens", "Mens", "Kids"];

// content of object
interface SideBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const SideBar = ({ activeCategory, onSelectCategory }: SideBarProps) => {
  return (
    <nav className="sidebar d-none d-md-flex">
      <ul className="nav flex-column">
        {/* creates each category through map */}
        {categories.map((category) => (
          <li key={category}>
            <button
              className={` nav-link 
                ${activeCategory === category ? "active text-dark" : ""}`}
              // updates category selected
              onClick={() => onSelectCategory(category)}
            >
              <span className="sidebar-link-text">{category}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SideBar;
