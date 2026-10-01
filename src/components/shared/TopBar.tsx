import { useState, useEffect, useRef, useId } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import NavIcons from "./NavIcons";

const TopBar = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Controls mobile menu open/closed state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // True once the page has scrolled, which adds a shadow to separate the bar from content
  const [isScrolled, setIsScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Tracks scroll position for the shadow state
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Closes the mobile menu on outside click or Escape while it is open
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <header
      ref={headerRef}
      className={`top-bar${isScrolled ? " top-bar-scrolled" : ""}`}
    >
      <div className="top-bar-container">
        {/* Left section — mobile menu toggle and logo */}
        <div className="top-bar-left">
          <button
            className="top-bar-mobile-toggle"
            type="button"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo />
        </div>

        {/* Center section — main nav links; closing the menu on any link click */}
        <nav
          id={menuId}
          className={`top-bar-nav-links${isMenuOpen ? " top-bar-nav-links-open" : ""}`}
          aria-label="Primary"
          onClick={closeMenu}
        >
          <NavLinks />
        </nav>

        {/* Right section — profile, wishlist, and cart icons */}
        <div className="top-bar-icons">
          <NavIcons />
        </div>
      </div>
    </header>
  );
};

export default TopBar;