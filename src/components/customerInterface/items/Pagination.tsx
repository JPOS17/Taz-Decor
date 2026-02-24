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

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    // Show pages around current
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className="pagination-wrapper">
      {/* Item count summary */}
      <span className="pagination-summary">
        Showing {startItem}–{endItem} of {totalItems} items
      </span>

      <div className="pagination-controls">
        {/* Prev button */}
        <button
          className="pagination-btn pagination-btn--nav"
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
          <span className="pagination-btn--nav-label">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="pagination-pages">
          {pageNumbers.map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                …
              </span>
            ) : (
              <button
                key={page}
                className={`pagination-btn pagination-btn--page ${
                  page === currentPage ? "pagination-btn--active" : ""
                }`}
                onClick={() => handlePageChange(page as number)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Next button */}
        <button
          className="pagination-btn pagination-btn--nav"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span className="pagination-btn--nav-label">Next</span>
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
