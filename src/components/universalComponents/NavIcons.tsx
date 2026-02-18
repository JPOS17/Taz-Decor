import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { FaRegHeart } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";

const NavIcons = () => {
  const { getCartCount, wishlistItems } = useCart();

  const cartCount = getCartCount();
  const wishlistCount = wishlistItems.length;

  const icons = [
    {
      to: "/profile",
      icon: <CgProfile size={20} />,
      label: "Profile",
      count: 0,
    },
    {
      to: "/saved",
      icon: <FaRegHeart size={20} />,
      label: "Saved",
      count: wishlistCount,
    },
    {
      to: "/cart",
      icon: <FiShoppingCart size={20} />,
      label: "Cart",
      count: cartCount,
    },
  ];

  return (
    <>
      {icons.map(({ to, icon, label, count }) => (
        <Link className="topbar-icon-link" key={to} to={to} data-label={label}>
          <span className="topbar-icon-wrapper">
            {icon}
            {count > 0 && <span className="topbar-icon-badge">{count}</span>}
          </span>
        </Link>
      ))}
    </>
  );
};

export default NavIcons;
