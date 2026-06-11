import React from "react";

function ClaimGradeReportButton({ onClaim }) {
  return (
    <button
      onClick={onClaim}
      className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
    >
      <svg
        className="h-4 w-4 text-white"
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
      <span className="font-semibold tracking-wide uppercase text-xs">
        Claim Grade Report
      </span>
    </button>
  );
}

export default ClaimGradeReportButton;
