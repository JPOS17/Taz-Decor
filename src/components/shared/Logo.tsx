import { Link } from "react-router-dom";

// Renders the store logo as a link; shows full name on wide screens, short name on mobile
const Logo = () => {
  return (
    <Link className="top-bar-logo" to="/items">
      <span className="top-bar-logo-full">Taz Decor's Catholic Shop</span>
      <span className="top-bar-logo-short">Taz Decor</span>
    </Link>
  );
};

export default Logo;
