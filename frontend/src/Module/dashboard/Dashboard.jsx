import React, { useEffect, useState, useRef } from "react";
import usePagination from "../../hooks/usePagination";
import PaginationControls from "../../hooks/paginationControls";

// ── Sort column options ────────────────────────────────────────────────────────
const SORT_COLUMNS = [
  { label: "Name", value: "last_name" },
  { label: "Student Number", value: "student_number" },
  { label: "Course", value: "course" },
  { label: "Year Level", value: "year_level" },
  { label: "Card Type", value: "card_type" },
  { label: "Date Enrolled", value: "date_enrolled" },
  { label: "Enrollment Status", value: "card_status" },
];

function Dashboard() {
  // ── Sort state ───────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("last_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  // ── Export state ─────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(null); // 'all' | 'page' | 'selected'
  const exportMenuRef = useRef(null);

  // ── Row selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Fetch functions ──────────────────────────────────────────────────────────
  const fetchStudents = async ({ page, limit }) => {
    const response = await fetch(
      `http://localhost:3001/students/getStudent?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    return await response.json();
  };

  const searchStudents = async ({ query, page, limit }) => {
    const response = await fetch(
      `http://localhost:3001/students/searchStudent?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    return await response.json();
  };

  // ── Pagination hook ──────────────────────────────────────────────────────────
  const {
    items: students,
    loading,
    searchQuery,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNext,
    hasPrevious,
    itemsPerPage,
    fetchData,
    goToPage,
    nextPage,
    previousPage,
    handleSearch,
    clearSearch,
    setSearchQuery,
    getVisiblePages,
    handleItemsPerPageChange,
  } = usePagination({
    fetchFunction: fetchStudents,
    searchFunction: searchStudents,
    itemsPerPage: 10,
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const onClearSearch = () => {
    clearSearch();
  };

  // ── Close dropdowns outside click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target))
        setShowSortMenu(false);
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
        setShowFormatMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Re-fetch when sort changes ───────────────────────────────────────────────
  useEffect(() => {
    fetchData(1, searchQuery, itemsPerPage);
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sort handlers ─────────────────────────────────────────────────────────────
  const handleSortColumn = (val) => {
    setSortBy(val);
    setShowSortMenu(false);
  };

  const handleSortOrder = (val) => {
    setSortOrder(val);
    setShowSortMenu(false);
  };

  const currentSortLabel =
    SORT_COLUMNS.find((c) => c.value === sortBy)?.label ?? "Name";

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const allCurrentSelected =
    students.length > 0 && students.every((s) => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      const next = new Set(selectedIds);
      students.forEach((s) => next.delete(s.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      students.forEach((s) => next.add(s.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ── Export handler ────────────────────────────────────────────────────────────
  const handleExport = async (scope, format) => {
    setShowExportMenu(false);
    setShowFormatMenu(null);

    if (scope === "selected" && selectedIds.size === 0) {
      alert("Please select at least one row to export.");
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams({
        format,
        scope,
        sortBy,
        sortOrder,
      });

      if (scope === "page") {
        params.set("page", currentPage);
        params.set("limit", itemsPerPage);
      }

      if (searchQuery && searchQuery.trim() !== "") {
        params.set("query", searchQuery.trim());
      }

      if (scope === "selected") {
        [...selectedIds].forEach((id) => params.append("ids[]", id));
      }

      const url = `http://localhost:3001/students/exportStudents?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      link.href = objectUrl;
      link.download = match ? match[1] : `students_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── Dark-themed format sub-menu ──────────────────────────────────────────────
  const FormatSubMenu = ({ scope, label }) => (
    <div className="border-b border-gray-100 last:border-0">
      <div
        className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${showFormatMenu === scope
            ? "bg-blue-600 text-white"
            : "text-gray-900 hover:bg-blue-600 hover:text-white"
          }`}
        onClick={() => setShowFormatMenu((prev) => (prev === scope ? null : scope))}
      >
        <span>{label}</span>
        <svg
          className={`h-3 w-3 opacity-60 transition-transform duration-150 ${showFormatMenu === scope ? "rotate-90" : ""}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
      </div>
      {showFormatMenu === scope && (
        <div className="bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => handleExport(scope, "xlsx")}
            className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 19l-2-3h1.2l1.3 2 1.3-2H11.5l-2 3H8.5zm4.2 0l-2-5h1.3l1.35 3.5L14.7 14H16l-2 5h-1.3zm4.3 0v-5H18v5h-1z" />
            </svg>
            Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport(scope, "csv")}
            className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV (.csv)
          </button>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and view student records</p>
          </div>

          {/* ── Toolbar: Sort By + Export ───────────────────────────────────── */}
          <div className="flex items-center gap-3">

            {/* Sort By */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu((p) => !p)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="font-semibold tracking-wide uppercase text-xs">Sort by</span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showSortMenu ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                  {/* Column choices */}
                  {SORT_COLUMNS.map((col) => (
                    <button
                      key={col.value}
                      onClick={() => handleSortColumn(col.value)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${sortBy === col.value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {col.label}
                      {sortBy === col.value && (
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-1" />

                  {/* Direction */}
                  <button
                    onClick={() => handleSortOrder("asc")}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${sortOrder === "asc"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Ascending
                    {sortOrder === "asc" && (
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleSortOrder("desc")}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${sortOrder === "desc"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Descending
                    {sortOrder === "desc" && (
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Export split button */}
            <div className="relative flex" ref={exportMenuRef}>
              {/* Main action button */}
              <button
                disabled={exporting}
                onClick={() => {
                  setShowExportMenu(false);
                  setShowFormatMenu(null);
                  // Default: open "all" format picker quickly
                  setShowExportMenu(true);
                  setShowFormatMenu("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold uppercase rounded-l-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                {exporting ? "Exporting…" : "Export"}
              </button>

              {/* Chevron / dropdown trigger */}
              <button
                disabled={exporting}
                onClick={() => {
                  setShowExportMenu((p) => !p);
                  setShowFormatMenu(null);
                }}
                className="inline-flex items-center px-2 py-2 bg-blue-700 text-white text-sm font-medium rounded-r-lg border-l border-blue-500 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Export dropdown */}
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">

                  <FormatSubMenu scope="all" label="All" />

                  <FormatSubMenu scope="page" label="Current page" />

                  <div className="border-b border-gray-100 last:border-0">
                    <div
                      className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${selectedIds.size === 0
                        ? "text-black cursor-not-allowed"
                        : showFormatMenu === "selected"
                          ? "bg-blue-600 text-white cursor-pointer"
                          : "text-black hover:bg-blue-600 cursor-pointer"
                        }`}
                      onClick={() => {
                        if (selectedIds.size === 0) return;
                        setShowFormatMenu((prev) => (prev === "selected" ? null : "selected"));
                      }}
                    >
                      <span className="flex items-center gap-2">
                        Selected rows
                        {selectedIds.size > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full leading-none">
                            {selectedIds.size}
                          </span>
                        )}
                      </span>
                      {selectedIds.size > 0 && (
                        <svg
                          className={`h-3 w-3 opacity-70 transition-transform duration-150 ${showFormatMenu === "selected" ? "rotate-90" : ""}`}
                          fill="currentColor" viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {showFormatMenu === "selected" && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={() => handleExport("selected", "xlsx")}
                          className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 19l-2-3h1.2l1.3 2 1.3-2H11.5l-2 3H8.5zm4.2 0l-2-5h1.3l1.35 3.5L14.7 14H16l-2 5h-1.3zm4.3 0v-5H18v5h-1z" />
                          </svg>
                          Excel (.xlsx)
                        </button>
                        <button
                          onClick={() => handleExport("selected", "csv")}
                          className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          CSV (.csv)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Status bar: sort + selection info ──────────────────────────────── */}
        {(selectedIds.size > 0) && (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>{selectedIds.size}</strong> row{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs underline hover:no-underline text-blue-600"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* ── Search Bar ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={onSearchSubmit} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search students by name, student number, course, etc..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Checkbox column */}
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Enrolled
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const isSelected = selectedIds.has(student.id);
                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(student.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.student_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {`${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.course || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.year_level || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.card_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.card_status === "Active"
                              ? "bg-green-100 text-green-800"
                              : student.card_status === "Inactive"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {student.card_status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.date_enrolled)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            itemsPerPage={itemsPerPage}
            goToPage={goToPage}
            nextPage={nextPage}
            previousPage={previousPage}
            getVisiblePages={getVisiblePages}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
