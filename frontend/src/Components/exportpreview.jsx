import React, { useEffect, useRef, useState } from "react";

// ── Format meta ───────────────────────────────────────────────────────────────
const FORMAT_META = {
  pdf: {
    label: "PDF",
    color: "bg-red-100 text-red-700 border-red-200",
    iconColor: "text-red-500",
    btnClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM11.5 18H10v-5h1.5c1.1 0 2 .9 2 2s-.9 2-2 2zm0-3.5H11v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zm3 3.5v-5h1c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-1zm1-3.5v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5H15zm-8 3.5v-5h3v1h-2v1h2v1h-2v2H7z" />
      </svg>
    ),
  },
  xlsx: {
    label: "Excel",
    color: "bg-green-100 text-green-700 border-green-200",
    iconColor: "text-green-600",
    btnClass: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 19l-2-3h1.2l1.3 2 1.3-2H11.5l-2 3H8.5zm4.2 0l-2-5h1.3l1.35 3.5L14.7 14H16l-2 5h-1.3zm4.3 0v-5H18v5h-1z" />
      </svg>
    ),
  },
  csv: {
    label: "CSV",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    iconColor: "text-blue-500",
    btnClass: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
};

const SCOPE_LABELS = {
  all: "All Records",
  page: "Current Page",
  selected: "Selected Rows",
};

// ── table columns ─────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "no", label: "No.", width: "w-8", align: "text-center" },
  { key: "full_name", label: "Name", width: "w-56", align: "text-left" },
  {
    key: "student_number",
    label: "Student No.",
    width: "w-32",
    align: "text-left",
  },
  { key: "course", label: "Course", width: "w-48", align: "text-left" },
  {
    key: "year_level",
    label: "Year Level",
    width: "w-24",
    align: "text-center",
  },
  { key: "section", label: "Section", width: "w-20", align: "text-center" },
  {
    key: "card_status",
    label: "Enrolled",
    width: "w-24",
    align: "text-center",
  },
];

function getCellValue(col, student, index) {
  switch (col.key) {
    case "no":
      return index + 1;
    case "full_name":
      return [student.last_name, student.first_name, student.middle_name]
        .filter(Boolean)
        .join(", ") || "—";
    case "course":
      return student.courseData?.name || "—";
    case "year_level":
      return student.year_level || "—";
    case "section":
      return student.section || "—";
    case "date_enrolled":
      return student.date_enrolled
        ? new Date(student.date_enrolled).toLocaleDateString("en-PH", {
            year: "numeric", month: "short", day: "numeric",
          })
        : "—";
    case "card_status": {
      const val = student.isEnrolled;
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            val
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {val ? "Enrolled" : "Not Enrolled"}
        </span>
      );
    }
    default:
      return student[col.key] ?? "—";
  }
}
// ── ExportPreview component ───────────────────────────────────────────────────
function ExportPreview({
  isOpen,
  loading, // boolean – fetching data
  students, // array of student objects
  format, // "pdf" | "xlsx" | "csv"
  scope, // "all" | "page" | "selected"
  filterSummary, // string
  onConfirm, // (withSignature: boolean) => void – trigger the actual download
  onClose, // () => void
}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const [withSignature, setWithSignature] = useState(false);

  // Reset checkbox whenever the modal opens
  useEffect(() => {
    if (isOpen) setWithSignature(false);
  }, [isOpen]);

  // Build the displayed columns dynamically (signature col appended for PDF)
  const displayColumns = [
    ...COLUMNS,
    ...(format === "pdf" && withSignature
      ? [
          {
            key: "signature",
            label: "Signature",
            width: "w-40",
            align: "text-center",
          },
        ]
      : []),
  ];

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const meta = FORMAT_META[format] ?? FORMAT_META.xlsx;
  const totalRows = students?.length ?? 0;

  return (
    // ── Backdrop ────────────────────────────────────────────────────────────
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{
          width: "min(1120px, 95vw)",
          maxHeight: "88vh",
          animation: "epSlideUp 0.22s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Format badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${meta.color}`}
            >
              <span className={meta.iconColor}>{meta.icon}</span>
              {meta.label} Export
            </span>

            {/* Scope badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              {SCOPE_LABELS[scope] ?? scope}
            </span>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Sub-header: filter summary + record count ───────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 text-sm text-blue-800 min-w-0">
            <svg
              className="h-4 w-4 flex-shrink-0 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            <span className="font-medium text-blue-600 flex-shrink-0">
              Filters:&nbsp;
            </span>
            <span className="truncate">{filterSummary || "All Records"}</span>
          </div>

          <span className="ml-4 flex-shrink-0 text-sm font-semibold text-blue-700">
            {loading
              ? "Loading…"
              : `${totalRows.toLocaleString()} record${totalRows !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Table area ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
          {loading ? (
            // Loading skeleton
            <div className="p-8 flex flex-col items-center justify-center gap-4 h-64">
              <svg
                className="animate-spin h-10 w-10 text-blue-500"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-gray-500 text-sm">Fetching records…</p>
            </div>
          ) : totalRows === 0 ? (
            // Empty state
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
              <svg
                className="h-14 w-14 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8"
                />
              </svg>
              <p className="text-lg font-medium">No records to export</p>
              <p className="text-sm">
                Try adjusting your filters or selection.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="sticky top-0 z-10">
                  {displayColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`${col.width} ${col.align} px-3 py-2.5 bg-gray-800 text-gray-100 text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-r border-gray-700 last:border-r-0`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr
                    key={student.id ?? i}
                    className={`border-b border-gray-100 transition-colors ${
                      i % 2 === 0
                        ? "bg-white hover:bg-blue-50"
                        : "bg-blue-50/40 hover:bg-blue-100/50"
                    }`}
                  >
                    {displayColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`${col.align} px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-100 last:border-r-0 ${
                          col.key === "no"
                            ? "text-gray-400 font-mono text-xs"
                            : ""
                        }`}
                      >
                        {col.key === "signature" ? (
                          <span className="block w-32 border-b border-gray-400 mx-auto" />
                        ) : (
                          getCellValue(col, student, i)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {/* Left: info + PDF-only signature toggle */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-gray-400">
              {loading
                ? "Please wait while we fetch your data…"
                : `Preview shows all ${totalRows.toLocaleString()} record${totalRows !== 1 ? "s" : ""} that will be included in the ${meta.label} file.`}
            </p>

            {/* Signature checkbox — PDF only */}
            {format === "pdf" && (
              <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                <span
                  className={`relative flex-shrink-0 w-4 h-4 rounded border-2 transition-colors ${
                    withSignature
                      ? "bg-red-600 border-red-600"
                      : "bg-white border-gray-300 group-hover:border-red-400"
                  }`}
                >
                  <input
                    id="sig-checkbox"
                    type="checkbox"
                    checked={withSignature}
                    onChange={(e) => setWithSignature(e.target.checked)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  {withSignature && (
                    <svg
                      className="absolute inset-0 w-3 h-3 m-auto text-white"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="1.5,6 4.5,9 10.5,3" />
                    </svg>
                  )}
                </span>
                <span className="text-xs font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
                  Include Signature Column
                </span>
              </label>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              disabled={loading || totalRows === 0}
              onClick={() => onConfirm(withSignature)}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${meta.btnClass}`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download {meta.label}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes epSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

export default ExportPreview;
