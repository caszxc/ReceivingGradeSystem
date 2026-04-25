import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

function Settings() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeYearId, setActiveYearId] = useState(null);
  const [newYearInput, setNewYearInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [activeSemester, setActiveSemester] = useState("1ST SEMESTER");
  const [semesterError, setSemesterError] = useState("");
  const [semesterSuccess, setSemesterSuccess] = useState("");

  // Fetch active semester
  const fetchActiveSemester = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/settings/getActiveSemester",
      );
      const data = await response.json();
      setActiveSemester(data.activeSemester || "1ST SEMESTER");
    } catch (err) {
      console.error("Error fetching active semester:", err);
    }
  };

  // Set active semester
  // Set active semester
  const handleSetActiveSemester = async (semester) => {
    setError("");
    setSuccess("");

    // Show confirmation modal
    const result = await Swal.fire({
      icon: "info",
      title: "Set as Active Semester?",
      html: `<div class="text-left">
      <p class="text-sm text-gray-700">You are about to set this as the active semester:</p>
      <p class="mt-3 text-lg font-bold text-blue-600">${semester}</p>
      <p class="mt-3 text-xs text-gray-600">The current active semester will be set to inactive. All new enrollments will use this semester.</p>
    </div>`,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, set as active",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setSemesterError("");
      setSemesterSuccess("");
      setLoading(true);

      const response = await fetch(
        "http://localhost:3001/settings/setActiveSemester",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semester }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        setSemesterError(error.error || "Failed to set semester");
        return;
      }

      const data = await response.json();
      setActiveSemester(data.activeSemester);

      Swal.fire({
        icon: "success",
        title: "Active Semester Changed!",
        text: `Active semester set to ${semester}`,
        confirmButtonColor: "#2563eb",
      });
    } catch (err) {
      setSemesterError("Error setting semester: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all academic years
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3001/settings/getAcademicYears",
      );
      const data = await response.json();
      setAcademicYears(data);
      const active = data.find((y) => y.isActive);
      setActiveYearId(active?.id);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch academic years");
      setLoading(false);
    }
  };

  // Create new academic year
  const handleCreateYear = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate format: YYYY-YYYY
    if (!newYearInput.trim()) {
      setError("Please enter an academic year");
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(newYearInput)) {
      setError("Invalid format. Use YYYY-YYYY (e.g., 2024-2025)");
      return;
    }

    // Show confirmation modal
    const result = await Swal.fire({
      icon: "info",
      title: "Create Academic Year?",
      html: `<div class="text-left">
      <p class="text-sm text-gray-700">You are about to create a new academic year:</p>
      <p class="mt-3 text-lg font-bold text-blue-600">${newYearInput}</p>
      <p class="mt-3 text-xs text-gray-600">The new academic year will be created as <strong>inactive</strong>. You can activate it later from the table below.</p>
    </div>`,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, create it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        "http://localhost:3001/settings/createAcademicYear",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ academic_year: newYearInput }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create academic year");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Academic year ${newYearInput} created successfully`,
        confirmButtonColor: "#2563eb",
      });
      setNewYearInput("");
      fetchAcademicYears();
    } catch (err) {
      setError(err.message);
    }
  };

  // Set academic year as active
  const handleSetActive = async (id) => {
    const year = academicYears.find((y) => y.id === id);
    if (!year) return;

    setError("");
    setSuccess("");

    // Show confirmation modal
    const result = await Swal.fire({
      icon: "warning",
      title: "Set as Active Year?",
      html: `<div class="text-left">
      <p class="text-sm text-gray-700">You are about to set this as the active academic year:</p>
      <p class="mt-3 text-lg font-bold text-blue-600">${year.academic_year}</p>
      <p class="mt-3 text-xs text-gray-600">The current active year will be set to inactive. All new enrollments will use this year.</p>
    </div>`,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, set as active",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `http://localhost:3001/settings/setActiveAcademicYear/${id}`,
        { method: "PATCH" },
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to set active year");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Active Year Changed!",
        text: data.message,
        confirmButtonColor: "#2563eb",
      });
      fetchAcademicYears();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete academic year
  const handleDeleteYear = async (id, academicYear) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Academic Year?",
      html: `<div class="text-left">
      <p class="text-sm text-gray-700">You are about to delete:</p>
      <p class="mt-3 text-lg font-bold text-red-600">${academicYear}</p>
      <p class="mt-3 text-xs text-gray-600"><strong>Warning:</strong> This action cannot be undone. You can only delete academic years that have no enrollments.</p>
    </div>`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setDeleting(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://localhost:3001/settings/deleteAcademicYear/${id}`,
        { method: "DELETE" },
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to delete academic year");
        setDeleting(null);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Academic year deleted successfully",
        confirmButtonColor: "#2563eb",
      });
      setDeleting(null);
      fetchAcademicYears();
    } catch (err) {
      setError(err.message);
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
    fetchActiveSemester();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-blue-200 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading academic years...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage academic years and system configuration
          </p>
        </div>

        {/* ── Error / Success Messages ───────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{success}</span>
            <button
              onClick={() => setSuccess("")}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Current Active Year ────────────────────────────────────────────── */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Current Active Year
              </h2>
              <p className="text-gray-600 mt-1">
                {academicYears.find((y) => y.isActive)?.academic_year || "None"}{" "}
                {academicYears.find((y) => y.isActive) && (
                  <span className="inline-block ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                    Active
                  </span>
                )}
              </p>
            </div>
            <svg
              className="h-12 w-12 text-blue-500 opacity-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Create New Academic Year ──────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 h-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Create Academic Year
              </h2>

              <form onSubmit={handleCreateYear} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2025-2026"
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Format: YYYY-YYYY (e.g., 2025-2026)
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Academic years must be unique. New
                    years are created as inactive.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Create Academic Year
                </button>
              </form>
            </div>
          </div>

          {/* ── All Academic Years Table ──────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Academic Years
                </h2>
              </div>

              {academicYears.length === 0 ? (
                <div className="p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">
                    No academic years
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first academic year to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Academic Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {academicYears.map((year) => (
                        <tr key={year.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {year.academic_year}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {year.isActive ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                            {!year.isActive ? (
                              <button
                                onClick={() => handleSetActive(year.id)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-xs font-medium"
                                title="Set as active year"
                              >
                                Set Active
                              </button>
                            ) : (
                              <button
                                disabled
                                className="text-gray-400 px-3 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
                                title="This is the active year"
                              >
                                Set Active
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handleDeleteYear(year.id, year.academic_year)
                              }
                              disabled={deleting === year.id}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete academic year"
                            >
                              {deleting === year.id ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Semester Section */}
        <div className="mt-8">
          {/* Current Active Semester */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Current Active Semester
                </h2>
                <p className="text-gray-600 mt-1">
                  {activeSemester}{" "}
                  {activeSemester && (
                    <span className="inline-block ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                      Active
                    </span>
                  )}
                </p>
              </div>
              <svg
                className="h-12 w-12 text-purple-500 opacity-20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Error/Success Messages */}
          {semesterError && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-red-700">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{semesterError}</span>
              <button
                onClick={() => setSemesterError("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}

          {semesterSuccess && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{semesterSuccess}</span>
              <button
                onClick={() => setSemesterSuccess("")}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Semesters Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Semesters
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {["1ST SEMESTER", "2ND SEMESTER", "SUMMER"].map(
                    (semester) => (
                      <tr key={semester} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {semester}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activeSemester === semester ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {activeSemester !== semester ? (
                            <button
                              onClick={() => handleSetActiveSemester(semester)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Set as active semester"
                            >
                              Set Active
                            </button>
                          ) : (
                            <button
                              disabled
                              className="text-gray-400 px-3 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
                              title="This is the active semester"
                            >
                              Set Active
                            </button>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Information Box ────────────────────────────────────────────────── */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            About Academic Years
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Each academic year should be unique and follow the YYYY-YYYY
                format (e.g., 2025-2026).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Only one academic year can be active at a time. All enrollments
                will be created under the active year.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                You cannot delete an academic year that has existing
                enrollments.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Previous academic years and their enrollments are preserved when
                you create a new year.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;
