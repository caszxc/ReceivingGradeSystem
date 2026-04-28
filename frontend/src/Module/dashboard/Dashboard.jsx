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
import { convertYearLevelForDisplay } from "../../utils/yearLevelConverter";
import { collapseToShortCourse } from "../../utils/courseConverter";
import { BASE_URL } from "../../Api/baseUrl";
import axios from "axios";

function Dashboard() {
  const [sortOrder, setSortOrder] = useState("Ascending");
  const dropdownRef = useRef(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [dateYearDropdownOpen, setDateYearDropdownOpen] = useState(false);
  const isFirstRender = useRef(true);
  const navigate = useNavigate();
  const dateYearRef = useRef(null);

  const [filters, setFilters] = useState(() => {
    return {
      academicYear: "",
      yearLevel: "",
      semester: "",
      course: "",
      section: "",
    };
  });

  const [filterOptions, setFilterOptions] = useState({
    yearLevels: [],
    semesters: [],
    courses: [],
    coursesWithMajors: [],
    sections: [],
    dateYears: [],
  });
  // ── Sort state ───────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("last_name");
  const [isInitialized, setIsInitialized] = useState(false);

  // ── Row selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // ── Fetch functions ──────────────────────────────────────────────────────────

  const fetchStudents = async ({ page, limit, filters: filterOverride }) => {
    const activeFilters = filterOverride || filters;
    const filterParams = new URLSearchParams();
    if (activeFilters.academicYear)
      filterParams.append("academicYear", activeFilters.academicYear);
    if (activeFilters.yearLevel)
      filterParams.append("yearLevel", activeFilters.yearLevel);
    if (activeFilters.semester)
      filterParams.append("semester", activeFilters.semester);
    if (activeFilters.course)
      filterParams.append("course", activeFilters.course);
    if (activeFilters.section)
      filterParams.append("section", activeFilters.section);

    // const response = await fetch(
    //   `http://localhost:3001/students/getStudent?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&${filterParams.toString()}`,
    // );
    // return await response.json();
    const response = await axios.get(
      BASE_URL +
        "/students/getStudent?page=" +
        page +
        "&limit=" +
        limit +
        "&sortBy=" +
        sortBy +
        "&sortOrder=" +
        sortOrder +
        "&" +
        filterParams.toString(),
    );

    return response.data;
  };

  const searchStudents = async ({
    query,
    page,
    limit,
    filters: filterOverride,
  }) => {
    const activeFilters = filterOverride || filters;
    const filterParams = new URLSearchParams();
    if (activeFilters.academicYear)
      filterParams.append("academicYear", activeFilters.academicYear);
    if (activeFilters.yearLevel)
      filterParams.append("yearLevel", activeFilters.yearLevel);
    if (activeFilters.semester)
      filterParams.append("semester", activeFilters.semester);
    if (activeFilters.course)
      filterParams.append("course", activeFilters.course);
    if (activeFilters.section)
      filterParams.append("section", activeFilters.section);

    // const response = await fetch(
    //   `http://localhost:3001/students/searchStudent?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&${filterParams.toString()}`,
    // );
    // return await response.json();

    const response = await axios.get(
      BASE_URL +
        "/students/searchStudent?query=" +
        encodeURIComponent(query) +
        "&page=" +
        page +
        "&limit=" +
        limit +
        "&sortBy=" +
        sortBy +
        "&sortOrder=" +
        sortOrder +
        "&" +
        filterParams.toString(),
    );
    return response.data;
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

  const mapOrBlank = (arr, mapper) => {
    return Array.isArray(arr) && arr.length > 0
      ? arr.map(mapper)
      : [{ value: "", label: "" }];
  };

  // Fetch filter options for dropdowns
  const fetchFilterOptions = async () => {
    try {
      setFilterOptionsLoading(true);
      // const response = await fetch(
      //   "http://localhost:3001/students/getFilterOptions",
      // );
      // const data = await response.json();
      const response = await axios.get(BASE_URL + "/students/getFilterOptions");
      const data = response.data;

      const defaultAcademicYear = data.activeAcademicYear?.id;

      setFilterOptions({
        // yearLevels: [
        //   { value: "", label: "" },
        yearLevels: data.yearLevels.map((year) => ({
          value: year.toString(),
          label: convertYearLevelForDisplay(year),
        })),

        // semesters: [
        //   { value: "", label: "" },
        semesters: data.semesters.map((sem) => ({
          value: sem.toString(),
          label: `${getSemesterLabel(sem)}`,
        })),

        // courses: [
        //   { value: "", label: "" },
        courses: data.courses.map((course) => ({
          id: course.id,
          name: course.name,
          value: course.id,
          label: course.name,
        })),

        coursesWithMajors: data.coursesWithMajors || [], // NEW - store full data with majors

        // sections: [{ value: "", label: "" }],
        sections:
          data.sections && data.sections.length > 0
            ? data.sections.map((section) => ({
                value: section,
                label: section,
              }))
            : [],

        // dateYears: [
        //   { value: "", label: "" },
        dateYears: data.dateYears.map((year) => ({
          value: year.toString(),
          label: year.toString(),
        })),

        // academicYears: [
        //   { value: "", label: "" },
        academicYears: data.academicYears.map((year) => ({
          value: year.id,
          label: `${year.academic_year}${year.isActive ? " (Active)" : ""}`,
          isActive: year.isActive,
        })),
      });

      return defaultAcademicYear;
    } catch (error) {
      console.error("Error fetching filter options:", error);
      // setFilterOptions({
      //   yearLevels: [{ value: "", label: "All Year Levels" }],
      //   semesters: [{ value: "", label: "All Semesters" }],
      //   courses: [{ value: "", label: "All Courses" }],
      //   coursesWithMajors: [],
      //   sections: [{ value: "", label: "All Sections" }],
      //   dateYears: [{ value: "", label: "All Years" }],
      //   academicYears: [{ value: "", label: "No Academic Years" }],
      // });

      setFilterOptions({
        yearLevels: [{ value: "", label: "" }],
        semesters: [{ value: "", label: "" }],
        courses: [{ value: "", label: "" }],
        coursesWithMajors: [],
        sections: [{ value: "", label: "" }],
        dateYears: [{ value: "", label: "" }],
        academicYears: [{ value: "", label: "" }],
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  // Fetch filters
  // useEffect(() => {
  //   fetchFilterOptions().then((defaultAcademicYear) => {
  //     if (defaultAcademicYear) {
  //       setFilters((prev) => ({
  //         ...prev,
  //         academicYear: defaultAcademicYear,
  //       }));
  //     }
  //     setIsInitialized(true);
  //   });

  //   // Fetch active semester and set as default
  //   const fetchActiveSemester = async () => {
  //     try {
  //       const response = await fetch(
  //         "http://localhost:3001/settings/getActiveSemester",
  //       );
  //       const data = await response.json();
  //       const activeSem = data.activeSemester || "1ST SEMESTER";

  //       setFilters((prev) => ({
  //         ...prev,
  //         semester: activeSem,
  //       }));
  //     } catch (err) {
  //       console.error("Error fetching active semester:", err);
  //     }
  //   };

  //   fetchActiveSemester();
  // }, []);

  useEffect(() => {
    let initialFilters = {
      academicYear: "",
      yearLevel: "",
      semester: "",
      course: "",
      section: "",
    };

    // Step 1: Fetch filter options
    fetchFilterOptions().then((defaultAcademicYear) => {
      if (defaultAcademicYear) {
        initialFilters.academicYear = defaultAcademicYear;
      }

      // Step 2: Fetch active semester
      const fetchActiveSemester = async () => {
        try {
          // const response = await fetch(
          //   "http://localhost:3001/settings/getActiveSemester",
          // );
          // const data = await response.json();
          const response = await axios.get(
            BASE_URL + "/settings/getActiveSemester",
          );
          const data = response.data;
          const activeSem = data.activeSemester || "1ST SEMESTER";
          initialFilters.semester = activeSem;

          // Step 3: Set BOTH local filters AND sync to hook
          setFilters(initialFilters);
          updateFilters(initialFilters); // ← SYNC to usePagination!

          // Step 4: Only NOW mark as initialized
          setIsInitialized(true);
        } catch (err) {
          console.error("Error fetching active semester:", err);
          // Fallback: still initialize even if semester fetch fails
          setFilters(initialFilters);
          updateFilters(initialFilters);
          setIsInitialized(true);
        }
      };

      fetchActiveSemester();
    });
  }, []);

  // Display filtered data
  useEffect(() => {
    if (!isInitialized) return;

    fetchData(1, searchQuery, itemsPerPage);
    setSelectedIds(new Set());
  }, [sortBy, sortOrder, filters, isInitialized]);

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

    updateFilters(newFilters);
    setSelectedIds(new Set());
  };

  const fetchSectionsByCourse = async (course) => {
    try {
      // const response = await fetch(
      //   `http://localhost:3001/students/getSectionsByCourse?course=${encodeURIComponent(course)}`,
      // );
      // const data = await response.json();
      const response = await axios.get(
        `${BASE_URL}/students/getSectionsByCourse?course=${encodeURIComponent(course)}`,
      );
      const data = response.data;
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

  // const clearFilters = () => {
  //   const cleared = {
  //     academicYear: filters.academicYear,
  //     yearLevel: "",
  //     semester: filters.semester,
  //     course: "",
  //     section: "",
  //   };
  //   setFilters(cleared);

  //   fetchData(1, searchQuery, itemsPerPage, cleared);
  //   setSelectedIds(new Set());
  // };

  const clearFilters = () => {
    const cleared = {
      academicYear: filters.academicYear, // Keep academic year
      yearLevel: "",
      semester: filters.semester, // Keep semester
      course: "",
      section: "",
    };

    setFilters(cleared);
    updateFilters(cleared); // ← Use updateFilters, not fetchData!
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
    updateFilters,
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

  // Helper function to format full name safely
  const formatFullName = (firstName, middleName, lastName) => {
    const nameParts = [
      firstName || "",
      middleName || "",
      lastName || "",
    ].filter((part) => part && part.trim() !== "" && part !== "null");

    return nameParts.length > 0 ? nameParts.join(" ") : "";
  };

  // Add student function
  const addStudent = () => {
    let selectedCourse = ""; // Track selected course for section fetching
    let availableSections = []; // Track available sections

    // Build course options with majors for display
    const courseOptions = filterOptions.coursesWithMajors
      .map((course) => `<option value="${course.id}">${course.name}</option>`)
      .join("");

    swal
      .fire({
        title: "Add New Student",
        html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Student Number
            </label>
            <input id="student_number" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs">
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input id="first_name" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" style="text-transform: uppercase">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input id="middle_name" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" style="text-transform: uppercase">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input id="last_name" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" style="text-transform: uppercase">
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Course
              </label>
              <select id="course_id" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-xs">
                <option value="">Select Course</option>
                ${courseOptions}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Year Level
              </label>
              <select id="year_level" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-xs">
                <option value="">Select Year Level</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Section
              </label>
              <div class="relative">
                <input 
                  id="add_section" 
                  list="add_section_list"
                  placeholder="Select or type new section" 
                  class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  autocomplete="off"
                />
                <datalist id="add_section_list"></datalist>
              </div>
            </div>
          </div>
        </div>
    `,
        focusConfirm: false,
        showCancelButton: true,
        didOpen: () => {
          // Add event listener to course dropdown
          const courseSelect = document.getElementById("course_id");
          const sectionInput = document.getElementById("add_section");
          const sectionDatalist = document.getElementById("add_section_list");
          const yearLevelSelect = document.getElementById("year_level");

          // Initial state
          yearLevelSelect.disabled = true;
          sectionInput.disabled = true;

          courseSelect.addEventListener("change", async (e) => {
            selectedCourse = e.target.value;

            // Reset Dependent fields
            yearLevelSelect.value = "";
            yearLevelSelect.innerHTML = `<option value="">Select Year Level</option>`;
            yearLevelSelect.disabled = true;

            sectionInput.value = "";
            sectionDatalist.innerHTML = "";
            sectionInput.disabled = true;

            if (selectedCourse) {
              try {
                //Fetch year levels for selected course
                const res = await fetch(
                  `${BASE_URL}/students/getYearLevelsByCourse?course_id=${selectedCourse}`,
                );
                const data = await res.json();
                const yearLevels = data.yearLevels || [];

                yearLevelSelect.disabled = false;

                yearLevelSelect.innerHTML =
                  `<option value="">Select Year Level</option>` +
                  yearLevels
                    .map((y) => `<option value="${y}">${y}</option>`)
                    .join("");
              } catch (error) {
                console.error("Error fetching year levels:", error);
              }
            } else {
              yearLevelSelect.disabled = true;
              sectionInput.disabled = true;
              yearLevelSelect.innerHTML = `<option value="">Select Year Level</option>`;
              sectionDatalist.innerHTML = "";
              sectionInput.value = "";
              sectionInput.disabled = true;
            }
          });

          // Handle year level change - fetch sections if course is selected
          yearLevelSelect.addEventListener("change", async (e) => {
            const yearLevel = e.target.value;

            sectionInput.value = "";
            sectionInput.disabled = true;
            sectionDatalist.innerHTML = "";

            if (yearLevel) {
              try {
                const res = await fetch(
                  `http://localhost:3001/students/getSectionsByCourseAndYear?course_id=${selectedCourse}&year_level=${yearLevel}`,
                );
                const data = await res.json();
                const sections = data.sections || [];

                sectionInput.disabled = false;
                sectionDatalist.innerHTML = sections
                  .map((s) => `<option value="${s}">${s}</option>`)
                  .join("");
              } catch (error) {
                console.error("Error fetching sections:", error);
              }
            } else {
              sectionInput.disabled = true;
              sectionDatalist.innerHTML = "";
              sectionInput.value = "";
            }
          });
        },
        preConfirm: () => {
          const student_number =
            document.getElementById("student_number").value;
          const first_name = document.getElementById("first_name").value;
          const middle_name = document.getElementById("middle_name").value;
          const last_name = document.getElementById("last_name").value;
          const course_id = document.getElementById("course_id").value;
          const year_level = document.getElementById("year_level").value;
          const section = document.getElementById("add_section").value;

          return {
            student_number,
            first_name,
            middle_name,
            last_name,
            course_id,
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
            course_id,
            year_level,
            section,
          } = result.value;

          // Get course name from filterOptions
          // const courseObj = filterOptions.courses.find(
          //   (c) => c.value == course_id,
          // );
          // const course = courseObj ? courseObj.label : "";
          // const courseObj = (filterOptions.courses || []).find(
          //   (c) => String(c.value) === String(course_id),
          // );
          // const course = courseObj ? courseObj.label : "";

          // Create full name for display
          const fullNameParts = [first_name, middle_name, last_name].filter(
            (part) => part && part.trim(),
          );
          const displayFullName =
            fullNameParts.length > 0
              ? fullNameParts.join(" ")
              : "No name provided";

          const selectedCourse = filterOptions.coursesWithMajors.find(
            (course) => course.id.toString() === course_id,
          );

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
                  ${course_id ? `<div><span class="font-medium">Course:</span> ${selectedCourse ? selectedCourse.name : "N/A"}</div>` : ""}
                  ${year_level ? `<div><span class="font-medium">Year Level:</span> ${convertYearLevelForDisplay(year_level)}</div>` : ""}
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
                axios
                  .post(BASE_URL + "/students/addStudent", {
                    student_number,
                    first_name,
                    middle_name,
                    last_name,
                    course_id: parseInt(course_id) || null,
                    year_level,
                    section,
                  })
                  .then((response) => {
                    const data = response.data;
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
                    const apiMessage =
                      error?.response?.data?.error ||
                      error?.response?.data?.message;
                    swal.fire({
                      title: "Error!",
                      text:
                        apiMessage || error.message || "Failed to add student",
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
    // Helper function to extract major from course name
    const extractMajorFromCourse = (courseName) => {
      // Extract text after dash: "BSBA-FM" → "FM", "BSED-SCIENCE" → "SCIENCE"
      const match = courseName.match(/-(.+)$/);
      return match ? match[1].toUpperCase() : null;
    };

    let selectedStudent = null;
    let selectedCourse = "";
    let selectedMajor = "";
    let availableSections = [];

    const showSearchDialog = () => {
      swal
        .fire({
          title: "Enroll Student - Search",
          html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Serial Number
          </label>
          <input id="search_serial_number" placeholder="Enter card serial number" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs">
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Student Number
          </label>
          <input id="search_student_number" placeholder="Enter student number" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs">
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Name
          </label>
          <input id="search_name" placeholder="Enter student name" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs">
        </div>

        <div id="search_results_container" class="hidden mt-4">
          <label class="block text-xs font-medium text-gray-700 mb-2">
            Search Results
          </label>
          <div id="search_results" class="border border-gray-300 rounded-lg max-h-48 overflow-y-auto"></div>
        </div>
      </div>
    `,
          showCancelButton: true,
          confirmButtonText: "Next",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
          focusConfirm: false,
          didOpen: async () => {
            const searchSerialInput = document.getElementById(
              "search_serial_number",
            );
            const searchNumberInput = document.getElementById(
              "search_student_number",
            );
            const searchNameInput = document.getElementById("search_name");
            const searchResultsContainer = document.getElementById(
              "search_results_container",
            );
            const searchResults = document.getElementById("search_results");

            // Search function
            const performSearch = async () => {
              const serial = searchSerialInput.value.trim();
              const studentNumber = searchNumberInput.value.trim();
              const name = searchNameInput.value.trim();

              if (!serial && !studentNumber && !name) {
                swal.showValidationMessage(
                  "Enter at least one search criterion",
                );
                return;
              }

              // Validate that serial and student number fields are not both filled
              if (serial && studentNumber) {
                swal.showValidationMessage(
                  "Please use either Serial Number OR Student Number field, not both",
                );
                return;
              }

              // Determine which field is being used and validate accordingly
              let searchQuery = "";
              let searchBy = "";
              if (serial) {
                // Serial number field: search only by serial
                searchQuery = serial;
                searchBy = "serial";
              } else if (studentNumber) {
                // Student number field: search only by student number
                searchQuery = studentNumber;
                searchBy = "studentNumber";
              } else if (name) {
                // Name field: search by name
                searchQuery = name;
                searchBy = "name";
              }

              try {
                searchResults.innerHTML =
                  '<div class="text-xs text-gray-500 p-2">Searching...</div>';
                searchResultsContainer.classList.remove("hidden");
                // const response = await fetch(
                //   `http://localhost:3001/students/searchStudent?query=${encodeURIComponent(searchQuery)}&limit=10`,
                // );
                // const data = await response.json();
                const response = await axios.get(
                  `${BASE_URL}/students/searchStudent`,
                  {
                    params: {
                      query: searchQuery,
                      limit: 10,
                      searchBy,
                    },
                  },
                );

                const data = response.data;

                if (data.rows && data.rows.length > 0) {
                  // Auto-select if searching by serial or student number and only 1 result
                  if ((serial || studentNumber) && data.rows.length === 1) {
                    const student = data.rows[0];
                    const fullName = [
                      student.first_name,
                      student.middle_name,
                      student.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    selectedStudent = {
                      id: student.id,
                      name: fullName,
                      number: student.student_number,
                    };

                    searchResults.innerHTML = `<div class="p-2 bg-green-50 border border-green-300 rounded text-xs font-medium text-green-700">
                    Auto-selected: ${fullName} (${student.student_number})
                  </div>`;

                    // Auto-proceed to enrollment dialog after a short delay
                    setTimeout(() => {
                      swal.close();
                      showEnrollmentDialog();
                    }, 500);
                    return;
                  }

                  // Show results for manual selection
                  let resultsHTML = '<div class="divide-y divide-gray-200">';
                  data.rows.forEach((student) => {
                    const fullName = [
                      student.first_name,
                      student.middle_name,
                      student.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    resultsHTML += `
                <div class="p-2 hover:bg-blue-50 cursor-pointer student-result text-xs" data-id="${student.id}" data-name="${fullName}" data-number="${student.student_number}" data-serial="${student.card_serial_number || ""}">
                  <div class="font-medium">${fullName}</div>
                  <div class="text-gray-500">Student #: ${student.student_number}</div>
                  <div class="text-gray-500">Serial: ${student.card_serial_number || "N/A"}</div>
                </div>
              `;
                  });
                  resultsHTML += "</div>";
                  searchResults.innerHTML = resultsHTML;

                  document.querySelectorAll(".student-result").forEach((el) => {
                    el.addEventListener("click", () => {
                      const studentId = el.getAttribute("data-id");
                      const studentName = el.getAttribute("data-name");
                      const studentNumber = el.getAttribute("data-number");

                      selectedStudent = {
                        id: studentId,
                        name: studentName,
                        number: studentNumber,
                      };

                      searchResults.innerHTML = `<div class="p-2 bg-green-50 border border-green-300 rounded text-xs font-medium text-green-700">
                    Selected: ${studentName} (${studentNumber})
                  </div>`;
                    });
                  });
                } else {
                  searchResults.innerHTML =
                    '<div class="text-xs text-red-500 p-2">No students found</div>';
                }
              } catch (error) {
                searchResults.innerHTML =
                  '<div class="text-xs text-red-500 p-2">Error searching students</div>';
                console.error("Search error:", error);
              }
            };

            // Auto-search and auto-select on Enter for serial or student number
            const handleEnterKey = async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                await performSearch();
              }
            };

            searchSerialInput.addEventListener("keypress", handleEnterKey);
            searchNumberInput.addEventListener("keypress", handleEnterKey);
            searchNameInput.addEventListener("keypress", handleEnterKey);

            const createSearchButton = document.createElement("button");
            createSearchButton.textContent = "Search";
            createSearchButton.className =
              "px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 mr-2";
            createSearchButton.addEventListener("click", () => performSearch());

            const searchContainer = document.querySelector(
              ".swal2-html-container",
            );
            if (searchContainer) {
              const buttonWrapper = document.createElement("div");
              buttonWrapper.className = "mt-4";
              buttonWrapper.appendChild(createSearchButton);
              searchContainer.appendChild(buttonWrapper);
            }

            // Focus on serial number input by default
            searchSerialInput.focus();
          },
          preConfirm: () => {
            if (!selectedStudent) {
              swal.showValidationMessage(
                "Please select a student from the results",
              );
              return false;
            }
            return selectedStudent;
          },
        })
        .then(async (result) => {
          if (result.isConfirmed) {
            selectedStudent = result.value;
            showEnrollmentDialog();
          }
        });
    };

    const showEnrollmentDialog = async () => {
      // Fetch latest enrollment for this student
      let latestEnrollment = null;
      try {
        // const enrollResponse = await fetch(
        //   `http://localhost:3001/students/getLatestEnrollment/${selectedStudent.id}`,
        // );
        // const enrollData = await enrollResponse.json();
        const enrollResponse = await axios.get(
          `${BASE_URL}/students/getLatestEnrollment/${selectedStudent.id}`,
        );

        const enrollData = enrollResponse.data;
        if (enrollData.success && enrollData.enrollment) {
          latestEnrollment = enrollData.enrollment;
        }
      } catch (err) {
        console.error("Error fetching latest enrollment:", err);
      }

      // Build semester options
      const semesterOptions = filterOptions.semesters
        .filter((s) => s.value !== "")
        .map((s) => `<option value="${s.value}">${s.label}</option>`)
        .join("");

      // Build course options with major extraction
      const courseOptions = filterOptions.coursesWithMajors
        .map((course) => {
          const major = extractMajorFromCourse(course.name);
          return `<option value="${course.id}" data-major="${major || ""}">${course.name}</option>`;
        })
        .join("");

      swal
        .fire({
          title: "Enroll Student - Details",
          html: `
    <div class="space-y-4 text-left">
      <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div class="text-xs font-medium text-gray-700">Student Information</div>
        <div class="text-xs text-gray-600 mt-1">${selectedStudent.name}</div>
        <div class="text-xs text-gray-600">${selectedStudent.number}</div>
      </div>

      <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Course
            </label>
            <select id="enroll_course" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-xs">
              <option value="">Select Course</option>
              ${courseOptions}
            </select>
          </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Year Level
          </label>
          <select id="enroll_year_level" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-xs">
            <option value="">Select Year Level</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Section
          </label>
          <div class="relative">
            <input 
              id="enroll_section" 
              list="enroll_section_list"
              placeholder="Select or type new section" 
              class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              autocomplete="off"
            />
            <datalist id="enroll_section_list"></datalist>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Semester
          </label>
          <select id="enroll_semester" class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-xs">
            <option value="">Select Semester</option>
            ${semesterOptions}
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Major (Auto-populated)
          </label>
          <input 
            id="enroll_major" 
            type="text"
            placeholder="Automatically filled based on course" 
            class="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-100 text-xs"
            readonly
          />
        </div>
      </div>
    </div>
  `,
          showCancelButton: true,
          confirmButtonText: "Enroll",
          cancelButtonText: "Back",
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#6b7280",
          focusConfirm: false,
          didOpen: () => {
            const yearLevelSelect =
              document.getElementById("enroll_year_level");
            const semesterSelect = document.getElementById("enroll_semester");
            const courseSelect = document.getElementById("enroll_course");
            const majorInput = document.getElementById("enroll_major");
            const sectionInput = document.getElementById("enroll_section");
            const sectionDatalist = document.getElementById(
              "enroll_section_list",
            );

            // Pre-populate with latest enrollment data
            if (latestEnrollment) {
              if (latestEnrollment.year_level) {
                yearLevelSelect.value = latestEnrollment.year_level;
              }
              if (latestEnrollment.semester) {
                semesterSelect.value = latestEnrollment.semester;
              }

              if (latestEnrollment.course_id) {
                // Set course value after a slight delay to ensure DOM is ready
                setTimeout(() => {
                  courseSelect.value = latestEnrollment.course_id;

                  // Extract and populate major
                  const selectedOption =
                    courseSelect.options[courseSelect.selectedIndex];
                  selectedMajor =
                    selectedOption.getAttribute("data-major") || "";
                  majorInput.value = selectedMajor;

                  courseSelect.dispatchEvent(new Event("change"));
                }, 0);

                // Fetch sections for this course
                fetch(
                  `${BASE_URL}/students/getSectionsByCourseAndYear?course_id=${latestEnrollment.course_id}&year_level=${latestEnrollment.year_level}`,
                )
                  .then((res) => res.json())
                  .then((data) => {
                    availableSections = data.sections || [];

                    sectionDatalist.innerHTML = availableSections
                      .map((s) => `<option value="${s}"></option>`)
                      .join("");

                    if (latestEnrollment.section) {
                      sectionInput.value = latestEnrollment.section;
                    }
                  })
                  .catch((error) => {
                    console.error("Error fetching sections:", error);
                  });
              }
            }

            // Handle course change - extract and populate major
            courseSelect.addEventListener("change", async (e) => {
              selectedCourse = e.target.value;

              // Reset Dependent Fields
              yearLevelSelect.value = "";
              sectionInput.value = "";
              sectionInput.disabled = true;
              sectionDatalist.innerHTML = "";
              availableSections = [];

              if (selectedCourse) {
                try {
                  // Extract major from selected course
                  const selectedOption =
                    courseSelect.options[courseSelect.selectedIndex];
                  selectedMajor =
                    selectedOption.getAttribute("data-major") || "";
                  majorInput.value = selectedMajor;

                  // Fetch year levels based on course
                  const res = await fetch(
                    `${BASE_URL}/students/getYearLevelsByCourse?course_id=${selectedCourse}`,
                  );
                  const data = await res.json();

                  const yearLevels = data.yearLevels || [];

                  yearLevelSelect.disabled = false;

                  // Populate year level dropdown
                  yearLevelSelect.innerHTML =
                    `<option value="">Select Year Level</option>` +
                    yearLevels
                      .map((y) => `<option value="${y}">${y}</option>`)
                      .join("");

                  /* setTimeout(() => {
                    if (yearLevels.includes(latestEnrollment.year_level)) {
                      yearLevelSelect.value = latestEnrollment.year_level;
                    }
                  }, 0); */
                } catch (error) {
                  console.error("Error fetching year levels:", error);
                }
              } else {
                // Reset everything if no course
                selectedMajor = "";
                majorInput.value = "";
                yearLevelSelect.disabled = true;
              }
            });

            // Handle year level change - refetch sections if course is selected
            yearLevelSelect.addEventListener("change", async () => {
              const yearLevel = yearLevelSelect.value;
              const courseId = courseSelect.value;
              sectionInput.value = "";

              if (courseId && yearLevel) {
                try {
                  const response = await fetch(
                    `http://localhost:3001/students/getSectionsByCourseAndYear?course_id=${courseId}&year_level=${yearLevel}`,
                  );
                  const data = await response.json();
                  availableSections = data.sections || [];
                  sectionInput.disabled = false;
                  sectionDatalist.innerHTML = availableSections
                    .map((s) => `<option value="${s}"></option>`)
                    .join("");
                } catch (error) {
                  console.error("Error fetching sections:", error);
                }
              } else {
                sectionInput.disabled = true;
                sectionInput.value = "";
              }
            });
          },
          preConfirm: () => {
            const courseSelect = document.getElementById("enroll_course");
            const yearLevel =
              document.getElementById("enroll_year_level").value;
            const semester = document.getElementById("enroll_semester").value;
            const courseId = courseSelect.value;
            const section = document.getElementById("enroll_section").value;

            if (!yearLevel) {
              swal.showValidationMessage("Please select a year level");
              return false;
            }
            if (!semester) {
              swal.showValidationMessage("Please select a semester");
              return false;
            }
            if (!courseId) {
              swal.showValidationMessage("Please select a course");
              return false;
            }
            if (!section) {
              swal.showValidationMessage("Please enter a section");
              return false;
            }

            return {
              yearLevel,
              semester,
              courseId,
              section,
              major: selectedMajor,
            };
          },
        })
        .then(async (result) => {
          if (!result.isConfirmed) {
            if (result.isDismissed && result.dismiss === "cancel") {
              showSearchDialog();
            }
            return;
          }

          const { yearLevel, semester, courseId, section, major } =
            result.value;

          try {
            //  const enrollRes = await fetch(
            //     `http://localhost:3001/students/enrollStudent/${selectedStudent.id}`,
            //     {
            //       method: "PATCH",
            //       headers: { "Content-Type": "application/json" },
            //       body: JSON.stringify({
            //         year_level: yearLevel,
            //         semester,
            //         course_id: parseInt(courseId),
            //         section,
            //         major,
            //       }),
            //     },
            //   );

            //   const enrollData = await enrollRes.json();
            const enrollRes = await axios.patch(
              `${BASE_URL}/students/enrollStudent/${selectedStudent.id}`,
              {
                year_level: yearLevel,
                semester,
                course_id: parseInt(courseId, 10),
                section,
                major,
              },
            );

            const enrollData = enrollRes.data;

            if (enrollData.success) {
              swal.fire(
                "Success",
                `${selectedStudent.name} has been enrolled successfully`,
                "success",
              );
              fetchData(currentPage, searchQuery, itemsPerPage);
            } else {
              swal.fire(
                "Error",
                enrollData.message || "Failed to enroll student",
                "error",
              );
            }
          } catch (error) {
            const enrollData = error.response?.data;
            const status = error.response?.status;

            if (status === 409 && enrollData?.code === "ALREADY_ENROLLED") {
              const existingEnrollment = enrollData.existingEnrollment;

              const confirmResult = await swal.fire({
                title: "Student Already Enrolled",
                html: `
          <div class="text-left space-y-3">
            <p class="text-sm text-gray-700">${enrollData.message}</p>
            <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p class="text-xs font-medium text-gray-700 mb-2">Current Enrollment:</p>
              <div class="text-xs text-gray-600 space-y-1">
                <p><span class="font-medium">Semester:</span> ${existingEnrollment.semester}</p>
                <p><span class="font-medium">Year Level:</span> ${convertYearLevelForDisplay(existingEnrollment.year_level)}</p>
                <p><span class="font-medium">Section:</span> ${existingEnrollment.section || "N/A"}</p>
                <p><span class="font-medium">Major:</span> ${existingEnrollment.major || "N/A"}</p>
                <p><span class="font-medium">Date Enrolled:</span> ${new Date(existingEnrollment.date_enrolled).toLocaleDateString()}</p>
              </div>
            </div>
            <p class="text-sm text-gray-700 font-medium">Do you want to update the enrollment anyway?</p>
          </div>
        `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, Update",
                cancelButtonText: "No, Cancel",
                confirmButtonColor: "#f59e0b",
                cancelButtonColor: "#6b7280",
              });

              if (confirmResult.isConfirmed) {
                try {
                  //  const retryRes = await fetch(
                  //     `http://localhost:3001/students/enrollStudent/${selectedStudent.id}`,
                  //     {
                  //       method: "PATCH",
                  //       headers: { "Content-Type": "application/json" },
                  //       body: JSON.stringify({
                  //         year_level: yearLevel,
                  //         semester,
                  //         course_id: parseInt(courseId),
                  //         section,
                  //         major,
                  //         forceUpdate: true,
                  //       }),
                  //     },
                  //   );

                  //   const retryData = await retryRes.json();

                  const retryRes = await axios.patch(
                    `${BASE_URL}/students/enrollStudent/${selectedStudent.id}`,
                    {
                      year_level: yearLevel,
                      semester,
                      course_id: parseInt(courseId, 10),
                      section,
                      major,
                      forceUpdate: true,
                    },
                  );

                  const retryData = retryRes.data;

                  if (retryData.success) {
                    swal.fire(
                      "Success",
                      `${selectedStudent.name}'s enrollment has been updated successfully`,
                      "success",
                    );
                    fetchData(currentPage, searchQuery, itemsPerPage);
                  } else {
                    swal.fire(
                      "Error",
                      retryData.message || "Failed to update enrollment",
                      "error",
                    );
                  }
                } catch (retryError) {
                  console.error("Retry error:", retryError);
                  swal.fire(
                    "Error",
                    retryError.response?.data?.message ||
                      retryError.message ||
                      "Failed to update enrollment",
                    "error",
                  );
                }
              }
            } else {
              console.error("Enrollment error:", error);
              swal.fire(
                "Error",
                enrollData?.message ||
                  error.message ||
                  "Failed to enroll student",
                "error",
              );
            }
          }
        });
    };

    showSearchDialog();
  };

  // // Initial load
  // useEffect(() => {
  //   fetchData();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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
    <div className="p-6 bg-blue-200 min-h-screen">
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
              filterOptions={filterOptions}
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
            <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-4">
                {/* Academic Year */}
                <div>
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
                      {filterOptions.academicYears.map((option) => (
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
                      <option value=""></option>
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
                      <option value=""></option>
                      {filterOptions.coursesWithMajors.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
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
                        <option value=""></option>
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
              </div>
            </>
          )}
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-6">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAll}
                      className="h-3 w-3 rounded border-gray-300 text-blue-600 cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Year Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Section
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-4 text-center text-gray-500"
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
                            className="h-3 w-3 rounded border-gray-300 text-blue-600 cursor-pointer"
                          />
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
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

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
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

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                          {isEditing ? (
                            <select
                              value={
                                editData.course_id || student.course_id || ""
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  course_id: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            >
                              <option value="">— Select course —</option>
                              {filterOptions.courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                  {course.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            student.course || "—"
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
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

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
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
                            convertYearLevelForDisplay(student.year_level) ||
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
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
                          <div className="flex gap-1 px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                navigate(`/view-student/${student.id}`)
                              }
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs cursor-pointer"
                            >
                              View
                            </button>
                            {/* <button
                              onClick={() => {
                                // delete logic
                              }}
                              className="ml-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs cursor-pointer"
                            >
                              Delete
                            </button> */}
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
