import React, { useState, useRef, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExportPreview from "./exportpreview";
import { convertYearLevelForDisplay } from "../utils/yearLevelConverter";
import { BASE_URL } from "../Api/baseUrl";
import axios from "axios";

// ── helpers ───────────────────────────────────────────────────────────────────
function getSemesterLabel(sem) {
  const labels = { 1: "1st", 2: "2nd" };
  return labels[parseInt(sem)]
    ? `${labels[parseInt(sem)]} Semester`
    : `Semester ${sem}`;
}

function buildFilterSummary(filters, students = [], filterOptions = {}) {
  const parts = [];

  const resolveCourseName = () => {
    const selectedId = filters && filters.course ? String(filters.course) : "";
    const fromOptions = (
      filterOptions && filterOptions.coursesWithMajors
        ? filterOptions.coursesWithMajors
        : []
    ).find((c) => String(c.id) === selectedId);

    const fromStudent =
      students.length > 0
        ? students[0].courseData?.name || students[0].course || ""
        : "";

    return (fromOptions && fromOptions.name) || fromStudent || "";
  };

  if (filters && filters.yearLevel) {
    parts.push("Year Level: " + convertYearLevelForDisplay(filters.yearLevel));
  }
  if (filters && filters.semester) {
    parts.push(getSemesterLabel(filters.semester));
  }
  if (filters && filters.course) {
    const courseName = resolveCourseName();
    parts.push("Course: " + (courseName || "N/A"));
  }
  if (filters && filters.section) {
    parts.push("Section: " + filters.section);
  }

  if (filters && filters.academicYear) {
    const academicYearObj = filterOptions.academicYears?.find(
      (ay) => ay.value == filters.academicYear,
    );
    const ayName = academicYearObj
      ? String(academicYearObj.label || "")
          .replace(/\s*\((?:active)\)\s*$/i, "")
          .trim()
      : filters.academicYear;
    parts.push("A.Y. " + ayName);
  }

  return parts.length ? parts.join(" | ") : "All Records";
}

// ── Fetch student data (shared by preview + PDF) ──────────────────────────────
async function fetchStudentData({
  scope,
  selectedIds,
  searchQuery,
  sortBy,
  sortOrder,
  currentPage,
  itemsPerPage,
  filters,
}) {
  if (scope === "selected") {
    const p = new URLSearchParams({
      sortBy,
      sortOrder,
      limit: 99999,
      page: 1,
    });

    if (filters?.yearLevel) p.set("yearLevel", filters.yearLevel);
    if (filters?.semester) p.set("semester", filters.semester);
    if (filters?.course) p.set("course", filters.course);
    if (filters?.section) p.set("section", filters.section);

    // const res = await fetch(
    //   `http://localhost:3001/students/getStudent?${p.toString()}`,
    // );
    // const data = await res.json();
    // const all = data.rows ?? data;
    const res = await axios.get(
      `${BASE_URL}/students/getStudent?${p.toString()}`,
    );

    const data = res.data;
    const all = data.rows ?? data;

    const selectedIdSet = new Set(Array.from(selectedIds, (id) => String(id)));
    return all.filter((s) => selectedIdSet.has(String(s.id)));
  }

  const p = new URLSearchParams({ sortBy, sortOrder, limit: 99999, page: 1 });
  if (searchQuery && searchQuery.trim() !== "")
    p.set("query", searchQuery.trim());
  if (filters?.academicYear) p.set("academicYear", filters.academicYear);
  if (filters?.yearLevel) p.set("yearLevel", filters.yearLevel);
  if (filters?.semester) p.set("semester", filters.semester);
  if (filters?.course) p.set("course", filters.course);
  if (filters?.section) p.set("section", filters.section);

  if (scope === "page") {
    p.set("limit", itemsPerPage);
    p.set("page", currentPage);
  }

  const endpoint =
    searchQuery && searchQuery.trim() !== "" ? "searchStudent" : "getStudent";
  // const res = await fetch(
  //   `http://localhost:3001/students/${endpoint}?${p.toString()}`,
  // );
  // const data = await res.json();
  const res = await axios.get(
    `${BASE_URL}/students/${endpoint}?${p.toString()}`,
  );

  const data = res.data;
  return data.rows ?? data;
}

// ── Load image as data URL ────────────────────────────────────────────────────
function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

// ── PDF renderer ──────────────────────────────────────────────────────────────
async function renderPdf({
  students,
  filters,
  filterOptions,
  now,
  withSignature,
  output = "save",
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  // Keep a comfortable margin for header/footer text,
  // but allow the table to span the full page width.
  const headerMarginLeft = 14;
  const headerMarginRight = 14;
  // Small side margin so the table isn't flush to the page edge.
  // (0.5cm ≈ 5mm)
  const tableMarginLeft = 5;
  const tableMarginRight = 5;

  // ── Load PLV logo ─────────────────────────────────────────────────────────
  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageAsDataUrl("/assets/PLV_Logo.png");
  } catch (e) {
    console.warn("Could not load PLV logo for PDF header:", e);
  }

  // ── Build dynamic header text from filters ────────────────────────────────
  const semLabel = filters?.semester ? getSemesterLabel(filters.semester) : "";

  // Look up academic year name from filterOptions
  let ayFrom = "";
  let ayTo = "";
  if (filters?.academicYear && filterOptions?.academicYears) {
    const academicYearObj = filterOptions.academicYears.find(
      (ay) => ay.id == filters.academicYear || ay.value == filters.academicYear,
    );
    if (academicYearObj) {
      const ayRaw = academicYearObj.academic_year || academicYearObj.label || "";
      const ayName = String(ayRaw)
        .replace(/\s*\((?:active)\)\s*$/i, "")
        .trim();
      const parts = ayName.split("-").map((p) => p.trim());
      ayFrom = parts[0] || "";
      ayTo = parts[1] || "";
    }
  }

  const schoolYear = ayFrom && ayTo ? `School Year ${ayFrom} - ${ayTo}` : "";
  const semesterLine =
    semLabel && schoolYear
      ? `${semLabel} ${schoolYear}`
      : semLabel || schoolYear || "";

  // NOTE: Course/section values are intentionally not printed in the header
  // to match the provided sample header layout.

  // ── Draw premium header ──────────────────────────────────────────────
  function drawHeader(doc) {
    const top = 10;
    const centerX = pageWidth / 2;

    // Logo at left (as in the sample)
    const logoSize = 18;
    const logoX = headerMarginLeft;
    const logoY = top;
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoSize, logoSize);
    }

    // Header text centered on the page
    const maxTitleWidth =
      pageWidth - headerMarginLeft - headerMarginRight - (logoDataUrl ? logoSize + 6 : 0);
    const title = "PAMANTASAN NG LUNGSOD NG VALENZUELA";

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const titleLines = doc.splitTextToSize(title, maxTitleWidth);
    const titleLineHeight = 5.5;

    // Align the text block to visually match the logo height.
    // Start slightly below the logo top for a clean baseline.
    let y = top + 6;
    titleLines.forEach((line, i) => {
      doc.text(line, centerX, y + i * titleLineHeight, { align: "center" });
    });
    y += titleLines.length * titleLineHeight + 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("STUDENT MASTERLIST", centerX, y, { align: "center" });
    y += 5;

    if (semesterLine) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(semesterLine, centerX, y, { align: "center" });
      y += 4;
    }

    // Optional course/section line is intentionally omitted to match the printed header sample.
    const contentBottom = Math.max(y, top + (logoDataUrl ? logoSize : 0));

    // Divider line
    const lineY = contentBottom + 3;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(0, lineY, pageWidth, lineY);

    return lineY + 3; // next content Y
  }

  const tableStartY = drawHeader(doc);

  const drawNothingFollows = (y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("-----------------------NOTHING FOLLOWS-----------------------", pageWidth / 2, y, { align: "center" });
  };

  // ── Table Data Mapping ─────────────────────────────────────────────────────
  const baseHeaders = ["No.", "Student Name", "Student No.", "Course", "Year", "Section"];
  if (withSignature) baseHeaders.push("Signature");

  const rows = students.map((s, i) => {
    const fullName = [s.last_name, s.first_name, s.middle_name].filter(Boolean).join(", ");
    const course = s.courseData?.name || s.course || "—";
    const yearLevel = convertYearLevelForDisplay(s.year_level) || "—";
    const section = s.section || "—";

    const rowData = [
      i + 1,
      fullName,
      s.student_number ?? "—",
      course,
      yearLevel,
      section,
    ];
    if (withSignature) rowData.push("");
    return rowData;
  });

  // If there are no rows, render a small label and skip the table.
  if (rows.length === 0) {
    drawNothingFollows(tableStartY + 12);

    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const ayLabel = ayFrom && ayTo ? `AY_${ayFrom}-${ayTo}` : "ALL";
    const fileName = `student_masterlist_${ayLabel}_${timestamp}.pdf`;

    if (output === "blob") {
      const blob = doc.output("blob");
      return { blob, fileName };
    }

    doc.save(fileName);
    return { fileName };
  }

  // Column widths: keep small columns fixed, and expand key columns to fill the page width.
  const getColStyles = () => {
    const availableWidth = pageWidth - tableMarginLeft - tableMarginRight;

    if (withSignature) {
      const fixed = {
        0: 10, // No.
        2: 24, // Student No.
        4: 14, // Year
        5: 14, // Sec
      };
      const flexDefaults = {
        1: 55, // Student Name
        3: 55, // Course
        6: 24, // Signature
      };

      const fixedTotal = Object.values(fixed).reduce((a, b) => a + b, 0);
      const flexTotalDefault = Object.values(flexDefaults).reduce((a, b) => a + b, 0);
      const flexTarget = Math.max(0, availableWidth - fixedTotal);
      const scale = flexTotalDefault > 0 ? flexTarget / flexTotalDefault : 1;

      const nameW = Math.round(flexDefaults[1] * scale);
      const courseW = Math.round(flexDefaults[3] * scale);
      const sigW = Math.max(0, flexTarget - nameW - courseW);

      return {
        0: { halign: "center", cellWidth: fixed[0] },
        1: { cellWidth: nameW },
        2: { halign: "center", cellWidth: fixed[2] },
        3: { cellWidth: courseW },
        4: { halign: "center", cellWidth: fixed[4] },
        5: { halign: "center", cellWidth: fixed[5] },
        6: { cellWidth: sigW },
      };
    }

    const fixed = {
      0: 12, // No.
      2: 26, // Student No.
      4: 14, // Year
      5: 18, // Sec
    };
    const fixedTotal = Object.values(fixed).reduce((a, b) => a + b, 0);
    const flexTarget = Math.max(0, availableWidth - fixedTotal);

    // Distribute remaining width between Name and Course (roughly like the old layout).
    const nameRatio = 60;
    const courseRatio = 65;
    const ratioTotal = nameRatio + courseRatio;
    const nameW = Math.round((flexTarget * nameRatio) / ratioTotal);
    const courseW = Math.max(0, flexTarget - nameW);

    return {
      0: { halign: "center", cellWidth: fixed[0] },
      1: { cellWidth: nameW },
      2: { halign: "center", cellWidth: fixed[2] },
      3: { cellWidth: courseW },
      4: { halign: "center", cellWidth: fixed[4] },
      5: { halign: "center", cellWidth: fixed[5] },
    };
  };

  autoTable(doc, {
    startY: tableStartY,
    head: [baseHeaders],
    body: rows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      minCellHeight: 12,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    bodyStyles: {
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: getColStyles(),
    tableWidth: pageWidth - tableMarginLeft - tableMarginRight,
    margin: { left: tableMarginLeft, right: tableMarginRight },
    didDrawCell: (data) => {
      // Draw a line for the signature cell to make it look ready to sign
      if (withSignature && data.section === 'body' && data.column.index === 6) {
        const { x, y, width, height } = data.cell;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        // Draw horizontal line in the middle-bottom of the cell
        doc.line(x + 2, y + height - 2, x + width - 2, y + height - 2);
      }
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont("helvetica", "normal");

      // Left side - Timestamp
      const printDate = new Date().toLocaleString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      doc.text(`Printed: ${printDate}`, headerMarginLeft, pageHeight - 6);

      // Right side - Page Number
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth - headerMarginRight,
        pageHeight - 6,
        { align: "right" }
      );

      // Footer Top Border
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(
        headerMarginLeft,
        pageHeight - 9,
        pageWidth - headerMarginRight,
        pageHeight - 9
      );
    },
  });

  // End-of-list marker
  const afterTableY = (doc.lastAutoTable?.finalY ?? tableStartY) + 8;
  const safeBottomY = pageHeight - 14;
  if (afterTableY > safeBottomY) {
    doc.addPage();
    const y = drawHeader(doc) + 12;
    drawNothingFollows(y);
  } else {
    drawNothingFollows(afterTableY);
  }

  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const ayLabel = ayFrom && ayTo ? `AY_${ayFrom}-${ayTo}` : "ALL";
  const fileName = `student_masterlist_${ayLabel}_${timestamp}.pdf`;

  if (output === "blob") {
    const blob = doc.output("blob");
    return { blob, fileName };
  }

  doc.save(fileName);
  return { fileName };
}

