import { useRef, useState } from "react";

function ViewStudent() {
  const [isEditing, setIsEditing] = useState(false);

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
              src="https://randomuser.me/api/portraits/men/1.jpg"
              className="bg-[#e5e5e5] rounded-full border-3 border-[#c4c4c4] h-40 w-40 shadow-lg object-cover"
              alt="Profile"
            />
            {/* Overlay */}
            <label className="absolute left-0 bottom-0 w-full h-1/2 bg-black bg-opacity-30 rounded-b-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-white font-semibold">Upload</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //   placeholder="Middle Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surname
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //   placeholder="Surname"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //   placeholder="Student Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //   placeholder="Course"
               />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //   placeholder="Section"
               />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Level
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //   placeholder="Year Level"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                //   placeholder="Semester"
              />
              </div>
            </div>
          </form>
          <div className="flex justify-end items-end ">
            {!isEditing && (
              <button
                type="button"
                className="px-6 py-2 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                onClick={() => setIsEditing(true)}
              >
                Update
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                className="px-6 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
                onClick={() => setIsEditing(false)}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewStudent;
