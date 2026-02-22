import React, { useState, useRef, useEffect } from "react";

// ── Reusable scope row with collapsible format sub-panel ─────────────────────
function FormatSubMenu({ scope, label, activeScope, onSetScope, onExport, selectedCount }) {
    const disabled = scope === "selected" && selectedCount === 0;

    return (
        <div className="border-b border-gray-100 last:border-0">
            {/* Scope label row */}
            <div
                onClick={() => !disabled && onSetScope(activeScope === scope ? null : scope)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${disabled
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
                    <button
                        onClick={() => onExport(scope, "xlsx")}
                        className="w-full flex items-center gap-2.5 px-6 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                        <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 19l-2-3h1.2l1.3 2 1.3-2H11.5l-2 3H8.5zm4.2 0l-2-5h1.3l1.35 3.5L14.7 14H16l-2 5h-1.3zm4.3 0v-5H18v5h-1z" />
                        </svg>
                        Excel (.xlsx)
                    </button>
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
                </div>
            )}
        </div>
    );
}

// ── Main ExportButton component ──────────────────────────────────────────────
function ExportButton({
    searchQuery,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
    selectedIds, // Set<number>
}) {
    const [exporting, setExporting] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeScope, setActiveScope] = useState(null); // 'all' | 'page' | 'selected'
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

    const handleExport = async (scope, format) => {
        setOpen(false);
        setActiveScope(null);

        if (scope === "selected" && selectedIds.size === 0) {
            alert("Please select at least one row to export.");
            return;
        }

        setExporting(true);
        try {
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
                className="inline-flex items-center gap-2 pl-4 pr-3 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-l-lg hover:bg-blue-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
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
