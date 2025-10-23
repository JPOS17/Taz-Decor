import "../styles/SideBar.css";
import { useState } from "react";

const SideBar = () => {
  const [activeLink, setActiveLink] = useState("#All");

  return (
    <nav className="sidebar d-none d-md-flex bg-body-tertiary">
      <ul className="nav flex-column">
        {[
          "#Our Lady of Guadalupe",
          "#Baptism sets & Candles",
          "#mens",
          "#kids",
        ].map((link) => (
          <li key={link} className="nav-item">
            <a
              href={link}
              className={`nav-link text-dark ${
                activeLink === link ? "active" : ""
              }`}
              aria-current={activeLink === link ? "page" : undefined}
              onClick={() => setActiveLink(link)}
            >
              <span className="sidebar-link-text">
                {link.replace("#", "").charAt(0).toUpperCase() + link.slice(2)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SideBar;
