// src/pages/LGUPage.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import useApi from "../services/axios.js";
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";
import QuickStats from "../components/lgu/quickstats.jsx";
import SearchFilters from "../components/lgu/SearchFilter.jsx";
import ProvinceDetail from "../components/lgu/ProvinceDetail.jsx";
import LGUDetail from "../components/lgu/LGUDetails.jsx";
import { useLGUImages } from "../assets/LguImages.js";

/**
 * LGUPage — provinces view first
 */
export default function LGUPage() {
  const RAW_LGU_IMAGES = useLGUImages();
  const { getAllLgusNoPagination, getLguById, getAllAssessors, getSMVProcesses } = useApi();

  // state
  const [lgus, setLgus] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedLguId, setSelectedLguId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLguType, setSelectedLguType] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState("all");
  const [selectedSMVStatus, setSelectedSMVStatus] = useState("all");
  const [conducting2025Revision, setConducting2025Revision] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // caches
  const listCache = useRef({ data: null, timestamp: 0, ttl: 5 * 60 * 1000 });
  const lguCache = useRef(new Map());
  const assessorsCache = useRef(new Map());
  const smvCache = useRef(new Map());

  // retry queue
  const chainRef = useRef(Promise.resolve());
  const lastRequestTimeRef = useRef(0);
  const MIN_INTERVAL_MS = 250;
  const BASE_BACKOFF_MS = 500;
  const MAX_RETRIES = 3;
  const MAX_BACKOFF_MS = 30000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const enqueueRequest = useCallback((fn, context = "request") => {
    return new Promise((resolve, reject) => {
      chainRef.current = chainRef.current
        .then(async () => {
          let attempt = 0;
          while (attempt <= MAX_RETRIES) {
            const now = Date.now();
            const elapsed = now - lastRequestTimeRef.current;
            if (elapsed < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - elapsed);

            try {
              const res = await fn();
              lastRequestTimeRef.current = Date.now();
              toast.dismiss("retry-toast");
              return resolve(res);
            } catch (err) {
              const status = err?.response?.status;
              if (status >= 400 && status < 500 && status !== 429) return reject(err);

              if (attempt < MAX_RETRIES && (status === 429 || status >= 500 || !status)) {
                attempt++;
                const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 200, MAX_BACKOFF_MS);
                if (attempt === 1) toast.loading(`Server busy - retrying ${context}...`, { id: "retry-toast" });
                await sleep(backoff);
                continue;
              }

              toast.dismiss("retry-toast");
              return reject(err);
            }
          }
        })
        .catch(reject);
    });
  }, []);

  // fetch LGUs
  const normalizeListResponse = useCallback((res) => {
    if (!res) return [];
    if (Array.isArray(res?.data?.lgus)) return res.data.lgus;
    if (Array.isArray(res?.data)) return res.data;
    if (res?.data?.lgus) return [res.data.lgus];
    return [];
  }, []);

  const fetchLgus = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheValid = listCache.current.data && (now - listCache.current.timestamp) < listCache.current.ttl;
    if (cacheValid && !forceRefresh) {
      setLgus(listCache.current.data);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await enqueueRequest(() => getAllLgusNoPagination(), "LGU list");
      const all = normalizeListResponse(res);
      const validLgus = all.filter((item) => item && (item._id || item.id));
      listCache.current = { data: validLgus, timestamp: Date.now(), ttl: listCache.current.ttl };
      setLgus(validLgus);
      if (forceRefresh) toast.success("Data refreshed");
    } catch (err) {
      console.error("Error fetching LGUs:", err);
      if (err?.response?.status === 429) setError("Too many requests. Please wait a moment and try again.");
      else setError("Failed to load LGUs. Check your connection.");
      setLgus([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAllLgusNoPagination, enqueueRequest, normalizeListResponse]);

  useEffect(() => { fetchLgus(); }, [fetchLgus]);

  // filter + group
  const filteredLgus = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return lgus.filter((g) => {
      const matchesSearch = !s ||
        g.name?.toLowerCase().includes(s) ||
        g.province?.toLowerCase().includes(s) ||
        g.region?.toLowerCase().includes(s);
      const matchesType = selectedLguType === "all" || g.classification === selectedLguType;
      const matchesRegion = selectedRegion === "all" || g.region === selectedRegion;
      const matchesProvince = selectedProvinceFilter === "all" || g.province === selectedProvinceFilter;
      const matchesSMVStatus = selectedSMVStatus === "all" || g.currentSMVStatus === selectedSMVStatus;
      const matches2025Revision = conducting2025Revision === "all" || 
        (conducting2025Revision === "true" && g.existingSMV?.conductingRevision2025 === true) ||
        (conducting2025Revision === "false" && g.existingSMV?.conductingRevision2025 !== true);
      return matchesSearch && matchesType && matchesRegion && matchesProvince && matchesSMVStatus && matches2025Revision;
    });
  }, [lgus, searchTerm, selectedLguType, selectedRegion, selectedProvinceFilter, selectedSMVStatus, conducting2025Revision]);

  const provinces = useMemo(() => {
    const grouped = {};
    filteredLgus.forEach((g) => {
      const prov = g?.province ?? "Unknown Province";
      if (!grouped[prov]) grouped[prov] = [];
      grouped[prov].push(g);
    });
    return grouped;
  }, [filteredLgus]);

  // images
  const PLACEHOLDER_IMAGE = "https://via.placeholder.com/200?text=Province";

  const normalizeKey = (s) => {
    if (typeof s !== 'string') return '';
    return (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  };

  const imageIndex = useMemo(() => {
    const map = new Map();
    if (RAW_LGU_IMAGES && typeof RAW_LGU_IMAGES === "object") {
      Object.entries(RAW_LGU_IMAGES).forEach(([k, v]) => {
        const nk = normalizeKey(k);
        if (nk) map.set(nk, v);
      });
    }
    return map;
  }, [RAW_LGU_IMAGES]);

  const getCandidatesFor = (input) => {
    const candidates = [];
    if (!input) return [PLACEHOLDER_IMAGE];
    
    // Handle both string (province name) and object (LGU) inputs
    let searchKey;
    if (typeof input === 'string') {
      searchKey = input;
    } else if (input && typeof input === 'object') {
      // For LGU objects, try name first, then province
      searchKey = input.name || input.province;
    }
    
    if (!searchKey) return [PLACEHOLDER_IMAGE];
    
    const nk = normalizeKey(searchKey);
    if (nk && imageIndex.has(nk)) candidates.push(imageIndex.get(nk));
    candidates.push(PLACEHOLDER_IMAGE);
    return [...new Set(candidates)];
  };

  // UI
  const cardBaseClasses =
    "bg-white rounded-xl border shadow hover:shadow-lg transition cursor-pointer text-center p-6";
  const cardAccentRing = "ring-2 ring-primary/20";

  // handlers
  const handleOpenProvince = (province) => {
    setSelectedProvince(province);
    setSelectedLguId(null);
    setCurrentPage(1);
  };

  const handleOpenLgu = (id) => setSelectedLguId(id);
  const handleCloseDetail = () => setSelectedLguId(null);

  // export
  const exportData = () => {
    const data = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalLgus: filteredLgus.length,
        filters: { searchTerm, region: selectedRegion, province: selectedProvinceFilter, type: selectedLguType },
      },
      lgus: filteredLgus,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lgu-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLgus.length} LGUs`);
  };

  // render
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Provinces</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and search through {Object.keys(provinces).length.toLocaleString()} Provinces
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => fetchLgus(true)} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportData} disabled={filteredLgus.length === 0}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* filters */}
      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedLguType={selectedLguType}
        setSelectedLguType={setSelectedLguType}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedProvinceFilter={selectedProvinceFilter}
        setSelectedProvinceFilter={setSelectedProvinceFilter}
        selectedSMVStatus={selectedSMVStatus}
        setSelectedSMVStatus={setSelectedSMVStatus}
        conducting2025Revision={conducting2025Revision}
        setConducting2025Revision={setConducting2025Revision}
        uniqueRegions={[...new Set(lgus.map((g) => g.region).filter(Boolean))]}
        uniqueProvinces={[...new Set(lgus.map((g) => g.province).filter(Boolean))]}
        lguTypes={[...new Set(lgus.map((g) => g.classification).filter(Boolean))]}
        smvStatuses={[...new Set(lgus.map((g) => g.currentSMVStatus || "No Revision").filter(Boolean))]}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        setCurrentPage={setCurrentPage}
      />

      {/* loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-center">
            <p className="font-medium">Loading Provinces...</p>
            <p className="text-sm text-gray-500">This may take a moment</p>
          </div>
        </div>
      )}

      {/* error */}
      {error && !isLoading && (
        <div className="alert alert-error shadow-lg">
          <div className="flex-1"><span>{error}</span></div>
          <div className="flex-none">
            <button className="btn btn-sm btn-outline" onClick={() => fetchLgus(true)}>Try Again</button>
          </div>
        </div>
      )}

      {/* main */}
      {!isLoading && !error && (
        <>
          <QuickStats filteredLgus={filteredLgus} />

          {!selectedProvince && (
            <>
              {Object.keys(provinces).length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Provinces Found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedLguType("all");
                      setSelectedRegion("all");
                      setSelectedProvinceFilter("all");
                      setSelectedSMVStatus("all");
                      setConducting2025Revision("all");
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Object.keys(provinces)
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((prov) => {
                      const img = getCandidatesFor(prov)[0];
                      return (
                        <div
                          key={prov}
                          className={`${cardBaseClasses} ${cardAccentRing}`}
                          onClick={() => handleOpenProvince(prov)}
                        >
                          <img
                            src={img}
                            alt={prov}
                            className="w-24 h-24 mx-auto rounded-full object-cover mb-4 border"
                          />
                          <h3 className="text-lg font-semibold">{prov}</h3>
                          <p className="text-sm text-gray-500">{provinces[prov].length} LGUs</p>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* pagination */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft />
                </button>
                <span className="text-sm">
                  Page {currentPage} / {Math.max(1, Math.ceil(Object.keys(provinces).length / itemsPerPage))}
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, Math.ceil(Object.keys(provinces).length / itemsPerPage)))
                  }
                  disabled={currentPage === Math.ceil(Object.keys(provinces).length / itemsPerPage)}
                >
                  <ChevronRight />
                </button>
              </div>
            </>
          )}

          {/* province detail */}
          {selectedProvince && !selectedLguId && (
            <ProvinceDetail
              selectedProvince={selectedProvince}
              provinces={provinces}
              getCandidatesFor={getCandidatesFor}
              PLACEHOLDER_IMAGE={PLACEHOLDER_IMAGE}
              cardBaseClasses={cardBaseClasses}
              cardAccentRing={cardAccentRing}
              getTypeBorder={() => ""}
              onOpenLgu={handleOpenLgu}
              onBack={() => {
                setSelectedProvince(null);
                setCurrentPage(1);
              }}
            />
          )}

          {/* lgu detail */}
          {selectedLguId && (
            <LGUDetail
              id={selectedLguId}
              onClose={handleCloseDetail}
              enqueueRequest={enqueueRequest}
              getLguById={getLguById}
              getAllAssessors={getAllAssessors}
              getSMVProcesses={getSMVProcesses}
              getCandidatesFor={getCandidatesFor}
              lguCache={lguCache}
              assessorsCache={assessorsCache}
              smvCache={smvCache}
            />
          )}
        </>
      )}
    </div>
  );
}
