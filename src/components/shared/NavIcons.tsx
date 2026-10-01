import { NavLink } from "react-router-dom";
import { User, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";

// Caps the badge text so large counts never stretch the pill
const formatCount = (count: number): string => (count > 99 ? "99+" : String(count));

// Renders the profile, wishlist, and cart icon links in the TopBar
const NavIcons = () => {
  const { getCartCount, wishlistItems } = useCart();

  const cartCount = getCartCount();
  const wishlistCount = wishlistItems.length;

  // Icon definitions — count > 0 triggers a badge overlay
  const icons = [
    {
      to: "/profile",
      icon: <User size={22} strokeWidth={1.75} />,
      label: "Profile",
      count: 0,
    },
    {
      to: "/saved",
      icon: <Heart size={22} strokeWidth={1.75} />,
      label: "Saved",
      count: wishlistCount,
    },
    {
      to: "/cart",
      icon: <ShoppingBag size={22} strokeWidth={1.75} />,
      label: "Cart",
      count: cartCount,
    },
  ];

  return (
    <>
      {icons.map(({ to, icon, label, count }) => (
        <NavLink
          key={to}
          to={to}
          data-label={label}
          aria-label={
            count > 0
              ? `${label}, ${count} ${count === 1 ? "item" : "items"}`
              : label
          }
          className={({ isActive }) =>
            isActive
              ? "top-bar-icon-link top-bar-icon-link-active"
              : "top-bar-icon-link"
          }
        >
          <span className="top-bar-icon-wrapper">
            {icon}
            {/* Badge */}
            {count > 0 && (
              <span className="top-bar-icon-badge" aria-hidden="true">
                {formatCount(count)}
              </span>
            )}
          </span>
        </NavLink>
      ))}
    </>
  );
};

export default NavIcons;