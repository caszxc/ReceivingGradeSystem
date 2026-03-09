import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import swal from "sweetalert2";

function ManageAccount() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  // Add password visibility states for the form
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showFormConfirmPassword, setShowFormConfirmPassword] = useState(false);
  const { user } = useAuth();

  // Password validation function
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      hasUpperCase,
      hasNumber,
      hasSpecialChar,
      isValid: hasUpperCase && hasNumber && hasSpecialChar,
    };
  };

  // Check if username exists
  const checkUsernameExists = (username) => {
    return accounts.some(
      (account) => account.username.toLowerCase() === username.toLowerCase(),
    );
  };

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3001/accounts/getAccounts",
      );
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.accounts);
      } else {
        throw new Error(data.message || "Failed to fetch accounts");
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      swal.fire("Error", "Failed to fetch accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  // Create account
  const handleCreateAccount = async (e) => {
    e.preventDefault();

    // Validate username uniqueness
    if (checkUsernameExists(formData.username)) {
      swal.fire(
        "Error",
        "Username already exists. Please choose a different username.",
        "error",
      );
      return;
    }

    // Validate password requirements
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      swal.fire(
        "Error",
        "Password must contain at least 1 capital letter, 1 number, and 1 special character",
        "error",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      swal.fire("Error", "Passwords do not match", "error");
      return;
    }

    // Show confirmation dialog
    const result = await swal.fire({
      title: "Create Account Confirmation",
      html: `
      <div class="text-left space-y-3 p-4">
        <p class="text-gray-700 mb-4">Are you sure you want to create this account with the following details?</p>
        
        <div class="bg-gray-50 p-4 rounded-lg space-y-3">
          <div class="flex justify-between">
            <span class="font-medium text-gray-600">Username:</span>
            <span class="text-gray-900">${formData.username}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium text-gray-600">Role:</span>
            <span class="text-gray-900 capitalize">${formData.role}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium text-gray-600">Password:</span>
            <span class="text-gray-500">••••••••</span>
          </div>
        </div>
        
        <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-start">
            <svg class="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-xs text-blue-700">
              Once created, this account can be used to log into the system with the specified role permissions.
            </p>
          </div>
        </div>
      </div>
    `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Create Account",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: false,
      customClass: {
        popup: "swal2-popup-custom",
        confirmButton: "swal2-confirm-custom",
        cancelButton: "swal2-cancel-custom",
      },
    });

    // If user cancels, don't proceed
    if (!result.isConfirmed) {
      return;
    }

    // Proceed with account creation
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/accounts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message with SweetAlert
        await swal.fire({
          title: "Account Created Successfully!",
          html: `
          <div class="text-center py-4">
            <div class="mb-4">
              <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-gray-700">
              The account <strong>${formData.username}</strong> has been created successfully with <strong>${formData.role}</strong> role.
            </p>
            <p class="text-sm text-gray-500 mt-2">
              The user can now log in using these credentials.
            </p>
          </div>
        `,
          icon: "success",
          confirmButtonColor: "#10b981",
          confirmButtonText: "Great!",
        });

        setShowCreateForm(false);
        setFormData({
          username: "",
          password: "",
          confirmPassword: "",
          role: "",
        });
        fetchAccounts(); // Refresh the list
      } else {
        // Show error with SweetAlert
        await swal.fire({
          title: "Account Creation Failed",
          text: data.message || "Failed to create account",
          icon: "error",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Try Again",
        });
        throw new Error(data.message || "Failed to create account");
      }
    } catch (err) {
      console.error("Error creating account:", err);
      // Show error with SweetAlert
      await swal.fire({
        title: "Connection Error",
        text: "Unable to connect to the server. Please check your connection and try again.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Okay",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (accountId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Delete account
  const handleDeleteAccount = async (accountId, username) => {
    const result = await swal.fire({
      title: "Are you sure?",
      text: `Delete account "${username}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3001/accounts/deleteAccount/${accountId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          swal.fire("Deleted!", "Account has been deleted.", "success");
          fetchAccounts(); // Refresh the list
        } else {
          throw new Error("Failed to delete account");
        }
      } catch (err) {
        console.error("Error deleting account:", err);
        swal.fire("Error", "Failed to delete account", "error");
      }
    }
  };

  // useEffect MUST be called after all other hooks
  useEffect(() => {
    if (user?.role === "superadmin") {
      fetchAccounts();
    }
  }, [user?.role]);

  // Handle access control with conditional rendering instead of early return
  if (user?.role !== "superadmin") {
    return (
      <div className="p-6 bg-blue-200 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Access denied
              </h3>
              <p className="text-gray-500">
                You do not have permission to access this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordValidation = validatePassword(formData.password);
  const usernameExists = formData.username
    ? checkUsernameExists(formData.username)
    : false;

  return (
    <div className="p-6 bg-blue-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Management
          </h1>
          <p className="text-gray-600">Manage system accounts and user roles</p>
        </div>

        {/* Create Account Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <FaPlus className="mr-2" />
            {showCreateForm ? "Cancel" : "Create Account"}
          </button>
        </div>

        {/* Create Account Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Account</h2>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      usernameExists
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                  {/* Username validation indicator */}
                  {formData.username && (
                    <div
                      className={`mt-2 flex items-center text-xs ${
                        usernameExists ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {usernameExists ? (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                      {usernameExists
                        ? "Username already exists"
                        : "Username available"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showFormPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* Password Requirements Indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? "text-green-600" : "text-gray-400"}`}
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        At least 1 capital letter
                      </div>
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasNumber ? "text-green-600" : "text-gray-400"}`}
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        At least 1 number
                      </div>
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-gray-400"}`}
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        At least 1 special character
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showFormConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowFormConfirmPassword(!showFormConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showFormConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div
                      className={`mt-2 flex items-center text-xs ${
                        formData.password === formData.confirmPassword
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {formData.password === formData.confirmPassword ? (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                      {formData.password === formData.confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select role</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
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
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      username: "",
                      password: "",
                      confirmPassword: "",
                      role: "",
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || usernameExists || !passwordValidation.isValid
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>

            {/* Account Guidelines */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Account Guidelines
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Choose a unique username for the account</li>
                    <li>
                      • Password must contain at least 1 capital letter, 1
                      number, and 1 special character
                    </li>
                    <li>• Admin accounts have limited system access</li>
                    <li>• Super Admin accounts have full system access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              All Accounts ({accounts.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No accounts found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {account.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">
                            {showPasswords[account.id]
                              ? account.password
                              : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(account.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title={
                              showPasswords[account.id]
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPasswords[account.id] ? (
                              <FaEyeSlash />
                            ) : (
                              <FaEye />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            account.role === "superadmin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {account.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleDeleteAccount(account.id, account.username)
                            }
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            title="Delete account"
                          >
                            <FaTrash />
                          </button>
                        </div>
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
  );
}

export default ManageAccount;
