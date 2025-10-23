import { HiMiniMagnifyingGlass } from "react-icons/hi2";

const SearchModal = () => {
  return (
    <>
      <button
        className="nav-link active d-md-none"
        type="button"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
        aria-label="Open search modal"
      >
        <HiMiniMagnifyingGlass size={20} />
      </button>

      <div
        className="modal fade"
        id="exampleModal"
        tabIndex={0}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-body">
                <form
                  className="d-flex"
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log("Search submitted!");
                  }}
                >
                  <input
                    className="form-control me-2"
                    type="search"
                    placeholder="Search..."
                    aria-label="Search"
                    autoFocus
                  />
                </form>
              </div>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;
