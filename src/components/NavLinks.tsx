import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
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