// ── xlsx / csv downloader (backend) ──────────────────────────────────────────
async function downloadFile({
  format,
  scope,
  sortBy,
  sortOrder,
  currentPage,
  itemsPerPage,
  searchQuery,
  selectedIds,
  filters,
}) {
  const params = new URLSearchParams({ format, scope, sortBy, sortOrder });

  if (scope === "page") {
    params.set("limit", itemsPerPage);
    params.set("page", currentPage);
  }
  if (searchQuery && searchQuery.trim() !== "")
    params.set("query", searchQuery.trim());
  if (scope === "selected") {
    params.set("ids", Array.from(selectedIds).join(","));
  }

  // Add all filters
  if (filters?.academicYear) params.set("academicYear", filters.academicYear);
  if (filters?.yearLevel) params.set("yearLevel", filters.yearLevel);
  if (filters?.semester) params.set("semester", filters.semester);
  if (filters?.course) params.set("course", filters.course);
  if (filters?.section) params.set("section", filters.section);

  // const response = await fetch(
  //   `http://localhost:3001/students/exportStudents?${params.toString()}`,
  // );
  // if (!response.ok) {
  //   throw new Error("Export failed");
  // }
  const response = await axios.get(`${BASE_URL}/students/exportStudents`, {
    params,
    responseType: "blob",
  });

  const blob = response.data;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.href = objectUrl;
  link.download = match ? match[1] : `students_export.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

// ── Main ExportButton component ───────────────────────────────────────────────
function ExportButton({
  searchQuery,
  sortBy,
  sortOrder,
  currentPage,
  itemsPerPage,
  selectedIds, // Set<number>
  filterOptions = {},
  filters = {},
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // ── Preview modal state ───────────────────────────────────────────────────
  const [preview, setPreview] = useState({
    isOpen: false,
    loading: false,
    students: [],
    format: "xlsx",
    scope: "all",
    now: null,
    withSignature: false,
    pdfLoading: false,
    pdfUrl: null,
    pdfBlob: null,
    pdfFileName: null,
  });

  // Cleanup any object URLs we create
  useEffect(() => {
    return () => {
      if (preview.pdfUrl) URL.revokeObjectURL(preview.pdfUrl);
    };
    // Intentionally run only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePdfPreview = useCallback(
    async ({ students, withSignature, now }) => {
      // Revoke old URL first to avoid leaks
      setPreview((p) => {
        if (p.pdfUrl) URL.revokeObjectURL(p.pdfUrl);
        return { ...p, pdfLoading: true, pdfUrl: null, pdfBlob: null, pdfFileName: null };
      });

      try {
        const { blob, fileName } = await renderPdf({
          students,
          filters,
          filterOptions,
          now,
          withSignature,
          output: "blob",
        });
        const url = URL.createObjectURL(blob);
        setPreview((p) => ({
          ...p,
          pdfLoading: false,
          pdfUrl: url,
          pdfBlob: blob,
          pdfFileName: fileName,
        }));
      } catch (e) {
        console.error("PDF preview generation failed:", e);
        setPreview((p) => ({ ...p, pdfLoading: false }));
      }
    },
    [filters, filterOptions],
  );

  // Snapshot of params at the moment user clicked — used on confirm
  const pendingRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Open preview: fetch data then show modal ──────────────────────────────
  const handleExport = useCallback(
    async (scope, format) => {
      setOpen(false);

      if (scope === "selected" && selectedIds.size === 0) {
        alert("Please select at least one row to export.");
        return;
      }

      // Save params for the confirm step
      pendingRef.current = {
        scope,
        format,
        sortBy,
        sortOrder,
        currentPage,
        itemsPerPage,
        searchQuery,
        selectedIds,
        filters,
      };

      // Open preview in loading state
      const now = new Date();
      setPreview({
        isOpen: true,
        loading: true,
        students: [],
        format,
        scope,
        now,
        withSignature: false,
        pdfLoading: false,
        pdfUrl: null,
        pdfBlob: null,
        pdfFileName: null,
      });

      try {
        const students = await fetchStudentData({
          scope,
          selectedIds,
          searchQuery,
          sortBy,
          sortOrder,
          currentPage,
          itemsPerPage,
          filters,
        });
        setPreview((p) => ({ ...p, loading: false, students }));

        if (format === "pdf") {
          await generatePdfPreview({ students, withSignature: false, now });
        }
      } catch (err) {
        console.error("Preview fetch error:", err);
        setPreview((p) => ({ ...p, loading: false }));
        alert("Failed to load preview. Please try again.");
      }
    },
    [
      searchQuery,
      sortBy,
      sortOrder,
      currentPage,
      itemsPerPage,
      selectedIds,
      filters,
      generatePdfPreview,
    ],
  );

  // ── Confirm: do the actual export ────────────────────────────────────────
  const handleConfirm = useCallback(
    async () => {
      const { format, students, pdfBlob, pdfFileName, now, withSignature } = preview;
      const params = pendingRef.current;
      if (!params) return;

      setPreview((p) => ({ ...p, isOpen: false }));

      try {
        if (format === "pdf") {
          // Download the exact PDF that was previewed (WYSIWYG)
          if (pdfBlob && pdfFileName) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = pdfFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else {
            // Fallback: generate and save
            await renderPdf({
              students,
              filters: params.filters,
              filterOptions,
              now: now || new Date(),
              withSignature,
              output: "save",
            });
          }
        } else {
          await downloadFile(params);
        }
      } catch (err) {
        console.error("Export error:", err);
        alert("Export failed. Please try again.");
      }
    },
    [preview, filterOptions],
  );

  const filterSummary = buildFilterSummary(
    filters,
    preview.students,
    filterOptions,
  );

  return (
    <>
      {/* ── Dropdown trigger ───────────────────────────────────────────────── */}
      <div className="relative flex" ref={menuRef}>
        {/* Left: main label button */}
        <button
          onClick={() => {
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 pl-4 pr-3 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-l-lg hover:bg-blue-500 focus:outline-none transition-colors"
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
          Export
        </button>

        {/* Right: chevron toggle */}
        <button
          onClick={() => {
            setOpen((p) => !p);
          }}
          className="inline-flex items-center px-2.5 py-2 bg-blue-700 text-white rounded-r-lg border-l border-blue-500 hover:bg-blue-600 focus:outline-none transition-colors"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Active filter hint */}
            {
              // filters.dateYearFrom ||
              // filters.dateYearTo ||
              (filters.academicYear ||
                filters.yearLevel ||
                filters.semester ||
                filters.course ||
                filters.section) && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 leading-snug">
                  <span className="font-semibold">Filtered: </span>
                  {filterSummary}
                </div>
              )
            }

            {/* Excel */}
            <button
              onClick={() => handleExport("all", "xlsx")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <svg
                className="h-4 w-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 19l-2-3h1.2l1.3 2 1.3-2H11.5l-2 3H8.5zm4.2 0l-2-5h1.3l1.35 3.5L14.7 14H16l-2 5h-1.3zm4.3 0v-5H18v5h-1z" />
              </svg>
              Excel (.xlsx)
            </button>

            {/* CSV */}
            <button
              onClick={() => handleExport("all", "csv")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <svg
                className="h-4 w-4 text-blue-500"
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
              CSV (.csv)
            </button>

            {/* PDF */}
            <button
              onClick={() => handleExport("all", "pdf")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-600 hover:text-white transition-colors"
            >
              <svg
                className="h-4 w-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM11.5 18H10v-5h1.5c1.1 0 2 .9 2 2s-.9 2-2 2zm0-3.5H11v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zm3 3.5v-5h1c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-1zm1-3.5v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5H15zm-8 3.5v-5h3v1h-2v1h2v1h-2v2H7z" />
              </svg>
              PDF (.pdf)
            </button>
          </div>
        )}
      </div>

      {/* ── Export Preview Modal ────────────────────────────────────────────── */}
      <ExportPreview
        isOpen={preview.isOpen}
        loading={preview.loading}
        students={preview.students}
        format={preview.format}
        scope={preview.scope}
        filterSummary={filterSummary}
        withSignature={preview.withSignature}
        onWithSignatureChange={async (next) => {
          setPreview((p) => ({ ...p, withSignature: next }));
          if (preview.format === "pdf" && preview.students?.length) {
            await generatePdfPreview({
              students: preview.students,
              withSignature: next,
              now: preview.now || new Date(),
            });
          }
        }}
        pdfUrl={preview.pdfUrl}
        pdfLoading={preview.pdfLoading}
        onConfirm={handleConfirm}
        onClose={() =>
          setPreview((p) => {
            if (p.pdfUrl) URL.revokeObjectURL(p.pdfUrl);
            return { ...p, isOpen: false, pdfUrl: null, pdfBlob: null, pdfFileName: null };
          })
        }
      />
    </>
  );
}

export default ExportButton;
