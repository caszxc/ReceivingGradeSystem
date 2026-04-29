import React, { useEffect, useRef, useState } from "react";
import { convertYearLevelForDisplay } from "../utils/yearLevelConverter";

// ── Format meta ───────────────────────────────────────────────────────────────
const FORMAT_META = {
  pdf: {
    label: "PDF",
    color: "bg-red-100 text-red-700 border-red-200",
    iconColor: "text-red-500",
    btnClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-500/30",
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
    btnClass: "bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-green-500/30",
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
    btnClass: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-500/30",
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
  { key: "no", label: "No.", width: "w-10", align: "text-center" },
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
];

function getRawCellValue(col, student, index) {
  switch (col.key) {
    case "no":
      return index + 1;
    case "full_name":
      return (
        [student.last_name, student.first_name, student.middle_name]
          .filter(Boolean)
          .join(", ") || "—"
      );
    case "course":
      return student.courseData?.name || "—";
    case "year_level":
      return convertYearLevelForDisplay(student.year_level) || "—";
    case "section":
      return student.section || "—";
    case "date_enrolled":
      return student.date_enrolled
        ? new Date(student.date_enrolled).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—";
    case "signature":
      return "";
    default:
      return student[col.key] ?? "—";
  }
}

function getCellValue(col, student, index, _format) {
  const raw = getRawCellValue(col, student, index);
  return raw;
}

// ── ExportPreview component ───────────────────────────────────────────────────
function ExportPreview({
  isOpen,
  loading,
  students,
  format,
  scope,
  filterSummary,
  withSignature,
  onWithSignatureChange,
  pdfUrl,
  pdfLoading,
  onConfirm,
  onClose,
}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

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

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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

  // Render format-specific previews
  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 h-full bg-gray-50/50">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md bg-blue-400/30 animate-pulse"></div>
            <svg className="animate-spin relative z-10 h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Generating your premium preview...</p>
        </div>
      );
    }

    if (totalRows === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
          <div className="bg-white p-6 rounded-full shadow-sm border border-gray-100">
            <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700">No records found</h3>
          <p className="text-sm text-gray-500 max-w-sm text-center">Try adjusting your filters or selection to see data in this preview.</p>
        </div>
      );
    }

    if (format === "pdf") {
      return (
        <div className="flex-1 bg-[#e5e7eb] relative inner-shadow-container overflow-hidden">
          <div className="bg-white h-full w-full overflow-hidden">
            {(loading || pdfLoading) && (
              <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-md bg-red-400/30 animate-pulse"></div>
                  <svg className="animate-spin relative z-10 h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium animate-pulse">Rendering PDF preview…</p>
              </div>
            )}

            {!loading && !pdfLoading && pdfUrl && (
              <iframe
                title="PDF Preview"
                src={pdfUrl}
                className="w-full h-full"
                style={{ border: "none" }}
              />
            )}

            {!loading && !pdfLoading && !pdfUrl && (
              <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-white">
                <p className="text-gray-600 font-semibold">PDF preview unavailable</p>
                <p className="text-sm text-gray-500">Try again or proceed to export.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (format === "csv") {
      const headerRow = displayColumns.map(c => `"${c.label}"`).join(",");
      const csvRows = students.map((student, i) => {
        return displayColumns.map(col => {
          const val = getRawCellValue(col, student, i);
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",");
      });
      const csvContent = [headerRow, ...csvRows].join("\n");

      return (
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6 relative group">
          <div className="sticky top-0 left-0 w-full h-10 bg-[#2d2d2d] border-b border-[#404040] flex items-center px-4 z-10">
            <div className="flex gap-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <span className="text-[#858585] text-xs font-mono">export.csv — Terminal Preview</span>
          </div>
          <pre className="text-[#d4d4d4] font-mono text-[13px] leading-relaxed pt-12 whitespace-pre outline-none selection:bg-[#264f78]">
            <span className="text-[#569cd6] font-bold">{headerRow}</span>{"\n"}
            <span className="text-[#ce9178]">{csvRows.join("\n")}</span>
          </pre>
        </div>
      );
    }

    if (format === "xlsx") {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return (
        <div className="flex-1 overflow-auto bg-[#f3f2f1]">
          <div className="bg-white shadow-sm inline-block min-w-full">
            <table className="w-full text-[13px] border-collapse bg-white font-sans select-none">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="bg-[#f3f2f1] border border-[#c8c6c4] w-12 h-6 sticky left-0 z-30"></th>
                  {displayColumns.map((_, i) => (
                    <th key={`h-${i}`} className="bg-[#f3f2f1] border border-[#c8c6c4] px-3 py-1 text-center font-normal text-[#605e5c] min-w-25 hover:bg-[#e1dfdd] transition-colors cursor-pointer">
                      {letters[i]}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="bg-[#f3f2f1] border border-[#c8c6c4] text-center text-[#605e5c] font-normal sticky left-0 z-30 h-8">1</th>
                  {displayColumns.map((col) => (
                    <th key={`col-${col.key}`} className="border border-[#c8c6c4] px-3 py-1 font-bold text-left bg-white text-gray-800 outline-1 outline-transparent hover:outline-blue-400">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={student.id ?? i} className="hover:bg-[#f3f2f1]/50 group">
                    <td className="bg-[#f3f2f1] border border-[#c8c6c4] text-center text-[#605e5c] font-normal sticky left-0 z-10 group-hover:bg-[#e1dfdd] transition-colors cursor-pointer">
                      {i + 2}
                    </td>
                    {displayColumns.map((col) => (
                      <td key={col.key} className={`border border-[#c8c6c4] px-3 py-1.5 text-gray-700 whitespace-nowrap outline-1 outline-transparent hover:outline-blue-400 ${col.key === 'no' ? 'text-right pr-4' : 'text-left'}`}>
                        {getRawCellValue(col, student, i)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
      }}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200/50"
        style={{
          width: "min(1280px, 95vw)",
          height: "min(900px, 90vh)",
          animation: "epSlideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border ${meta.color} shadow-sm`}
            >
              <span className={meta.iconColor}>{meta.icon}</span>
              {meta.label} Preview
            </span>
            
            <div className="h-6 w-px bg-gray-200"></div>

            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              {SCOPE_LABELS[scope] ?? scope}
            </span>
            
            {filterSummary && (
              <span className="hidden md:inline-flex items-center text-xs text-gray-500 truncate max-w-md">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"></path></svg>
                {filterSummary}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              {loading ? "Loading…" : `${totalRows.toLocaleString()} rows ready`}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
              title="Close Preview (Esc)"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Dynamic Preview Area ────────────────────────────────────────── */}
        {renderPreviewContent()}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
          <div className="flex flex-col gap-1.5">
            {format === "pdf" ? (
              <label className="inline-flex items-center gap-3 cursor-pointer group p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={withSignature}
                    onChange={(e) => onWithSignatureChange?.(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-red-600 peer-checked:border-red-600 transition-all"></div>
                  <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 peer-checked:scale-100 scale-50 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                  Include Blank Signature Column
                </span>
              </label>
            ) : (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Verify your data before exporting.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              disabled={loading || totalRows === 0}
              onClick={() => onConfirm()}
              className={`group inline-flex items-center gap-2.5 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${meta.btnClass}`}
            >
              <svg
                className="h-4 w-4 group-hover:animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export {meta.label} File
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes epSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .inner-shadow-container {
          box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
        }
        /* Custom scrollbar for preview areas */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        /* Dark scrollbar for CSV */
        .bg-\\[\\#1e1e1e\\]::-webkit-scrollbar-thumb {
          background: #404040;
        }
        .bg-\\[\\#1e1e1e\\]::-webkit-scrollbar-thumb:hover {
          background: #555555;
        }
      `}</style>
    </div>
  );
}

export default ExportPreview;

