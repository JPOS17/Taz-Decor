import { NavLink } from "react-router-dom";

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
            isActive ? "nav-link active" : "nav-link"
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  );
};

export default NavLinks;
