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
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title mb-2 sm:mb-4 text-lg sm:text-xl">Search & Filter</h2>

        {/* Search bar */}
        <div className="form-control mb-4">
          <label className="label py-1">
            <span className="label-text text-xs sm:text-sm">Search Personnel</span>
          </label>
          <input
            type="text"
            placeholder="Search by name, LGU, position, or email..."
            className="input input-bordered input-sm sm:input-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Toggle advanced */}
        <button
          type="button"
          className="btn btn-outline btn-xs sm:btn-sm mb-4"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Hide Advanced Search" : "Show Advanced Search"}
        </button>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4">
            {/* Region */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm">Region</span>
              </label>
              <select
                className="select select-bordered select-sm sm:select-md w-full"
                value={selectedRegion || "all"}
                onChange={(e) => setSelectedRegion?.(e.target.value)}
              >
                <option value="all">All Regions</option>
                {Array.isArray(uniqueRegions) && uniqueRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Province */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm">Province</span>
              </label>
              <select
                className="select select-bordered select-sm sm:select-md w-full"
                value={selectedProvince || "all"}
                onChange={(e) => setSelectedProvince?.(e.target.value)}
                disabled={!Array.isArray(uniqueProvinces) || uniqueProvinces.length === 0}
              >
                <option value="all">All Provinces</option>
                {Array.isArray(uniqueProvinces) && uniqueProvinces.length > 0 ? (
                  uniqueProvinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))
                ) : (
                  <option value="all" disabled>No provinces available</option>
                )}
              </select>
            </div>

            {/* LGU Type */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm">LGU Type</span>
              </label>
              <select
                className="select select-bordered select-sm sm:select-md w-full"
                value={selectedLguType || "all"}
                onChange={(e) => setSelectedLguType?.(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="City">City</option>
                <option value="Municipality">Municipality</option>
                <option value="Province">Province</option>
              </select>
            </div>

            {/* Sex */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm">Sex</span>
              </label>
              <select
                className="select select-bordered select-sm sm:select-md w-full"
                value={selectedSex || "all"}
                onChange={(e) => setSelectedSex?.(e.target.value)}
              >
                <option value="all">All Sexes</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* License Status */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm">License Status</span>
              </label>
              <select
                className="select select-bordered select-sm sm:select-md w-full"
                value={selectedLicenseStatus || "all"}
                onChange={(e) => setSelectedLicenseStatus?.(e.target.value)}
              >
                <option value="all">All</option>
                <option value="REA">REA (Licensed)</option>
                <option value="Non-REA">Non-REA</option>
              </select>
            </div>
            {/* Position Category */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm">Position Category</span>
              </label>
              <select
                className="select select-bordered select-sm sm:select-md w-full"
                value={selectedPositionCategory || "all"}
                onChange={(e) => setSelectedPositionCategory?.(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="Head Assessor">Head Assessor</option>
                <option value="Assistant Assessor">Assistant Assessor</option>
              </select>
            </div>
          </div>
        )}



        {/* Results & actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="badge badge-neutral badge-sm sm:badge-lg">
            {resultCount} result{resultCount !== 1 ? "s" : ""} found
          </div>

          <div className="flex gap-2 items-center">
            {isFilterActive && (
              <button type="button" className="btn btn-outline btn-xs sm:btn-sm" onClick={handleClearFilters}>
                Clear Filters
              </button>
            )}

            <div className="dropdown dropdown-end">
              <label tabIndex={0} className={`btn btn-outline btn-xs sm:btn-sm ${!hasExportData ? "opacity-50 pointer-events-none" : ""}`}>
                <span>📊</span> Export
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44">
                <li>
                  <button
                    onClick={() => exportXlsxFromJson(exportData, "assessors_export.xlsx")}
                    className={`w-full text-left ${!hasExportData ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    Export as Excel (.xlsx)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => exportToCSV(exportData, "assessors_export.csv")}
                    className={`w-full text-left ${!hasExportData ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    Export as CSV
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
