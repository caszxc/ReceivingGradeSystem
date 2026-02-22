import React, { useState, useRef, useEffect } from "react";

const SORT_COLUMNS = [
    { label: "Name", value: "last_name" },
    { label: "Student Number", value: "student_number" },
    { label: "Course", value: "course" },
    { label: "Year Level", value: "year_level" },
    { label: "Card Type", value: "card_type" },
    { label: "Date Enrolled", value: "date_enrolled" },
    { label: "Enrollment Status", value: "card_status" },
];

function SortByButton({ sortBy, sortOrder, onSortColumn, onSortOrder }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleColumn = (val) => {
        onSortColumn(val);
        setOpen(false);
    };

    const handleOrder = (val) => {
        onSortOrder(val);
        setOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen((p) => !p)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
                <svg
                    className="h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                    />
                </svg>
                <span className="font-semibold tracking-wide uppercase text-xs">Sort by</span>
                <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {/* Column choices */}
                    {SORT_COLUMNS.map((col) => (
                        <button
                            key={col.value}
                            onClick={() => handleColumn(col.value)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${sortBy === col.value
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {col.label}
                            {sortBy === col.value && (
                                <svg
                                    className="h-4 w-4 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-1" />

                    {/* Direction */}
                    {["asc", "desc"].map((dir) => (
                        <button
                            key={dir}
                            onClick={() => handleOrder(dir)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${sortOrder === dir
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {dir === "asc" ? "Ascending" : "Descending"}
                            {sortOrder === dir && (
                                <svg
                                    className="h-4 w-4 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SortByButton;
