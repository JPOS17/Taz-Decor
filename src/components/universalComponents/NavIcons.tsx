import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { FaRegHeart } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import "../../styles/components/universal/TopBar.css";

// Renders the profile, wishlist, and cart icon links in the TopBar
const NavIcons = () => {
  const { getCartCount, wishlistItems } = useCart();

  const cartCount = getCartCount();
  const wishlistCount = wishlistItems.length;

  // Icon definitions — count > 0 triggers a badge overlay
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
        <Link
          className="tb-topbar-icon-link"
          key={to}
          to={to}
          data-label={label}
        >
          <span className="tb-topbar-icon-wrapper">
            {icon}
            {/* Badge — only rendered when the count is non-zero */}
            {count > 0 && <span className="tb-topbar-icon-badge">{count}</span>}
          </span>
        </Link>
      ))}
    </>
  );
};

export default NavIcons;
