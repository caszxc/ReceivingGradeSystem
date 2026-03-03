import React, { useEffect, useState, useRef } from "react";
import usePagination from "../../hooks/usePagination";
import PaginationControls from "../../hooks/paginationControls";
import SortByButton from "../../Components/SortByButton";
import ExportButton from "../../Components/ExportButton";
import AddStudentButton from "../../Components/AddStudentButton";
import swal from "sweetalert2";
import { FaChevronDown } from "react-icons/fa";

function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState("Name");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const dropdownRef = useRef(null);
  // ── Sort state ───────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("last_name");

  // ── Row selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Fetch functions ──────────────────────────────────────────────────────────
  const fetchStudents = async ({ page, limit }) => {
    const response = await fetch(
      `http://localhost:3001/students/getStudent?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
    );
    return await response.json();
  };

  const searchStudents = async ({ query, page, limit }) => {
    const response = await fetch(
      `http://localhost:3001/students/searchStudent?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
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

  // ── Re-fetch when sort changes ───────────────────────────────────────────────
  useEffect(() => {
    fetchData(1, searchQuery, itemsPerPage);
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  // Enroll student function
  const enrollStudent = (studentId) => {
    swal
      .fire({
        title: "Enroll Student",
        text: "Are you sure you want to enroll this student?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, enroll",
        cancelButtonText: "No, cancel",
      })
      .then((result) => {
        if (result.isConfirmed) {
          fetch(`http://localhost:3001/students/enrollStudent/${studentId}`, {
            method: "PATCH",
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message) {
                swal.fire("Enrolled!", data.message, "success");
                fetchData();
              } else {
                swal.fire(
                  "Error",
                  data.error || "Failed to enroll student",
                  "error",
                );
              }
            })
            .catch((error) => {
              swal.fire(
                "Error",
                error.message || "Failed to enroll student",
                "error",
              );
            });
        }
      });
  };

  // Check if student is enrolled
  const isEnrolled = (student) => {
    return student.isEnrolled;
  };

  // Add student function
  const addStudent = () => {
    swal.fire({
      title: "Add New Student",
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Serial Number
            </label>
            <input id="serial_number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
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
        const serial_number = document.getElementById("serial_number").value;
        const student_number = document.getElementById("student_number").value;
        const full_name = document.getElementById("full_name").value;
        const course = document.getElementById("course").value;
        const section = document.getElementById("section").value;
        if (!serial_number || !student_number || !full_name) {
          swal.showValidationMessage("Please fill in all required fields");
          return false;
        }
        return {
          serial_number,
          student_number,
          full_name,
          course,
          section,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { serial_number, student_number, full_name, course, section } =
          result.value;
        fetch("http://localhost:3001/students/addStudent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serial_number,
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
              swal.fire("Error!", data.error || "Failed to add student", "error");
            }
          })
          .catch((error) => {
            swal.fire("Error!", error.message || "Failed to add student", "error");
          });
      }
    });
  }

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
                  <th></th>
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
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.card_status === "Active"
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
                        <td className="px-3 py-4 whitespace-nowrap">
                          {student.isEnrolled ? (
                            <span className="text-green-600 font-semibold">
                              Enrolled
                            </span>
                          ) : (
                            <button
                              onClick={() => enrollStudent(student.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                              Enroll
                            </button>
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
