import React, { useEffect, useState, useRef } from "react";
import usePagination from "../../hooks/usePagination";
import PaginationControls from "../../hooks/paginationControls";
import SortByButton from "../../Components/SortByButton";
import ExportButton from "../../Components/ExportButton";
import AddStudentButton from "../../Components/AddStudentButton";
import swal from "sweetalert2";
import { FaChevronDown } from "react-icons/fa";

function Dashboard() {
  const [sortOrder, setSortOrder] = useState("Ascending");
  const dropdownRef = useRef(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  const [filters, setFilters] = useState({
    yearLevel: "",
    semester: "",
    course: "",
    section: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    yearLevels: [],
    semesters: [],
    courses: [],
    sections: [],
  });
  // ── Sort state ───────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("last_name");

  // ── Row selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // ── Fetch functions ──────────────────────────────────────────────────────────

  const fetchStudents = async ({ page, limit }) => {
    const filterParams = new URLSearchParams();
    if (filters.yearLevel) filterParams.append("yearLevel", filters.yearLevel);
    if (filters.semester) filterParams.append("semester", filters.semester);
    if (filters.course) filterParams.append("course", filters.course);
    if (filters.section) filterParams.append("section", filters.section);

    const response = await fetch(
      `http://localhost:3001/students/getStudent?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&${filterParams.toString()}`,
    );
    return await response.json();
  };

  const searchStudents = async ({ query, page, limit }) => {
    const filterParams = new URLSearchParams();
    if (filters.yearLevel) filterParams.append("yearLevel", filters.yearLevel);
    if (filters.semester) filterParams.append("semester", filters.semester);
    if (filters.course) filterParams.append("course", filters.course);
    if (filters.section) filterParams.append("section", filters.section);

    const response = await fetch(
      `http://localhost:3001/students/searchStudent?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&${filterParams.toString()}`,
    );
    return await response.json();
  };

  const fetchFilterOptions = async () => {
    try {
      setFilterOptionsLoading(true);
      const response = await fetch(
        "http://localhost:3001/students/getFilterOptions",
      );
      const data = await response.json();

      // Transform the data into the format expected by the UI
      setFilterOptions({
        yearLevels: [
          { value: "", label: "All Year Levels" },
          ...data.yearLevels.map((year) => ({
            value: year.toString(),
            label: `${getYearLabel(year)} Year`,
          })),
        ],
        semesters: [
          { value: "", label: "All Semesters" },
          ...data.semesters.map((sem) => ({
            value: sem.toString(),
            label: `${getSemesterLabel(sem)} Semester`,
          })),
        ],
        courses: [
          { value: "", label: "All Courses" },
          ...data.courses.map((course) => ({
            value: course,
            label: course,
          })),
        ],
        sections: [
          { value: "", label: "All Sections" },
          ...data.sections.map((section) => ({
            value: section.toString(),
            label: `Section ${section}`,
          })),
        ],
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      // Set fallback options if API fails
      setFilterOptions({
        yearLevels: [{ value: "", label: "All Year Levels" }],
        semesters: [{ value: "", label: "All Semesters" }],
        courses: [{ value: "", label: "All Courses" }],
        sections: [{ value: "", label: "All Sections" }],
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  // Helper functions for labels
  const getYearLabel = (year) => {
    const labels = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
    return labels[year] || `${year}th`;
  };

  const getSemesterLabel = (semester) => {
    const labels = { 1: "1st", 2: "2nd" };
    return labels[semester] || `${semester}th`;
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // Trigger new fetch with updated filters
    fetchData(1, searchQuery, itemsPerPage);
    setSelectedIds(new Set());
  };

  // Add clear filters function (update the existing one)
  const clearFilters = () => {
    setFilters({
      yearLevel: "",
      semester: "",
      course: "",
      section: "",
    });
    fetchData(1, searchQuery, itemsPerPage);
    setSelectedIds(new Set());
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

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // ── Re-fetch when sort changes ───────────────────────────────────────────────
  useEffect(() => {
    fetchData(1, searchQuery, itemsPerPage);
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, filters]);

  // Add student function
  const addStudent = () => {
    swal
      .fire({
        title: "Add New Student",
        html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Serial Number
            </label>
            <input id="card_serial_number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Student Number
            </label>
            <input id="student_number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input id="full_name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" style="text-transform: uppercase">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <input id="course" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input id="section" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>
          </div>
        </div>
      `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          const card_serial_number =
            document.getElementById("card_serial_number").value;
          const student_number =
            document.getElementById("student_number").value;
          const full_name = document.getElementById("full_name").value;
          const course = document.getElementById("course").value;
          const section = document.getElementById("section").value;
          if (!card_serial_number || !student_number || !full_name) {
            swal.showValidationMessage("Please fill in all required fields");
            return false;
          }
          return {
            card_serial_number,
            student_number,
            full_name,
            course,
            section,
          };
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          const {
            card_serial_number,
            student_number,
            full_name,
            course,
            section,
          } = result.value;
          fetch("http://localhost:3001/students/addStudent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              card_serial_number,
              student_number,
              full_name,
              course,
              section,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message) {
                swal.fire("Success!", data.message, "success");
                fetchData();
              } else {
                swal.fire(
                  "Error!",
                  data.error || "Failed to add student",
                  "error",
                );
              }
            })
            .catch((error) => {
              swal.fire(
                "Error!",
                error.message || "Failed to add student",
                "error",
              );
            });
        }
      });
  };

  // Initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dropdown options
  const sortFields = [
    "Name",
    "Student Number",
    "Course",
    "Year Level",
    "Card Type",
    "Date Enrolled",
    "Enrollment Status",
  ];
  const sortOrders = ["Ascending", "Descending"];

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const allCurrentSelected =
    students.length > 0 && students.every((s) => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentSelected) {
      students.forEach((s) => next.delete(s.id));
    } else {
      students.forEach((s) => next.add(s.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-blue-200">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage and view student records
            </p>
          </div>

          {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        </div>

        {/* ── Selection status bar ────────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>{selectedIds.size}</strong> row
              {selectedIds.size !== 1 ? "s" : ""} selected
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
        <div className="rounded-lg mb-6 flex gap-6">
          <form
            onSubmit={onSearchSubmit}
            className="flex gap-4 shadow-sm rounded-lg  flex-1"
          >
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search students by name, student number, course, etc..."
                className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <SortByButton
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortColumn={setSortBy}
              onSortOrder={setSortOrder}
            />
            <ExportButton
              searchQuery={searchQuery}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              selectedIds={selectedIds}
            />
            <AddStudentButton onAdd={addStudent} />
          </div>
        </div>

        {/* ── Filter Section ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={filterOptionsLoading}
            >
              Clear All Filters
            </button>
          </div>

          {filterOptionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Year Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Level
                  </label>
                  <div className="relative">
                    <select
                      value={filters.yearLevel}
                      onChange={(e) =>
                        handleFilterChange("yearLevel", e.target.value)
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      {filterOptions.yearLevels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Semester Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <div className="relative">
                    <select
                      value={filters.semester}
                      onChange={(e) =>
                        handleFilterChange("semester", e.target.value)
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      {filterOptions.semesters.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <div className="relative">
                    <select
                      value={filters.course}
                      onChange={(e) =>
                        handleFilterChange("course", e.target.value)
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      {filterOptions.courses.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Section Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <div className="relative">
                    <select
                      value={filters.section}
                      onChange={(e) =>
                        handleFilterChange("section", e.target.value)
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      {filterOptions.sections.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filters.yearLevel ||
                filters.semester ||
                filters.course ||
                filters.section) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Active filters:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {filters.yearLevel && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Year:{" "}
                          {
                            filterOptions.yearLevels.find(
                              (opt) => opt.value === filters.yearLevel,
                            )?.label
                          }
                          <button
                            onClick={() => handleFilterChange("yearLevel", "")}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {filters.semester && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Semester:{" "}
                          {
                            filterOptions.semesters.find(
                              (opt) => opt.value === filters.semester,
                            )?.label
                          }
                          <button
                            onClick={() => handleFilterChange("semester", "")}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {filters.course && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Course: {filters.course}
                          <button
                            onClick={() => handleFilterChange("course", "")}
                            className="ml-1 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {filters.section && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Section:{" "}
                          {
                            filterOptions.sections.find(
                              (opt) => opt.value === filters.section,
                            )?.label
                          }
                          <button
                            onClick={() => handleFilterChange("section", "")}
                            className="ml-1 text-yellow-600 hover:text-yellow-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Serial Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const isSelected = selectedIds.has(student.id);
                    const isEditing = editingId === student.id;
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
                          {isEditing ? (
                            <input
                              type="text"
                              value={
                                editData.card_serial_number ||
                                student.card_serial_number
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  card_serial_number: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            student.card_serial_number || "—"
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={
                                editData.student_number ||
                                student.student_number
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  student_number: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            student.student_number
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={
                                editData.full_name ||
                                `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  full_name: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.course || student.course || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  course: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            student.course || "—"
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              max="4"
                              value={
                                editData.semester || student.semester || ""
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  semester: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            student.semester || "—"
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              max="4"
                              value={
                                editData.year_level || student.year_level || ""
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  year_level: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            student.year_level || "—"
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.section || student.section || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  section: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            student.section || "—"
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <div className="flex gap-1 px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  swal
                                    .fire({
                                      title: "Save Changes",
                                      text: "Are you sure you want to save changes to this student?",
                                      icon: "question",
                                      showCancelButton: true,
                                      confirmButtonText: "Yes, save",
                                      cancelButtonText: "No, cancel",
                                    })
                                    .then((result) => {
                                      if (result.isConfirmed) {
                                        // Implement save logic here, e.g., send updated data to backend
                                        setEditingId(null); // Exit edit mode after saving
                                        setEditData({}); // Clear edit data after saving
                                        fetchData(); // Refresh data to show updates
                                      }
                                    });
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null); // Exit edit mode
                                  setEditData({}); // Clear edit data on cancel
                                }}
                                className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setEditingId(student.id); // Enter edit mode
                                  setEditData({
                                    card_serial_number:
                                      student.card_serial_number,
                                    student_number: student.student_number,
                                    full_name:
                                      `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim(),
                                    year_level: student.year_level, // Add year_level to edit data
                                    course: student.course,
                                    section: student.section,
                                  }); // Pre-fill edit data
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => {
                                  swal
                                    .fire({
                                      title: "Delete Student",
                                      text: "Are you sure you want to delete this student?",
                                      icon: "warning",
                                      showCancelButton: true,
                                      confirmButtonText: "Yes, delete",
                                      cancelButtonText: "No, cancel",
                                    })
                                    .then((result) => {
                                      if (result.isConfirmed) {
                                        // Implement delete logic here, e.g., send delete request to backend
                                        fetchData(); // Refresh data to show updates after deletion
                                      }
                                    });
                                }}
                                className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          )}
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
