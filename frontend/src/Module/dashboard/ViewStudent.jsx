import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../Api/baseUrl";
import swal from "sweetalert2";
import { convertYearLevelForDisplay } from "../../utils/yearLevelConverter";
import { collapseToShortCourse } from "../../utils/courseConverter";

function ViewStudent() {
  const [isEditing, setIsEditing] = useState(false);
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);

  // State for dropdown options
  const [options, setOptions] = useState({
    courses: [],
    coursesWithMajors: [],
    yearLevels: [],
    sections: [],
    semesters: [],
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/students/viewStudent/${id}`,
        );
        setStudent(response.data);

        // Set default to first enrollment if exists
        if (
          response.data.StudentEnrollments &&
          response.data.StudentEnrollments.length > 0
        ) {
          setSelectedEnrollmentId(response.data.StudentEnrollments[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch student:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (id) {
      setProfileImage(`${BASE_URL}/students/getImage/${id}?t=${Date.now()}`);
    }
  }, [id]);

  // Fetch options for dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/students/getFilterOptions`,
        ); //use getFilterOptions endpoint to fetch all dropdown options
        const data = response.data;
        setOptions({
          courses: data.courses || [],
          coursesWithMajors: data.coursesWithMajors || [],
          yearLevels: data.yearLevels || [],
          sections: data.sections || [],
          semesters: data.semesters || [],
        });
      } catch (error) {
        console.error("Failed to fetch options:", error);
      }
    };

    fetchOptions();
  }, []);

  const fetchSectionsByCourse = async (courseId) => {
    if (!courseId) {
      setOptions((prev) => ({ ...prev, sections: [] }));
      return;
    }
    try {
      const response = await axios.get(
        `${BASE_URL}/students/getSectionsByCourse?course=${courseId}`,
      );
      setOptions((prev) => ({
        ...prev,
        sections: response.data.sections || [],
      }));
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      setOptions((prev) => ({ ...prev, sections: [] }));
    }
  };

  const handleEdit = () => {
    // Use selected enrollment data if available
    const currentEnrollment = selectedEnrollmentId
      ? student.StudentEnrollments?.find((e) => e.id === selectedEnrollmentId)
      : student.StudentEnrollments?.[0];

    setEditData({
      card_serial_number: student.card_serial_number || "",
      first_name: student.first_name || "",
      middle_name: student.middle_name || "",
      last_name: student.last_name || "",
      student_number: student.student_number || "",
      course_id: currentEnrollment?.course_id || student.course_id || "",
      section: currentEnrollment?.section || student.section || "",
      year_level: currentEnrollment?.year_level || student.year_level || "",
      semester: currentEnrollment?.semester || student.semester || "",
      major: currentEnrollment?.major || student.major || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    const result = await swal.fire({
      title: "Save Changes?",
      text: "Are you sure you want to update this student's information?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(`${BASE_URL}/students/updateStudent/${id}`, editData);
      await swal.fire({
        title: "Updated!",
        text: "Student information has been updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
      // Refresh the student data
      const response = await axios.get(
        `${BASE_URL}/students/viewStudent/${id}`,
      );
      setStudent(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update student:", error);
      swal.fire({
        title: "Error",
        text: "Failed to update student information.",
        icon: "error",
      });
    }
  };

  const handleChange = (field, value) => {
    const newEditData = { ...editData, [field]: value };

    // Clear section when course changes
    if (field === "course_id") {
      newEditData.section = "";
    }

    setEditData(newEditData);

    if (field === "course_id" && value) {
      fetchSectionsByCourse(value);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      swal.fire(
        "Error",
        "Only JPEG, PNG, and WebP images are allowed.",
        "error",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      swal.fire("Error", "Image must be under 5MB.", "error");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await axios.post(`${BASE_URL}/students/uploadImage/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileImage(`${BASE_URL}/students/getImage/${id}?t=${Date.now()}`);
      swal.fire("Success", "Profile image updated.", "success");
    } catch (err) {
      swal.fire("Error", "Failed to upload image.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-blue-200 h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading student data...</p>
      </div>
    );
  }

  const handleAddToAlumni = async () => {
    const result = await swal.fire({
      title: "Add to Alumni?",
      text: "Are you sure you want to update this student?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(`${BASE_URL}/students/updateStudent/${id}`, {
        year_level: "ALUMNI",
      });
      await swal.fire({
        title: "Updated!",
        text: "Student has been moved to Alumni.",
        icon: "success",
        confirmButtonText: "OK",
      });
      // Refresh the student data
      const response = await axios.get(
        `${BASE_URL}/students/viewStudent/${id}`,
      );
      setStudent(response.data);
    } catch (error) {
      console.error("Failed to update student:", error);
      swal.fire({
        title: "Error",
        text: "Failed to update student to Alumni.",
        icon: "error",
      });
    }
  };

  if (!student) {
    return (
      <div className="p-6 bg-blue-200 h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">Student not found.</p>
      </div>
    );
  }

  // Get the currently selected enrollment data
  const currentEnrollment = selectedEnrollmentId
    ? student.StudentEnrollments?.find((e) => e.id === selectedEnrollmentId)
    : student.StudentEnrollments?.[0];

  // Display data - prefer enrollment data if available
  const displayData = {
    student_number: student.student_number,
    first_name: student.first_name,
    middle_name: student.middle_name,
    last_name: student.last_name,
    card_serial_number: student.card_serial_number,
    card_id_control_number: student.card_id_control_number,
    card_type: student.card_type,
    card_status: student.card_status,
    date_issued: student.date_issued,
    year_level: currentEnrollment?.year_level || student.year_level,
    section: currentEnrollment?.section || student.section,
    semester: currentEnrollment?.semester || student.semester,
    major: currentEnrollment?.major || student.major,
    course: currentEnrollment?.Course?.name || student.courseData?.name,
    course_id: currentEnrollment?.course_id || student.course_id,
    date_enrolled: currentEnrollment?.date_enrolled || student.date_enrolled,
    isEnrolled: currentEnrollment?.isEnrolled ?? student.isEnrolled,
  };

  return (
    <div className="p-6 bg-blue-200 overflow-auto h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[2rem]">View Student Profile</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-gray-500 text-white cursor-pointer rounded-lg hover:bg-gray-600 transition"
        >
          Back
        </button>
      </div>

      {/* Enrollment Selection */}
      {student.StudentEnrollments && student.StudentEnrollments.length > 1 && (
        <div className="mb-4 p-4 bg-white border border-gray-300 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-2">
            Select Enrollment Record:
          </label>

          <select
            value={selectedEnrollmentId || ""}
            onChange={(e) => setSelectedEnrollmentId(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {student.StudentEnrollments.map((enrollment, idx) => (
              <option key={enrollment.id} value={enrollment.id}>
                {enrollment.AcademicYear?.academic_year || `Year ${idx + 1}`} -{" "}
                {""}
                {enrollment.semester}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-2">
            Total Enrollments: {student.StudentEnrollments.length}
          </p>
        </div>
      )}

      <div className="py-4 flex flex-row space-x-6">
        {/*profile Image*/}
        <div className="h-[85vh] bg-white p-6 rounded-lg shadow-md  w-1/3 flex  gap-3 flex-col items-center overflow-y-auto">
          <div className="relative group">
            <img
              src={profileImage || ""}
              onError={(e) => {
                e.target.src =
                  "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(
                    (student?.first_name || "S") +
                      " " +
                      (student?.last_name || ""),
                  ) +
                  "&size=160&background=e5e5e5&color=555";
              }}
              className="bg-[#e5e5e5] rounded-full border-3 border-[#c4c4c4] h-30 w-30 shadow-lg object-cover"
              alt="Profile"
            />
            {/* Overlay */}
            {isEditing && (
              <label className="absolute left-0 bottom-0 w-full h-1/2 bg-black bg-opacity-30 rounded-b-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white font-semibold">
                  {uploadingImage ? "Uploading..." : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            )}
          </div>

          <div>
            {/*active or enrolled*/}
            <span
              className={`mt-4 px-5 py-2 rounded-md text-white text-sm font-semibold ${
                displayData.isEnrolled ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {displayData.isEnrolled ? "Enrolled" : "Not Enrolled"}
            </span>
          </div>

          {/* Enrollment History */}
          {student.StudentEnrollments &&
            student.StudentEnrollments.length > 0 && (
              <div className="mt-6 w-full h-full">
                <h3 className="text-sm font-semibold mb-2">
                  Enrollment History
                </h3>
                <div className="space-y-2 max-h-100 overflow-y-auto">
                  {student.StudentEnrollments.map((enrollment, idx) => (
                    <div
                      key={enrollment.id}
                      onClick={() => setSelectedEnrollmentId(enrollment.id)}
                      className={`p-2 rounded-lg cursor-pointer text-xs transition ${
                        selectedEnrollmentId === enrollment.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <p className="font-semibold">
                        {enrollment.AcademicYear?.academic_year ||
                          `Year ${idx + 1}`}
                      </p>
                      <p>{enrollment.semester}</p>
                      <p>{`Year Level: ${convertYearLevelForDisplay(enrollment.year_level)}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/*profile Information*/}
        <div className=" h-[85vh] bg-white px-10 py-5 rounded-lg shadow-md w-full overflow-y-auto">
          <div>
            <span className="text-[1.4rem]">Student Information</span>
          </div>
          <form className="space-y-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? editData.card_serial_number
                      : displayData.card_serial_number || ""
                  }
                  onChange={(e) =>
                    handleChange("card_serial_number", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //  placeholder="Serial Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Number
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? editData.student_number
                      : displayData.student_number || ""
                  }
                  onChange={(e) =>
                    handleChange("student_number", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //   placeholder="Student Number"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? editData.first_name
                      : displayData.first_name || ""
                  }
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? editData.middle_name
                      : displayData.middle_name || ""
                  }
                  onChange={(e) => handleChange("middle_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //   placeholder="Middle Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surname
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing ? editData.last_name : displayData.last_name || ""
                  }
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //   placeholder="Surname"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Student Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Level
                </label>
                <div className="relative">
                  {isEditing ? (
                    <select
                      value={editData.year_level || ""}
                      onChange={(e) =>
                        handleChange("year_level", e.target.value)
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      <option value="">— Select year —</option>
                      {options.yearLevels.map((yr) => (
                        <option key={yr} value={yr}>
                          {convertYearLevelForDisplay(yr)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={
                        convertYearLevelForDisplay(displayData.year_level) ||
                        "—"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  )}

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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <div className="relative">
                  {isEditing ? (
                    <select
                      value={editData.semester || ""}
                      onChange={(e) => handleChange("semester", e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      <option value="">— Select semester —</option>
                      {options.semesters.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={displayData.semester || "—"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  )}
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
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Section
                </label>
                {isEditing ? (
                  <div className="relative mt-1">
                    <input
                      list="viewstudent_section_list"
                      value={editData.section || ""}
                      onChange={(e) => handleChange("section", e.target.value)}
                      placeholder="Select or type new section"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent "
                      autoComplete="off"
                    />
                    <datalist id="viewstudent_section_list">
                      {options.sections.map((section) => (
                        <option key={section} value={section} />
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={displayData.section || "—"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <div className="relative">
                  {isEditing ? (
                    <select
                      value={String(editData.course_id) || ""}
                      onChange={(e) => {
                        const selectedOption =
                          e.target.options[e.target.selectedIndex];
                        const majorName =
                          selectedOption.getAttribute("data-major");

                        handleChange(
                          "course_id",
                          e.target.value ? parseInt(e.target.value) : "",
                        );

                        // Auto-fill major if a major option was selected
                        if (majorName) {
                          handleChange("major", majorName);
                        }

                        fetchSectionsByCourse(e.target.value);
                      }}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      <option value="">— Select course —</option>
                      {options.coursesWithMajors.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={
                        collapseToShortCourse(
                          displayData.course,
                          displayData.major,
                        ) ||
                        displayData.course ||
                        "—"
                      }
                      className="w-full h-auto px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  )}
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
          </form>
          <div className="flex justify-end items-end ">
            {!isEditing && (
              <>
                {/* {student.year_level !== "ALUMNI" && (
                  <button
                    type="button"
                    className="px-6 py-2 rounded-md bg-amber-100 text-amber-700 font-semibold hover:bg-amber-200 transition"
                    onClick={handleAddToAlumni}
                  >
                    Add to Alumni
                  </button>
                )} */}
                <button
                  type="button"
                  className="px-6 py-2 mx-2 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                  onClick={handleEdit}
                >
                  Update
                </button>
              </>
            )}
            {isEditing && (
              <>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-md bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewStudent;
