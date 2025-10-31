import DropDownToggle from "./DropDownToggle";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import NavIcons from "./NavIcons";
// import SearchModal from "./SearchModal";
// import SearchBar from "./SearchBar";

// {/* Search for large screens */}
// <SearchBar />

// {/* Search for small screens */}
// <SearchModal />

import "../styles/TopBar.css";

const NavBar = () => {
  return (
    <nav className="topbar navbar navbar-expand-md border-bottom">
      <div className="container-fluid">
        {/* drop down toggle and logo */}
        <div className="d-flex align-items-center gap-3">
          <DropDownToggle />
          <Logo />
        </div>

        {/* nav links */}
        <div
          className="nav-header-links navbar-nav collapse navbar-collapse align-items-center"
          id="navbarNavAltMarkup"
        >
          <NavLinks />
        </div>

        {/* nav icons */}
        <div className="d-flex flex-row align-items-center ">
          <NavIcons />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
