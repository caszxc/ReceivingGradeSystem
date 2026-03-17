import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import plvLogo from "/assets/PLVLogo.png";
import { useAuth } from "../context/authContext";

const Sidebar = () => {
  const { user, logout, isSuperAdmin } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here later
    logout();
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const baseNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
  ];

  // Add manageAccount only for superadmin
  const navItems = isSuperAdmin()
    ? [
        ...baseNavItems,
        {
          name: "Manage Account",
          path: "/manage-accounts",
        },
        {
          name: "Upload",
          path: "/upload",
        },
        {
          name: "Settings",
          path: "/settings",
        },
      ]
    : baseNavItems;

  return (
    <div
      className={`h-screen bg-white shadow-lg flex flex-col transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 relative">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
            <img
              src={plvLogo}
              alt="PLV Logo"
              className="w-8 h-8 rounded-lg object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                PLV System
              </h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                Enrollment Portal
              </p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors duration-200"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg transition-colors duration-200 group relative ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
            title={isCollapsed ? item.name : ""}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`${isActive ? "text-blue-700" : "text-gray-400"} flex-shrink-0`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">
                    {item.name}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section - Account Info */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} mb-4`}
        >
          {/* PLV Logo */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200 flex-shrink-0">
            <img
              src={plvLogo}
              alt="PLV Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                {user?.username || "User"}
              </p>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {user?.role || "Role"}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-center space-x-2"} px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 group relative`}
          title={isCollapsed ? "Logout" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!isCollapsed && <span>Logout</span>}

          {/* Tooltip for collapsed logout button */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
