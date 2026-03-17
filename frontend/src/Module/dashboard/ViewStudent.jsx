import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../Api/baseUrl";
import swal from "sweetalert2";

function ViewStudent() {
  const [isEditing, setIsEditing] = useState(false);
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();

  // State for dropdown options
  const [options, setOptions] = useState({
    courses:   [],
    yearLevels: [],
    sections:  [],
    semesters: [],
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/students/viewStudent/${id}`,
        );
        setStudent(response.data);
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
        const response = await axios.get(`${BASE_URL}/students/getFilterOptions`); //use getFilterOptions endpoint to fetch all dropdown options 
        const data = response.data;
        setOptions({
          courses: data.courses || [],
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

  const handleEdit = () => {
    setEditData({
      card_serial_number: student.card_serial_number || "",
      first_name: student.first_name || "",
      middle_name: student.middle_name || "",
      last_name: student.last_name || "",
      student_number: student.student_number || "",
      course: student.course || "",
      section: student.section || "",
      year_level: student.year_level || "",
      semester: student.semester || "",
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
      navigate("/dashboard");
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
    setEditData({ ...editData, [field]: value });
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

  if (!student) {
    return (
      <div className="p-6 bg-blue-200 h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">Student not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-200 overflow-hidden h-screen">
      <div>
        <h1 className="text-[2rem] "> View Student Profile</h1>
      </div>
      <div className="py-4  flex flex-row  space-x-6">
        {/*profile Image*/}
        <div className="h-[85vh] bg-white p-6 rounded-lg shadow-md  w-1/3 flex  gap-3 flex-col items-center">
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
              className="bg-[#e5e5e5] rounded-full border-3 border-[#c4c4c4] h-40 w-40 shadow-lg object-cover"
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
            <span className="mt-4 px-5 py-2 rounded-md text-white text-sm font-semibold bg-green-500">
              Enrolled
            </span>
          </div>
        </div>

        {/*profile Information*/}
        <div className=" h-[85vh] bg-white px-10 py-5 rounded-lg shadow-md w-full">
          <div>
            <span className="text-[1.4rem]">Student Information</span>
          </div>
          <form className="space-y-6 py-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                disabled ={!isEditing}
                value={
                  isEditing ? editData.card_serial_number : student.card_serial_number || ""
                }
                onChange={(e) => handleChange("card_serial_number", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //  placeholder="Serial Number"
              />

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
                    isEditing ? editData.first_name : student.first_name || ""
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
                    isEditing ? editData.middle_name : student.middle_name || ""
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
                    isEditing ? editData.last_name : student.last_name || ""
                  }
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //   placeholder="Surname"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      : student.student_number || ""
                  }
                  onChange={(e) =>
                    handleChange("student_number", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100" //   placeholder="Student Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                {isEditing ? (
                  <select
                    value={editData.course || ""}
                    onChange={(e) => handleChange("course", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="">— Select course —</option>
                    {options.courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={student.course || "—"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                {isEditing ? (
                  <select
                    value={editData.section || ""}
                    onChange={(e) => handleChange("section", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="">— Select section —</option>
                    {options.sections.map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={student.section ? `Section ${student.section}` : "—"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                {isEditing ? (
                  <select
                    value={editData.year_level || ""}
                    onChange={(e) => handleChange("year_level", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="">— Select year —</option>
                    {options.yearLevels.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr === 1 ? "1st" : yr === 2 ? "2nd" : yr === 3 ? "3rd" : `${yr}th`} Year
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={
                      student.year_level
                        ? student.year_level === 1
                          ? "1st Year"
                          : student.year_level === 2
                          ? "2nd Year"
                          : student.year_level === 3
                          ? "3rd Year"
                          : `${student.year_level}th Year`
                        : "—"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                {isEditing ? (
                  <select
                    value={editData.semester || ""}
                    onChange={(e) => handleChange("semester", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="">— Select semester —</option>
                    {options.semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem === 1 ? "1st" : sem === 2 ? "2nd" : `${sem}th`} Semester
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={
                      student.semester
                        ? student.semester === 1
                          ? "1st Semester"
                          : student.semester === 2
                          ? "2nd Semester"
                          : `${student.semester}th Semester`
                        : "—"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                )}
              </div>
            </div>
          </form>
          <div className="flex justify-end items-end ">
            {!isEditing && (
              <button
                type="button"
                className="px-6 py-2 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                onClick={handleEdit}
              >
                Update
              </button>
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
