import { Link } from "react-router-dom";

import { FaRegHeart } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";

const icons = [
  { to: "/profile", icon: <CgProfile size={20} /> },
  { to: "/wishList", icon: <FaRegHeart size={20} /> },
  { to: "/cart", icon: <FiShoppingCart size={20} /> },
];

const NavIcons = () => (
  <>
    {icons.map(({ to, icon }) => (
      <Link className="nav-icons" key={to} to={to}>
        {icon}
      </Link>
    ))}
  </>
);

export default NavIcons;
