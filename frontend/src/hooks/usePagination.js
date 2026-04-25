import { useState, useRef, useEffect } from "react";

const usePagination = ({
  fetchFunction,
  searchFunction,
  itemsPerPage = 10,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);
  const debounceRef = useRef();
  const [filters, setFilters] = useState({});

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / currentItemsPerPage);

  // Fetch data with pagination
  const fetchData = async (
    page = currentPage,
    query = "",
    limit = currentItemsPerPage,
    filtersOverride = filters,
  ) => {
    setLoading(true);
    try {
      let response;
      const activeFilters = filtersOverride || filters;

      if (query && searchFunction) {
        setIsSearching(true);
        response = await searchFunction({
          query,
          page,
          limit,
          filters: activeFilters,
        });
      } else {
        setIsSearching(false);
        response = await fetchFunction({
          page,
          limit,
          filters: activeFilters,
        });
      }

      if (response && response.rows) {
        setItems(response.rows);
        setTotalItems(response.count);
      } else {
        setItems([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchData(page, searchQuery, currentItemsPerPage, filters);
    }
  };

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Go to previous page
  const previousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // // Handle search
  // const handleSearch = (query) => {
  //   setSearchQuery(query);
  //   setCurrentPage(1);
  //   fetchData(1, query, currentItemsPerPage);
  // };

  // // Clear search
  // const clearSearch = () => {
  //   setSearchQuery("");
  //   setCurrentPage(1);
  //   fetchData(1, "", currentItemsPerPage);
  // };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);

    // Debounce: clear previous timeout
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchData(1, query, currentItemsPerPage, filters);
    }, 400); // 400ms debounce
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setCurrentItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    fetchData(1, searchQuery, newItemsPerPage, filters);
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters); // ← Store new filters in state
    setCurrentPage(1); // ← Reset to page 1 (important!)
  };

  useEffect(() => {
    // Skip on initial mount
    if (Object.keys(filters).length === 0) return;

    // Fetch data whenever filters change
    fetchData(1, searchQuery, currentItemsPerPage, filters);
  }, [filters]);

  // Refresh current page
  const refresh = () => {
    fetchData(currentPage, searchQuery, currentItemsPerPage);
  };

  // Reset pagination
  const reset = () => {
    setCurrentPage(1);
    setSearchQuery("");
    setItems([]);
    setTotalItems(0);
    setIsSearching(false);
    setCurrentItemsPerPage(itemsPerPage);
    setFilters({});
  };

  // Get pagination info
  const paginationInfo = {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: currentItemsPerPage,
    startIndex: (currentPage - 1) * currentItemsPerPage + 1,
    endIndex: Math.min(currentPage * currentItemsPerPage, totalItems),
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };

  // Get visible page numbers for pagination UI
  const getVisiblePages = (maxVisible = 5) => {
    const pages = [];
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return {
    // Data
    items,
    loading,
    searchQuery,
    isSearching,

    // Pagination info
    ...paginationInfo,

    // Actions
    fetchData,
    goToPage,
    nextPage,
    previousPage,
    handleSearch,
    // clearSearch,
    refresh,
    reset,
    updateFilters,
    setSearchQuery,
    handleItemsPerPageChange,

    // Utilities
    getVisiblePages,
  };
};

export default usePagination;
