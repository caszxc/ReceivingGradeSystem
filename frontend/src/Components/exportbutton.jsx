import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── helpers ───────────────────────────────────────────────────────────────────
function getSemesterLabel(sem) {
  const labels = { 1: "1st", 2: "2nd" };
  return labels[parseInt(sem)] ? `${labels[parseInt(sem)]} Semester` : `Semester ${sem}`;
}

function buildFilterSummary(filters) {
  const parts = [];
  if (filters?.yearLevel) parts.push(`Year Level: ${filters.yearLevel}`);
  if (filters?.semester) parts.push(getSemesterLabel(filters.semester));
  if (filters?.course) parts.push(`Course: ${filters.course}`);
  if (filters?.section) parts.push(`Section: ${filters.section}`);
  if (filters?.dateYearFrom || filters?.dateYearTo) {
    const from = filters.dateYearFrom || "…";
    const to = filters.dateYearTo || "…";
    parts.push(`A.Y. ${from}–${to}`);
  }
  return parts.length ? parts.join("  |  ") : "All Records";
}

// ── Reusable scope row with collapsible format sub-panel ──────────────────────
function FormatSubMenu({
  scope,
  label,
  activeScope,
  onSetScope,
  onExport,
  selectedCount,
}) {
  const disabled = scope === "selected" && selectedCount === 0;

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Scope label row */}
      <div
        onClick={() =>
          !disabled && onSetScope(activeScope === scope ? null : scope)
        }
        className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
          disabled
            ? "text-gray-300 cursor-not-allowed"
            : activeScope === scope
              ? "bg-blue-600 text-white cursor-pointer"
              : "text-gray-900 hover:bg-blue-600 hover:text-white cursor-pointer"
        }`}
      >
        <span className="flex items-center gap-2">
          {label}
          {scope === "selected" && selectedCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full leading-none">
              {selectedCount}
            </span>
          )}
        </span>
        {!disabled && (
          <svg
            className={`h-3 w-3 opacity-60 transition-transform duration-150 ${activeScope === scope ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Format sub-panel */}
      {activeScope === scope && (
        <div className="bg-gray-50 border-t border-gray-100">
          {/* Excel */}
          <button
            onClick={() => onExport(scope, "xlsx")}
            className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 19l-2-3h1.2l1.3 2 1.3-2H11.5l-2 3H8.5zm4.2 0l-2-5h1.3l1.35 3.5L14.7 14H16l-2 5h-1.3zm4.3 0v-5H18v5h-1z" />
            </svg>
            Excel (.xlsx)
          </button>

          {/* CSV */}
          <button
            onClick={() => onExport(scope, "csv")}
            className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            CSV (.csv)
          </button>

          {/* PDF */}
          <button
            onClick={() => onExport(scope, "pdf")}
            className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-red-600 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM11.5 18H10v-5h1.5c1.1 0 2 .9 2 2s-.9 2-2 2zm0-3.5H11v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zm3 3.5v-5h1c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-1zm1-3.5v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5H15zm-8 3.5v-5h3v1h-2v1h2v1h-2v2H7z" />
            </svg>
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ExportButton component ───────────────────────────────────────────────
function ExportButton({
  searchQuery,
  sortBy,
  sortOrder,
  currentPage,
  itemsPerPage,
  selectedIds, // Set<number>
  filters = {},
}) {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeScope, setActiveScope] = useState(null);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setActiveScope(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── PDF Generation (client-side) ──────────────────────────────────────────
  const generatePdf = async (scope) => {
    let students = [];

    if (scope === "selected") {
      // Fetch all students (no pagination) then filter by selectedIds client-side
      const jsonParams = new URLSearchParams({ sortBy, sortOrder, limit: 99999, page: 1 });
      if (filters.dateYearFrom) jsonParams.set("dateYearFrom", filters.dateYearFrom);
      if (filters.dateYearTo) jsonParams.set("dateYearTo", filters.dateYearTo);
      const res = await fetch(
        `http://localhost:3001/students/getStudent?${jsonParams.toString()}`
      );
      const data = await res.json();
      const all = data.rows ?? data;
      students = all.filter((s) => selectedIds.has(s.id));
    } else {
      // Use a common JSON endpoint
      const jsonParams = new URLSearchParams({ sortBy, sortOrder, limit: 99999, page: 1 });
      if (searchQuery && searchQuery.trim() !== "") jsonParams.set("query", searchQuery.trim());
      if (filters.yearLevel) jsonParams.set("yearLevel", filters.yearLevel);
      if (filters.semester) jsonParams.set("semester", filters.semester);
      if (filters.course) jsonParams.set("course", filters.course);
      if (filters.section) jsonParams.set("section", filters.section);
      if (filters.dateYearFrom) jsonParams.set("dateYearFrom", filters.dateYearFrom);
      if (filters.dateYearTo) jsonParams.set("dateYearTo", filters.dateYearTo);

      if (scope === "page") {
        jsonParams.set("page", currentPage);
        jsonParams.set("limit", itemsPerPage);
      }

      const endpoint = searchQuery && searchQuery.trim() !== ""
        ? "searchStudent"
        : "getStudent";

      const res = await fetch(
        `http://localhost:3001/students/${endpoint}?${jsonParams.toString()}`
      );
      const data = await res.json();
      students = data.rows ?? data;
    }

    // 3. Build the PDF
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ── Header band ─────────────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, pageWidth, 28, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Student Enrollment Report", 14, 12);

    // Sub-title: filter summary
    const filterSummary = buildFilterSummary(filters);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(filterSummary, 14, 20);

    // Date printed (top-right)
    const now = new Date();
    const printedOn = now.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const printedAt = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
    doc.setFontSize(7);
    doc.text(`Printed: ${printedOn}  ${printedAt}`, pageWidth - 14, 12, { align: "right" });
    doc.text(`Total records: ${students.length}`, pageWidth - 14, 18, { align: "right" });

    // Scope badge
    const scopeText = scope === "page" ? "Current Page" : scope === "selected" ? "Selected Rows" : "All Records";
    doc.setFontSize(7);
    doc.text(`Scope: ${scopeText}`, pageWidth - 14, 24, { align: "right" });

    // ── Table ────────────────────────────────────────────────────────────────
    const rows = students.map((s, i) => [
      i + 1,
      s.student_number ?? "—",
      [s.last_name, s.first_name, s.middle_name].filter(Boolean).join(", "),
      s.course ?? "—",
      s.year_level ?? "—",
      s.section ?? "—",
      s.semester ?? "—",
      s.card_type ?? "—",
      s.card_status ?? "—",
      s.card_serial_number ?? "—",
      s.date_enrolled
        ? new Date(s.date_enrolled).toLocaleDateString("en-PH")
        : "—",
    ]);

    autoTable(doc, {
      startY: 32,
      head: [[
        "#",
        "Student No.",
        "Full Name",
        "Course",
        "Yr",
        "Sec",
        "Sem",
        "Card Type",
        "Status",
        "Serial #",
        "Date Enrolled",
      ]],
      body: rows,
      theme: "striped",
      headStyles: {
        fillColor: [30, 64, 175], // blue-800
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [31, 41, 55],
      },
      alternateRowStyles: {
        fillColor: [239, 246, 255], // blue-50
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 24 },
        2: { cellWidth: 52 },
        3: { cellWidth: 22 },
        4: { halign: "center", cellWidth: 10 },
        5: { halign: "center", cellWidth: 10 },
        6: { halign: "center", cellWidth: 10 },
        7: { cellWidth: 22 },
        8: { cellWidth: 18 },
        9: { cellWidth: 22 },
        10: { cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
      // Footer on every page
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
        // light footer line
        doc.setDrawColor(200);
        doc.line(14, pageHeight - 8, pageWidth - 14, pageHeight - 8);
      },
    });

    // 4. Save
    const ayLabel =
      filters.dateYearFrom && filters.dateYearTo
        ? `AY_${filters.dateYearFrom}-${filters.dateYearTo}`
        : "ALL";
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    doc.save(`student_report_${ayLabel}_${timestamp}.pdf`);
  };

  // ── Main export handler ───────────────────────────────────────────────────
  const handleExport = async (scope, format) => {
    setOpen(false);
    setActiveScope(null);

    if (scope === "selected" && selectedIds.size === 0) {
      alert("Please select at least one row to export.");
      return;
    }

    setExporting(true);
    try {
      if (format === "pdf") {
        await generatePdf(scope);
        return;
      }

      // xlsx / csv  ── existing logic, now with filters
      const params = new URLSearchParams({ format, scope, sortBy, sortOrder });

      if (scope === "page") {
        params.set("page", currentPage);
        params.set("limit", itemsPerPage);
      }
      if (searchQuery && searchQuery.trim() !== "") {
        params.set("query", searchQuery.trim());
      }
      if (scope === "selected") {
        [...selectedIds].forEach((id) => params.append("ids[]", id));
      }

      // Pass active filters
      if (filters.yearLevel) params.set("yearLevel", filters.yearLevel);
      if (filters.semester) params.set("semester", filters.semester);
      if (filters.course) params.set("course", filters.course);
      if (filters.section) params.set("section", filters.section);
      if (filters.dateYearFrom) params.set("dateYearFrom", filters.dateYearFrom);
      if (filters.dateYearTo) params.set("dateYearTo", filters.dateYearTo);

      const url = `http://localhost:3001/students/exportStudents?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      link.href = objectUrl;
      link.download = match ? match[1] : `students_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative flex" ref={menuRef}>
      {/* Left: main label button */}
      <button
        disabled={exporting}
        onClick={() => {
          setOpen(true);
          setActiveScope("all");
        }}
        className="inline-flex items-center gap-2 pl-4 pr-3 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-l-lg hover:bg-blue-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        {exporting ? "Exporting…" : "Export"}
      </button>

      {/* Right: chevron toggle */}
      <button
        disabled={exporting}
        onClick={() => {
          setOpen((p) => !p);
          setActiveScope(null);
        }}
        className="inline-flex items-center px-2.5 py-2 bg-blue-700 text-white rounded-r-lg border-l border-blue-500 hover:bg-blue-600 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Active filter hint */}
          {(filters.dateYearFrom || filters.dateYearTo || filters.yearLevel || filters.semester || filters.course || filters.section) && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 leading-snug">
              <span className="font-semibold">Filtered: </span>
              {buildFilterSummary(filters)}
            </div>
          )}

          <FormatSubMenu
            scope="all"
            label="All"
            activeScope={activeScope}
            onSetScope={setActiveScope}
            onExport={handleExport}
            selectedCount={selectedIds.size}
          />
          <FormatSubMenu
            scope="page"
            label="Current page"
            activeScope={activeScope}
            onSetScope={setActiveScope}
            onExport={handleExport}
            selectedCount={selectedIds.size}
          />
          <FormatSubMenu
            scope="selected"
            label="Selected rows"
            activeScope={activeScope}
            onSetScope={setActiveScope}
            onExport={handleExport}
            selectedCount={selectedIds.size}
          />
        </div>
      )}
    </div>
  );
}

export default ExportButton;
