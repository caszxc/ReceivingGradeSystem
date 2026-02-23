import React from "react";

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  hasNext,
  hasPrevious,
  goToPage,
  nextPage,
  previousPage,
  getVisiblePages,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  const itemsPerPageOptions = [10, 20, 50];

  // Enhanced pagination logic for compact display
  const getPaginationNumbers = () => {
    // If 4 or fewer pages, show all
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    // Always show page 1
    pages.push(1);

    if (currentPage <= 3) {
      // Near the beginning: 1, 2, 3, ..., last
      for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
        pages.push(i);
      }
      if (totalPages > 3) {
        pages.push("...");
        pages.push(totalPages);
      }
    } else if (currentPage >= totalPages - 2) {
      // Near the end: 1, ..., last-2, last-1, last
      pages.push("...");
      for (let i = Math.max(2, totalPages - 2); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle: 1, ..., current, ..., last
      pages.push("...");
      pages.push(currentPage);
      pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const paginationNumbers = getPaginationNumbers();

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      {/* Mobile pagination */}
      <div className="flex-1 flex justify-between items-center sm:hidden">
        <button
          onClick={previousPage}
          disabled={!hasPrevious}
          className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-700">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded text-xs px-1 py-1 bg-white"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={nextPage}
          disabled={!hasNext}
          className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{totalItems}</span> results
          </p>
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
              Show:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md text-sm px-3 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {/* Previous button */}
              <button
                onClick={previousPage}
                disabled={!hasPrevious}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Page numbers */}
              {paginationNumbers.map((page, index) => (
                <React.Fragment key={index}>
                  {page === "..." ? (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-default">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => goToPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-150 ${
                        currentPage === page
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                      title={`Go to page ${page}`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}

              {/* Next button */}
              <button
                onClick={nextPage}
                disabled={!hasNext}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaginationControls;
