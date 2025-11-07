import { Search, Filter, X } from "../common/Icon";
import toast from "react-hot-toast";

export default function SearchFilters({
  searchTerm, setSearchTerm,
  selectedLguType, setSelectedLguType,
  selectedRegion, setSelectedRegion,
  selectedProvinceFilter, setSelectedProvinceFilter,
  selectedSMVStatus, setSelectedSMVStatus,
  conducting2025Revision, setConducting2025Revision,
  uniqueRegions, uniqueProvinces, lguTypes, smvStatuses,
  showFilters, setShowFilters, setCurrentPage
}) {
  const activeFiltersCount = [
    !!searchTerm,
    selectedLguType !== "all",
    selectedRegion !== "all",
    selectedProvinceFilter !== "all",
    selectedSMVStatus !== "all",
    conducting2025Revision !== "all"
  ].filter(Boolean).length;

  const clear = () => {
    setSearchTerm("");
    setSelectedLguType("all");
    setSelectedRegion("all");
    setSelectedProvinceFilter("all");
    setSelectedSMVStatus("all");
    setConducting2025Revision("all");
    setCurrentPage(1);
    toast.success("Filters cleared");
  };

  return (
    <div className="bg-gradient-to-br from-white/80 to-base-100/60 border rounded-2xl shadow-sm mb-6">
      <div className="card-body p-4">
        {/* Search + Filters toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-base-content/40" />
            <input
              type="text"
              aria-label="Search LGUs"
              placeholder="Search LGUs by name, province, or region..."
              className="input input-bordered w-full pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-base-content/40 hover:text-base-content/60"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <button
              className={`btn btn-outline btn-sm ${showFilters ? "btn-active" : ""}`}
              onClick={() => setShowFilters((s) => !s)}
            >
              <Filter className="h-4 w-4" /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            {activeFiltersCount > 0 && <button className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>}
          </div>
        </div>

        {/* Dropdown filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
            <div>
              <label className="label"><span className="label-text">Region</span></label>
              <select className="select select-bordered w-full" value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Regions</option>
                {uniqueRegions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="label"><span className="label-text">Province</span></label>
              <select className="select select-bordered w-full" value={selectedProvinceFilter} onChange={(e) => { setSelectedProvinceFilter(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Provinces</option>
                {uniqueProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="label"><span className="label-text">LGU Type</span></label>
              <select className="select select-bordered w-full" value={selectedLguType} onChange={(e) => { setSelectedLguType(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Types</option>
                {lguTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label"><span className="label-text">SMV Status</span></label>
              <select className="select select-bordered w-full" value={selectedSMVStatus} onChange={(e) => { setSelectedSMVStatus(e.target.value); setCurrentPage(1); }}>
                <option value="all">All SMV Status</option>
                {smvStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div>
              <label className="label"><span className="label-text">2025 Revision</span></label>
              <select className="select select-bordered w-full" value={conducting2025Revision} onChange={(e) => { setConducting2025Revision(e.target.value); setCurrentPage(1); }}>
                <option value="all">All LGUs</option>
                <option value="true">Conducting 2025 Revision</option>
                <option value="false">Not Conducting 2025 Revision</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
