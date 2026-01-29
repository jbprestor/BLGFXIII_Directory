import { useState } from "react";
import { exportXlsxFromJson } from "../../utils/exportXlsx.js"; // adjust path as needed

export default function SearchFilters({
  searchTerm,
  setSearchTerm,
  selectedLguType,
  setSelectedLguType,
  selectedStatus,
  setSelectedStatus,
  selectedRegion,
  setSelectedRegion,
  selectedProvince,      // <-- new prop
  setSelectedProvince,   // <-- new prop
  selectedSex,
  setSelectedSex,
  selectedLicenseStatus, // new
  setSelectedLicenseStatus, // new
  selectedPositionCategory, // new
  setSelectedPositionCategory, // new
  uniqueRegions,
  uniqueProvinces,       // <-- new prop
  resultCount,
  exportData = [],       // filteredData from parent (what will be exported)
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset all filters + search
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedLguType("all");
    setSelectedStatus("all");
    setSelectedRegion("all");
    setSelectedProvince?.("all"); // optional chaining in case parent didn't pass
    setSelectedSex("all");
    setSelectedLicenseStatus?.("all");
    setSelectedPositionCategory?.("all");
  };

  // Consider province in "is filter active"
  const isFilterActive =
    (searchTerm || "") !== "" ||
    (selectedLguType || "all") !== "all" ||
    (selectedStatus || "all") !== "all" ||
    (selectedRegion || "all") !== "all" ||
    (selectedProvince || "all") !== "all" ||
    (selectedSex || "all") !== "all" ||
    (selectedLicenseStatus || "all") !== "all" ||
    (selectedPositionCategory || "all") !== "all";

  const hasExportData = Array.isArray(exportData) && exportData.length > 0;

  // CSV export helper (keeps earlier behavior)
  const exportToCSV = (data, filename = "export.csv") => {
    if (!Array.isArray(data) || data.length === 0) return;

    const normalize = (obj) => {
      const out = {};
      Object.keys(obj).forEach((k) => {
        const val = obj[k];
        if (val == null) out[k] = "";
        else if (typeof val === "object" && !Array.isArray(val)) out[k] = val.name ?? JSON.stringify(val);
        else out[k] = String(val);
      });
      return out;
    };

    const first = normalize(data[0]);
    const headers = Object.keys(first);

    const rows = data.map((d) => {
      const norm = normalize(d);
      return headers.map((h) => {
        const cell = norm[h] ?? "";
        const escaped = cell.replace(/"/g, '""');
        return /["\n,]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(",");
    });

    const csvContent = "\uFEFF" + [headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-sm border border-base-300 p-3">
      {/* Top Row: Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Input (Grows) */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-base-content/50" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search personnel..."
            className="input input-bordered input-sm w-full pl-10 bg-base-100 focus:bg-base-200 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Result Count - Subtle */}
          <span className="text-xs text-base-content/60 font-medium whitespace-nowrap mr-2">
            {resultCount} found
          </span>

          {/* Advanced Filter Toggle */}
          <button
            type="button"
            className={`btn btn-sm btn-square ${showAdvanced ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Advanced Filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>

          {/* Export Dropdown */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className={`btn btn-sm btn-ghost btn-square ${!hasExportData ? "opacity-50 pointer-events-none" : ""}`} title="Export Data">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44 z-50">
              <li>
                <button
                  onClick={() => exportXlsxFromJson(exportData, "assessors_export.xlsx")}
                  className={!hasExportData ? "disabled" : ""}
                >
                  Export as Excel
                </button>
              </li>
              <li>
                <button
                  onClick={() => exportToCSV(exportData, "assessors_export.csv")}
                  className={!hasExportData ? "disabled" : ""}
                >
                  Export as CSV
                </button>
              </li>
            </ul>
          </div>

          {isFilterActive && (
            <button title="Clear Filters" type="button" className="btn btn-ghost btn-sm btn-square text-error" onClick={handleClearFilters}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Grid (Collapsible) */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-base-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Region */}
          <select
            className="select select-bordered select-xs w-full"
            value={selectedRegion || "all"}
            onChange={(e) => setSelectedRegion?.(e.target.value)}
          >
            <option value="all">Region: All</option>
            {Array.isArray(uniqueRegions) && uniqueRegions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Province */}
          <select
            className="select select-bordered select-xs w-full"
            value={selectedProvince || "all"}
            onChange={(e) => setSelectedProvince?.(e.target.value)}
            disabled={!Array.isArray(uniqueProvinces) || uniqueProvinces.length === 0}
          >
            <option value="all">Province: All</option>
            {Array.isArray(uniqueProvinces) && uniqueProvinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* LGU Type */}
          <select
            className="select select-bordered select-xs w-full"
            value={selectedLguType || "all"}
            onChange={(e) => setSelectedLguType?.(e.target.value)}
          >
            <option value="all">LGU Type: All</option>
            <option value="City">City</option>
            <option value="Municipality">Municipality</option>
            <option value="Province">Province</option>
          </select>

          {/* Sex */}
          <select
            className="select select-bordered select-xs w-full"
            value={selectedSex || "all"}
            onChange={(e) => setSelectedSex?.(e.target.value)}
          >
            <option value="all">Sex: All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* License Status */}
          <select
            className="select select-bordered select-xs w-full"
            value={selectedLicenseStatus || "all"}
            onChange={(e) => setSelectedLicenseStatus?.(e.target.value)}
          >
            <option value="all">License: All</option>
            <option value="REA">REA (Licensed)</option>
            <option value="Non-REA">Non-REA</option>
          </select>

          {/* Position Category */}
          <select
            className="select select-bordered select-xs w-full"
            value={selectedPositionCategory || "all"}
            onChange={(e) => setSelectedPositionCategory?.(e.target.value)}
          >
            <option value="all">Level: All</option>
            <option value="Head Assessor">Head Assessor</option>
            <option value="Assistant Assessor">Assistant Assessor</option>
          </select>
        </div>
      )}
    </div>
  );
}
