import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <>
      <Link
        className="navbar-brand"
        to="/home"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Taz Decor's Catholic Shop
      </Link>
    </>
  );
};

export default Logo;
