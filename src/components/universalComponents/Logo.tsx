import { Link } from "react-router-dom";
import "../../styles/components/universal/TopBar.css";

// Renders the store logo as a link; shows full name on wide screens, short name on mobile
const Logo = () => {
  return (
    <Link className="tb-topbar-logo" to="/items">
      <span className="tb-logo-full">Taz Decor's Catholic Shop</span>
      <span className="tb-logo-short">Taz Decor</span>
    </Link>
  );
};

export default Logo;
