import React, { useState, useRef } from "react";
import Swal from "sweetalert2";
import { convertYearLevelForDisplay } from "../../utils/yearLevelConverter";
import { BASE_URL } from "../../Api/baseUrl";
import axios from "axios";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      if (["xlsx", "xls", "csv"].includes(fileExtension)) {
        setFile(selectedFile);
        setUploadResult(null);
        setShowPreview(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid File Format",
          text: "Please select a valid Excel (.xlsx, .xls) or CSV file.",
          confirmButtonColor: "#3b82f6",
        });
        event.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${BASE_URL}/students/uploadStudents`,
        formData,
      );

      const result = response.data;
      setUploadResult(result);
      setShowPreview(true);
      // const response = await fetch(
      //   "http://localhost:3001/students/uploadStudents",
      //   {
      //     method: "POST",
      //     body: formData,
      //   },
      // );

      // const result = await response.json();
      // setUploadResult(result);
      // setShowPreview(true);

      // Show appropriate alert based on validation results
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Validation Successful!",
          text: `File validated successfully! ${result.validRows} valid records found and ready for upload.`,
          confirmButtonColor: "#10b981",
        });
      } else if (result.errors && result.errors.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "Validation Errors Found",
          text: `Found ${result.errorRows} rows with errors. Please review the errors below and fix your data before uploading.`,
          confirmButtonColor: "#f59e0b",
        });
      } else if (result.existingRecords && result.existingRecords.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Records Found",
          text: `Found ${result.existingRecords.length} records that already exist in the database. Please review the duplicates below.`,
          confirmButtonColor: "#f59e0b",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "An error occurred while uploading the file. Please check your connection and try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!uploadResult || !uploadResult.validData) return;

    // Show confirmation dialog
    const result = await Swal.fire({
      icon: "question",
      title: "Confirm Upload",
      text: `Are you sure you want to upload ${uploadResult.validData.length} student records to the database? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Upload!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      performUpload();
    }
  };

  const performUpload = async () => {
    setUploading(true);

    try {
      // const response = await fetch(
      //   "http://localhost:3001/students/confirmUpload",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ validatedData: uploadResult.validData }),
      //   },
      // );

      // const result = await response.json();
      const response = await axios.post(
        `${BASE_URL}/students/confirmUpload`,
        { validatedData: uploadResult.validData },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;

      if (result.success) {
        await Swal.fire({
          icon: "success",
          title: "Upload Successful!",
          text: `Successfully uploaded ${result.uploadedCount} students to the database!`,
          confirmButtonColor: "#10b981",
        });
        resetUpload();
      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: `Error uploading data: ${result.error}`,
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      console.error("Confirm upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "An error occurred while uploading the data to the database. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 bg-blue-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#001C56]">Upload Students</h1>
          <p className="text-[#001C56] mt-2">
            Upload student data from Excel or CSV files
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Upload Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-extrabold text-[#001C56] mb-3">
                File Format Requirements
              </h3>
              <p className="text-sm text-[#546E7A] mb-3">
                Please ensure your file contains the following columns:
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <strong>Required columns:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• student_number</li>
                  </ul>
                </div>
                <div>
                  <strong>Optional columns:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• first_name</li>
                    <li>• last_name</li>
                    <li>• middle_name</li>
                    <li>• course</li>
                    <li>• major</li>
                    <li>• section</li>
                    <li>• semester</li>
                    <li>• year_level</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-11 relative">
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="8"
                  fill="none"
                  stroke="#182D50"
                  strokeWidth="4"
                  strokeDasharray="22 14"
                />
              </svg>
              <div className="text-center">
                <div
                  className="w-20 h-20 bg-[#182D50] mx-auto mb-4"
                  style={{
                    WebkitMaskImage: `url(${"/src/icons/upload.png"})`,
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskImage: `url(${"/src/icons/upload.png"})`,
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    maskSize: "contain",
                  }}
                />

                {!file ? (
                  <>
                    <h3 className="mt-4 text-lg font-medium text-[#182D50]">
                      Select a file to upload
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Supported formats: .xlsx, .xls, .csv
                    </p>
                    <div className="mt-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor=""
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer bg-[#182D50] text-white px-6 py-3 rounded-lg hover:bg-[#0F1C35] transition-colors inline-flex items-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Choose File
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      File Selected
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                    <div className="mt-6 space-x-4">
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Validating...
                          </>
                        ) : (
                          "Validate & Preview"
                        )}
                      </button>
                      <button
                        onClick={resetUpload}
                        disabled={uploading}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Choose Different File
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Preview Section */
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              {/* Validation Results Summary */}
              <div className="bg-white rounded-lg shadow-sm p-3 text-center flex-shrink-0 w-full md:w-auto">
                <h3 className="text-lg font-medium text-[#001C56] mb-4">
                  Validation Results
                </h3>
                <div className="grid grid-cols-2 gap-8 p-4">
                  <div className="text-center rounded-lg shadow-sm p-2 ">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadResult.totalRows}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="text-center rounded-lg shadow-sm p-2">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.validRows}
                    </div>
                    <div className="text-sm text-gray-600">Valid Rows</div>
                  </div>
                  <div className="text-center rounded-lg shadow-sm p-2">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadResult.errorRows}
                    </div>
                    <div className="text-sm text-gray-600">Error Rows</div>
                  </div>
                  <div className="text-center rounded-lg shadow-sm p-2">
                    <div className="text-2xl font-bold text-yellow-600">
                      {uploadResult.existingRecords?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Duplicates</div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {uploadResult.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex-grow">
                  <div className="flex">
                    <div className="flex-shrink-0 w-6 h-6">
                      <img src="/src/icons/success.png" alt="success icon" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        File validation successful!
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          All data has been validated and is ready for upload.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Errors Section */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex-grow">
                  <div className="flex">
                    <div className="flex-shrink-0 w-6 h-6 mt-1">
                      <img src="/src/icons/error.png" alt="error icon" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-medium text-red-900 mb-4">
                        Validation Errors
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {uploadResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-800">
                            <strong>Row {error.row}:</strong>{" "}
                            {error.errors.join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Existing Records Section */}
              {uploadResult.existingRecords &&
                uploadResult.existingRecords.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex-grow">
                    <div className="flex">
                      <div
                        className="flex-shrink-0 w-6 h-6 bg-[#CCAD24] mt-1"
                        style={{
                          WebkitMaskImage: `url(${"/src/icons/duplicate.png"})`,
                          WebkitMaskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          WebkitMaskSize: "contain",
                          maskImage: `url(${"/src/icons/duplicate.png"})`,
                          maskRepeat: "no-repeat",
                          maskPosition: "center",
                          maskSize: "contain",
                        }}
                      />
                      <div className="ml-3">
                        <h4 className="text-lg font-medium text-yellow-900 mb-4">
                          Duplicate Records Found
                        </h4>
                        <div className="text-sm text-yellow-800">
                          The following records already exist in the database:
                          <div className="mt-2 space-y-1">
                            {uploadResult.existingRecords.map(
                              (record, index) => (
                                <div key={index}>
                                  Student Number: {record.student_number},
                                  Control Number:{" "}
                                  {record.card_id_control_number}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Valid Data Preview */}
            {uploadResult.validData && uploadResult.validData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">
                    Valid Data Preview
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Control #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Student Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Year Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Card Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadResult.validData
                        .slice(0, 5)
                        .map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.card_id_control_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.student_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {`${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.course || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {convertYearLevelForDisplay(student.year_level) ||
                                "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.card_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {student.card_status || "Active"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors Section File Upload Area*/}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-11 relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <rect
                    x="1"
                    y="1"
                    width="calc(100% - 2px)"
                    height="calc(100% - 2px)"
                    rx="8"
                    fill="none"
                    stroke="#182D50"
                    strokeWidth="4"
                    strokeDasharray="22 14"
                  />
                </svg>
                <div className="text-center">
                  <div
                    className="w-20 h-20 bg-[#182D50] mx-auto mb-4"
                    style={{
                      WebkitMaskImage: `url(${"/src/icons/upload.png"})`,
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskImage: `url(${"/src/icons/upload.png"})`,
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                      maskSize: "contain",
                    }}
                  />

                  {!file ? (
                    <>
                      <h3 className="mt-4 text-lg font-medium text-[#182D50]">
                        Select a file to upload
                      </h3>
                      <p className="mt-2 text-sm text-gray-400">
                        Supported formats: .xlsx, .xls, .csv
                      </p>
                      <div className="mt-6">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor=""
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer bg-[#182D50] text-white px-6 py-3 rounded-lg hover:bg-[#0F1C35] transition-colors inline-flex items-center"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          Choose File
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        File Selected
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </p>
                      <div className="mt-6 space-x-4">
                        <button
                          onClick={handleUpload}
                          disabled={uploading}
                          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Validating...
                            </>
                          ) : (
                            "Validate & Preview"
                          )}
                        </button>
                        <button
                          onClick={resetUpload}
                          disabled={uploading}
                          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Choose Different File
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {uploadResult &&
              uploadResult.validData &&
              uploadResult.validData.length > 0 && (
                <div className="flex gap-4 items-center rounded-lg">
                  {/* <div className="">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                    <label
                      htmlFor=""
                      className="cursor-pointer bg-[#182D50] text-white px-6 py-5 rounded-lg hover:bg-[#0F1C35] transition-colors inline-flex items-center"
                    >
                      Add File
                    </label>
                  </div> */}

                  <div className="bg-white p-2 flex items-center justify-between space-x-4 flex-grow">
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {Math.min(5, uploadResult.validData.length)} of{" "}
                      {uploadResult.validData.length} valid records
                    </p>

                    <div className="space-x-4">
                      <button
                        onClick={resetUpload}
                        disabled={uploading}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      {uploadResult.success &&
                        uploadResult.validData.length > 0 && (
                          <button
                            onClick={handleConfirmUpload}
                            disabled={uploading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploading ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Uploading...
                              </>
                            ) : (
                              `Confirm Upload (${uploadResult.validData.length} records)`
                            )}
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
