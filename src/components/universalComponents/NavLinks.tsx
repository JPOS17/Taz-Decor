import { NavLink } from "react-router-dom";
import "../../styles/components/universal/TopBar.css";

const links = [
  { to: "/home", label: "Home" },
  { to: "/items", label: "Items" },
  { to: "/reviews", label: "Reviews" },
  { to: "/about", label: "About" },
];

export const NavLinks = () => {
  return (
    <>
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isActive ? "tb-nav-link tb-nav-link-active" : "tb-nav-link"
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  );
};

export default NavLinks;
