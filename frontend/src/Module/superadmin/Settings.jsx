import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

function Settings() {
  const [defaults, setDefaults] = useState({
    yearLevel: "",
    semester: "",
    course: "",
    section: "",
    academicYear: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    yearLevels: [],
    semesters: [],
    courses: [],
    sections: [],
    academicYears: [],
  });
  const [loading, setLoading] = useState(true);
  const [hasDefaults, setHasDefaults] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/students/getFilterOptions")
      .then((res) => res.json())
      .then((data) => {
        setFilterOptions({
          yearLevels: data.yearLevels.map((y) => ({
            value: y,
            label: `${["1st", "2nd", "3rd", "4th"][y - 1] || `${y}th`} Year`,
          })),
          semesters: data.semesters.map((s) => ({
            value: s,
            label: `${["1st", "2nd"][s - 1] || `${s}th`} Semester`,
          })),
          courses: data.courses.map((c) => ({
            value: c,
            label: c,
          })),
          sections: data.sections.map((sec) => ({
            value: sec,
            label: `Section ${sec}`,
          })),
          academicYears: data.dateYears.map((ay) => ({
            value: `${ay}-${parseInt(ay) + 1}`,
            label: `A.Y ${ay}-${parseInt(ay) + 1}`,
          })),
        });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/settings/default-filters")
      .then((res) => res.json())
      .then((data) => {
        if (
          data &&
          (data.yearLevel ||
            data.semester ||
            data.course ||
            data.section ||
            data.academicYear)
        ) {
          setDefaults(data);
          setHasDefaults(true);
        } else {
          setHasDefaults(false);
        }
      });
  }, []);

  const handleChange = (field, value) => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save the default filters?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("http://localhost:3001/settings/save-default-filters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(defaults),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              Swal.fire("Success", "Defaults saved!", "success");
              setHasDefaults(true);
            } else {
              Swal.fire(
                "Error",
                data.error || "Error saving defaults",
                "error",
              );
            }
          });
      }
    });
  };

  const handleUpdate = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update the default filters?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("http://localhost:3001/settings/update-default-filters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(defaults),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              Swal.fire("Success", "Defaults updated!", "success");
            } else {
              Swal.fire(
                "Error",
                data.error || "Error updating defaults",
                "error",
              );
            }
          });
      }
    });
  };

  if (loading)
    return <div className="p-6 bg-blue-200 min-h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-blue-200 min-h-screen">
      {/* <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-3xl text-gray-900 mb-6">Default Filter Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year Level
            </label>
            <div className="relative">
              <select
                value={defaults.yearLevel}
                onChange={(e) => handleChange("yearLevel", e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
              >
                <option value="">None</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <div className="relative">
              <select
                value={defaults.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
              >
                <option value="">None</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <div className="relative">
              <select
                value={defaults.course}
                onChange={(e) => handleChange("course", e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
              >
                <option value="">None</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <div className="relative">
              <select
                value={defaults.section}
                onChange={(e) => handleChange("section", e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
              >
                <option value="">None</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <div className="relative">
              <select
                value={defaults.academicYear}
                onChange={(e) => handleChange("academicYear", e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
              >
                <option value="">None</option>
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
        </div>
        {hasDefaults ? (
          <button
            onClick={handleUpdate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Update Defaults
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Defaults
          </button>
        )}
      </div> */}
    </div>
  );
}

export default Settings;
