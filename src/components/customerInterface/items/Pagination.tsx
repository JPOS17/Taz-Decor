import "../../../styles/components/customerInterface/items/Pagination.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Build the page number array with ellipsis logic
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className="pg-pagination-wrapper">
      {/* Item count summary */}
      <span className="pg-pagination-summary">
        Showing {startItem}–{endItem} of {totalItems} items
      </span>

      <div className="pg-pagination-controls">
        {/* Prev button */}
        <button
          className="pg-pagination-btn pg-pagination-btn-nav"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 2 4 7 9 12" />
          </svg>
          <span className="pg-pagination-btn-nav-label">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="pg-pagination-pages">
          {pageNumbers.map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="pg-pagination-ellipsis">
                …
              </span>
            ) : (
              <button
                key={page}
                className={[
                  "pg-pagination-btn",
                  "pg-pagination-btn-page",
                  page === currentPage ? "pg-pagination-btn-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handlePageChange(page as number)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Mobile-only: Page X of Y sits between < and > */}
        <span className="pg-pagination-mobile-indicator">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next button */}
        <button
          className="pg-pagination-btn pg-pagination-btn-nav"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span className="pg-pagination-btn-nav-label">Next</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="5 2 10 7 5 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
