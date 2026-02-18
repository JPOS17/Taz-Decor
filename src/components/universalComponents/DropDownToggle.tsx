import { FaBars } from "react-icons/fa";

const DropDownToggle = () => {
  return (
    <>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNavAltMarkup"
        aria-controls="navbarNavAltMarkup"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <FaBars />
      </button>
    </>
  );
};

export default DropDownToggle;
