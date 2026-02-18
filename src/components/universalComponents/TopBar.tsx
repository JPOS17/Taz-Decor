import { useState } from "react";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import NavIcons from "./NavIcons";
import { FaBars } from "react-icons/fa";

import "../../styles/components/universal/TopBar.css";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="topbar">
      <div className="topbar-container">
        {/* Left section: dropdown toggle and logo */}
        <div className="topbar-left">
          <button
            className="topbar-mobile-toggle"
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
          className={`topbar-nav-links ${isMenuOpen ? "open" : ""}`}
          onClick={closeMenu}
        >
          <NavLinks />
        </div>

        {/* Right section: nav icons */}
        <div className="topbar-icons">
          <NavIcons />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
