import { useState } from "react";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import NavIcons from "./NavIcons";
import { FaBars } from "react-icons/fa";

const NavBar = () => {
  // Controls mobile menu open/closed state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="top-bar">
      <div className="top-bar-container">
        {/* Left section — mobile hamburger toggle and logo */}
        <div className="top-bar-left">
          <button
            className="top-bar-mobile-toggle"
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
          >
            <FaBars />
          </button>
          <Logo />
        </div>

        {/* Center section — main nav links; closing the menu on any link click */}
        <div
          className={`top-bar-nav-links ${isMenuOpen ? "top-bar-nav-links-open" : ""}`}
          onClick={closeMenu}
        >
          <NavLinks />
        </div>

        {/* Right section — profile, wishlist, and cart icons */}
        <div className="top-bar-icons">
          <NavIcons />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
