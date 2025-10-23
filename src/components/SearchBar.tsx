import { HiMiniMagnifyingGlass } from "react-icons/hi2";

const SearchBar = () => {
  return (
    <form className="d-none d-md-flex" role="search">
      <input
        className="form-control me-2"
        type="search"
        placeholder="Search"
        aria-label="Search"
      />
      <span
        className="nav-link active"
        role="button"
        onClick={() => console.log("Search clicked!")}
      >
        <HiMiniMagnifyingGlass size={20} />
      </span>
    </form>
  );
};

export default SearchBar;
