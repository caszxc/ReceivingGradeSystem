import React, { useEffect, useState, useRef } from "react";
import usePagination from "../../hooks/usePagination";
import PaginationControls from "../../hooks/PaginationControls";
import SortByButton from "../../Components/SortByButton";
import ExportButton from "../../Components/ExportButton";
import EnrollStudentButton from "../../Components/enrollstudentbutton";
import AddStudentButton from "../../Components/AddStudentButton";
import swal from "sweetalert2";
import { FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FILTERS_KEY = "dashboardFilters";

function loadFilters() {
  const saved = localStorage.getItem(FILTERS_KEY);
  return saved ? JSON.parse(saved) : null;
}

function saveFilters(filters) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

function Dashboard() {
  const [sortOrder, setSortOrder] = useState("Ascending");
  const dropdownRef = useRef(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [dateYearDropdownOpen, setDateYearDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const dateYearRef = useRef(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  // const academicYear =
  //   currentMonth >= 6
  //     ? `${currentYear}-${currentYear + 1}`
  //     : `${currentYear - 1}-${currentYear}`;

  //uncomment kapag need
  const defaultAyStart = currentMonth >= 6 ? currentYear : currentYear - 1;
  // const defaultAcademicYear = `${defaultAyStart}-${defaultAyStart + 1}`;

  const [filters, setFilters] = useState(() => {
    // const saved = loadFilters();
    // if (saved) return saved;

    return {
      yearLevel: "",
      semester: "",
      course: "",
      section: "",
      // academicYear: "",
    };
  });

  const [filterOptions, setFilterOptions] = useState({
    yearLevels: [],
    semesters: [],
    courses: [],
    sections: [],
    dateYears: [],
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

    //uncomment kapag need
    // if (filters.academicYear) {
    //   const [fromYear, toYear] = filters.academicYear.split("-");
    //   filterParams.append("dateYearFrom", fromYear);
    //   filterParams.append("dateYearTo", toYear);
    // }

    // if (filters.dateYearFrom)
    //   filterParams.append("dateYearFrom", filters.dateYearFrom);
    // if (filters.dateYearTo)
    //   filterParams.append("dateYearTo", filters.dateYearTo);

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

    //uncomment kapag need
    // if (filters.academicYear) {
    //   const [fromYear, toYear] = filters.academicYear.split("-");
    //   filterParams.append("dateYearFrom", fromYear);
    //   filterParams.append("dateYearTo", toYear);
    // }

    // if (filters.dateYearFrom)
    //   filterParams.append("dateYearFrom", filters.dateYearFrom);
    // if (filters.dateYearTo)
    //   filterParams.append("dateYearTo", filters.dateYearTo);

    const response = await fetch(
      `http://localhost:3001/students/searchStudent?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&${filterParams.toString()}`,
    );
    return await response.json();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (dateYearRef.current && !dateYearRef.current.contains(event.target)) {
        setDateYearDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //fetch filter options default
  // useEffect(() => {
  //   // Only fetch defaults on first load
  //   fetch("http://localhost:3001/settings/default-filters")
  //     .then((res) => res.json())
  //     .then((defaults) => {
  //       // Only set if filters are empty (or you can always set if you want to force defaults)
  //       setFilters((prev) => ({
  //         ...prev,
  //         yearLevel: defaults.yearLevel || "",
  //         semester: defaults.semester || "",
  //         course: defaults.course || "",
  //         section: defaults.section || "",
  //         // academicYear: defaults.academicYear || defaultAcademicYear,
  //       }));
  //     });
  //   // eslint-disable-next-line
  // }, []);

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
          { value: "", label: "" },
          ...data.yearLevels.map((year) => ({
            value: year.toString(),
            label: `${getYearLabel(year)}`,
          })),
        ],
        semesters: [
          { value: "", label: "" },
          ...data.semesters.map((sem) => ({
            value: sem.toString(),
            label: `${getSemesterLabel(sem)}`,
          })),
        ],
        courses: [
          { value: "", label: "" },
          ...data.courses.map((course) => ({
            value: course,
            label: course,
          })),
        ],
        sections: [{ value: "", label: "" }],
        dateYears: [
          { value: "", label: "" },
          ...data.dateYears.map((year) => ({
            value: year.toString(),
            label: year.toString(),
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
        dateYears: [{ value: "", label: "All Years" }],
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  // Helper functions for labels
  const getYearLabel = (year) => {
    const labels = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
    return labels[year] || `${year}`;
  };

  const getSemesterLabel = (semester) => {
    const labels = { 1: "1st", 2: "2nd" };
    return labels[semester] || `${semester}`;
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };

    // When course changes, reset section and fetch available sections
    if (filterType === "course") {
      newFilters.section = "";
      if (value) {
        fetchSectionsByCourse(value);
      } else {
        setFilterOptions((prev) => ({
          ...prev,
          sections: [{ value: "", label: "" }],
        }));
      }
    }

    setFilters(newFilters);
    saveFilters(newFilters);
    fetchData(1, searchQuery, itemsPerPage);
    setSelectedIds(new Set());
  };

  const fetchSectionsByCourse = async (course) => {
    try {
      const response = await fetch(
        `http://localhost:3001/students/getSectionsByCourse?course=${encodeURIComponent(course)}`,
      );
      const data = await response.json();
      setFilterOptions((prev) => ({
        ...prev,
        sections: [
          { value: "", label: "" },
          ...data.sections.map((section) => ({
            value: section.toString(),
            label: `${section}`,
          })),
        ],
      }));
    } catch (error) {
      console.error("Error fetching sections by course:", error);
    }
  };

  // Add clear filters function (update the existing one)
  const clearFilters = () => {
    const cleared = {
      yearLevel: "",
      semester: "",
      course: "",
      section: "",
      //uncomment kapag need
      // academicYear: "",
      // dateYearFrom: "",
      // dateYearTo: "",
    };
    setFilters(cleared);
    saveFilters(cleared);
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

  // Helper function to format full name safely
  const formatFullName = (firstName, middleName, lastName) => {
    const nameParts = [
      firstName || "",
      middleName || "",
      lastName || "",
    ].filter((part) => part && part.trim() !== "" && part !== "null");

    return nameParts.length > 0 ? nameParts.join(" ") : "";
  };

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
            Student Number
          </label>
          <input id="student_number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
        
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input id="first_name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" style="text-transform: uppercase">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <input id="middle_name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" style="text-transform: uppercase">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input id="last_name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" style="text-transform: uppercase">
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <input id="course" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" style="text-transform: uppercase">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Year Level
            </label>
            <div className="relative">
              <select id="year_level" class="w-full px-3 py-2 pr-2 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer">
                <option value="">Select Year</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
               
            </div>
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
          const student_number =
            document.getElementById("student_number").value;
          const first_name = document.getElementById("first_name").value;
          const middle_name = document.getElementById("middle_name").value;
          const last_name = document.getElementById("last_name").value;
          const course = document.getElementById("course").value;
          const year_level = document.getElementById("year_level").value;
          const section = document.getElementById("section").value;

          return {
            student_number,
            first_name,
            middle_name,
            last_name,
            course,
            year_level,
            section,
          };
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          const {
            student_number,
            first_name,
            middle_name,
            last_name,
            course,
            year_level,
            section,
          } = result.value;

          // Create full name for display
          const fullNameParts = [first_name, middle_name, last_name].filter(
            (part) => part && part.trim(),
          );
          const displayFullName =
            fullNameParts.length > 0
              ? fullNameParts.join(" ")
              : "No name provided";

          // Show confirmation dialog with student details
          swal
            .fire({
              title: "Confirm Student Addition",
              html: `
            <div class="text-left space-y-2">
              <p class="text-lg font-medium text-gray-900 mb-4">Are you sure you want to add this student?</p>
              <div class="bg-gray-50 p-4 rounded-lg">
                <div class="grid grid-cols-1 gap-2 text-sm">
                  ${student_number ? `<div><span class="font-medium">Student Number:</span> ${student_number}</div>` : ""}
                  ${fullNameParts.length > 0 ? `<div><span class="font-medium">Full Name:</span> ${displayFullName.toUpperCase()}</div>` : ""}
                  ${course ? `<div><span class="font-medium">Course:</span> ${course}</div>` : ""}
                  ${year_level ? `<div><span class="font-medium">Year Level:</span> ${year_level}</div>` : ""}
                  ${section ? `<div><span class="font-medium">Section:</span> ${section}</div>` : ""}
                </div>
              </div>
            </div>
          `,
              icon: "question",
              showCancelButton: true,
              confirmButtonText: "Yes, Add Student",
              cancelButtonText: "No, Cancel",
              confirmButtonColor: "#3b82f6",
              cancelButtonColor: "#6b7280",
            })
            .then((confirmResult) => {
              if (confirmResult.isConfirmed) {
                // Proceed with API call
                fetch("http://localhost:3001/students/addStudent", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    student_number,
                    first_name,
                    middle_name,
                    last_name,
                    course,
                    year_level,
                    section,
                  }),
                })
                  .then((response) => response.json())
                  .then((data) => {
                    if (data.success) {
                      swal.fire({
                        title: "Success!",
                        text: data.message,
                        icon: "success",
                        confirmButtonColor: "#10b981",
                      });
                      fetchData(); // Refresh the student list
                    } else {
                      swal.fire({
                        title: "Error!",
                        text: data.error || "Failed to add student",
                        icon: "error",
                        confirmButtonColor: "#ef4444",
                      });
                    }
                  })
                  .catch((error) => {
                    swal.fire({
                      title: "Error!",
                      text: error.message || "Failed to add student",
                      icon: "error",
                      confirmButtonColor: "#ef4444",
                    });
                  });
              }
            });
        }
      });
  };

  const enrollStudent = () => {
    swal
      .fire({
        title: "Enroll Student",
        html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Card Serial Number
          </label>
          <input id="card_serial_number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Student Number
          </label>
          <input id="student_number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
      </div>
    `,
        showCancelButton: true,
        confirmButtonText: "Enroll",
        cancelButtonText: "Cancel",
        focusConfirm: false,
        preConfirm: () => {
          const cardSerialNumber = document
            .getElementById("card_serial_number")
            .value.trim();
          const studentNumber = document
            .getElementById("student_number")
            .value.trim();

          // Check if both are empty
          if (!cardSerialNumber && !studentNumber) {
            swal.showValidationMessage(
              "Either card serial number or student number must be provided",
            );
            return false;
          }

          return { cardSerialNumber, studentNumber };
        },
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const { cardSerialNumber, studentNumber } = result.value;

          try {
            // Enroll the student with either serial number or student number
            const enrollRes = await fetch(
              `http://localhost:3001/students/enrollStudent/0`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  cardSerialNumber: cardSerialNumber || undefined,
                  studentNumber: studentNumber || undefined,
                }),
              },
            );

            const enrollData = await enrollRes.json();

            if (enrollRes.ok) {
              swal.fire(
                "Success",
                `${enrollData.student.first_name} ${enrollData.student.last_name} has been enrolled successfully`,
                "success",
              );
              // Refresh the data
              fetchData(currentPage, searchQuery, itemsPerPage);
            } else {
              swal.fire(
                "Error",
                enrollData.message || "Failed to enroll student",
                "error",
              );
            }
          } catch (error) {
            swal.fire(
              "Error",
              error.message || "Failed to enroll student",
              "error",
            );
          }
        }
      });
  };

  // Initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // const academicYearOptions = Array.from({ length: 6 }, (_, i) => {
  //   const start = defaultAyStart - i;
  //   return `${start}-${start + 1}`;
  // });

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-blue-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage and view student records
            </p>
            {/*Uncomment kapag need*/}
            {/* <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
              {filters.semester
                ? `${getSemesterLabel(parseInt(filters.semester))} Semester`
                : "All Semester"}{" "}
              A.Y. {filters.academicYear ? filters.academicYear : academicYear}
            </span> */}

            {/* <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
              {filters.semester
                ? `${getSemesterLabel(parseInt(filters.semester))} Semester`
                : "All Semester"}{" "}
              A.Y.{" "}
              {filters.dateYearFrom && filters.dateYearTo
                ? `${filters.dateYearFrom}-${filters.dateYearTo}`
                : academicYear}
            </span> */}
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
            {/* <SortByButton
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortColumn={setSortBy}
              onSortOrder={setSortOrder}
            /> */}

            <ExportButton
              searchQuery={searchQuery}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              selectedIds={selectedIds}
              filters={filters}
            />
            <AddStudentButton onAdd={addStudent} />
            <EnrollStudentButton onEnroll={enrollStudent} />
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
              {[...Array(5)].map((_, index) => (
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
                      disabled={!filters.course}
                      className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer ${!filters.course ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
                    >
                      {!filters.course ? (
                        <option value="">Select a course first</option>
                      ) : (
                        filterOptions.sections.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      )}
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

                {/* Academic Year Filter */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <div className="relative">
                    <select
                      value={filters.academicYear}
                      onChange={(e) =>
                        handleFilterChange("academicYear", e.target.value)
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      <option value=""></option>
                      {academicYearOptions.map((ay) => (
                        <option key={ay} value={ay}>
                          A.Y {ay}
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
                </div> */}

                {/* Date Year Range Filter */}
                {/* <div className="relative " ref={dateYearRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Year
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDateYearDropdownOpen(!dateYearDropdownOpen)
                    }
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer text-left text-sm"
                  >
                    {filters.dateYearFrom || filters.dateYearTo
                      ? `${filters.dateYearFrom || "..."} — ${filters.dateYearTo || "..."}`
                      : "All Years"}
                  </button>
                  <div
                    className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                    style={{ top: "28px" }}
                  >
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

                  {dateYearDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            From
                          </label>
                          <select
                            value={filters.dateYearFrom}
                            onChange={(e) =>
                              handleFilterChange("dateYearFrom", e.target.value)
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white cursor-pointer"
                          >
                            <option value="">—</option>
                            {filterOptions.dateYears
                              .filter((opt) => opt.value !== "")
                              .map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </div>
                        <span className="text-gray-400 mt-5">—</span>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            To
                          </label>
                          <select
                            value={filters.dateYearTo}
                            onChange={(e) =>
                              handleFilterChange("dateYearTo", e.target.value)
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white cursor-pointer"
                          >
                            <option value="">—</option>
                            {filterOptions.dateYears
                              .filter(
                                (opt) =>
                                  opt.value !== "" &&
                                  (!filters.dateYearFrom ||
                                    parseInt(opt.value) >=
                                      parseInt(filters.dateYearFrom)),
                              )
                              .map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div> */}
              </div>

              {/* Active Filters Display */}
              {/* {(filters.yearLevel ||
                filters.semester ||
                filters.course ||
                filters.section ||
                filters.dateYearFrom ||
                filters.dateYearTo) && (
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
                      {(filters.dateYearFrom || filters.dateYearTo) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Date Year: {filters.dateYearFrom || "..."} —{" "}
                          {filters.dateYearTo || "..."}
                          <button
                            onClick={() => {
                              handleFilterChange("dateYearFrom", "");
                              setFilters((prev) => ({
                                ...prev,
                                dateYearFrom: "",
                                dateYearTo: "",
                              }));
                              fetchData(1, searchQuery, itemsPerPage);
                            }}
                            className="ml-1 text-orange-600 hover:text-orange-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )} */}
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
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Number
                  </th> */}
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

                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                            student.student_number || "—"
                          )}
                        </td> */}

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
                                formatFullName(
                                  student.first_name,
                                  student.middle_name,
                                  student.last_name,
                                )
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
                            formatFullName(
                              student.first_name,
                              student.middle_name,
                              student.last_name,
                            ) || "—"
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
                          <div className="flex gap-1 px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                navigate(`/view-student/${student.id}`)
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                // delete logic
                              }}
                              className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
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
