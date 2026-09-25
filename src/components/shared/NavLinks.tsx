import { NavLink } from "react-router-dom";

// Top-level navigation destinations rendered in the TopBar
const links = [
  { to: "/home", label: "Home" },
  { to: "/items", label: "Items" },
  { to: "/reviews", label: "Reviews" },
  { to: "/about", label: "About" },
];

// Renders each nav link; applies active class when the route matches
export const NavLinks = () => {
  return (
    <>
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isActive ? "top-bar-nav-link top-bar-nav-link-active" : "top-bar-nav-link"
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  );
};

export default NavLinks;
