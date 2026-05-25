import { useState } from "react";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import NavIcons from "./NavIcons";
import { FaBars } from "react-icons/fa";
import "../../styles/components/universal/TopBar.css";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="tb-topbar">
      <div className="tb-topbar-container">
        {/* Left section: dropdown toggle and logo */}
        <div className="tb-topbar-left">
          <button
            className="tb-topbar-mobile-toggle"
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
          >
            <FaBars />
          </button>
          <Logo />
        </div>

        {/* Center section: nav links */}
        <div
          className={`tb-topbar-nav-links ${isMenuOpen ? "tb-topbar-nav-links-open" : ""}`}
          onClick={closeMenu}
        >
          <NavLinks />
        </div>

        {/* Right section: nav icons */}
        <div className="tb-topbar-icons">
          <NavIcons />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
