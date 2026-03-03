import React, { useEffect, useState, useRef } from "react";

function AddStudentButton({ onAdd }) {

    return (
        <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
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
                    d="M12 4v16m8-8H4"
                />
            </svg>
            <span className="font-semibold tracking-wide uppercase text-xs">Add Student</span>
        </button>
    );
}

export default AddStudentButton;