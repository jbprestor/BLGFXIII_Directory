// src/pages/LGUPage.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import useApi from "../services/axios.js";
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import QuickStats from "../components/lgu/QuickStats.jsx";
import SearchFilters from "../components/lgu/SearchFilter.jsx";
import ProvinceDetail from "../components/lgu/ProvinceDetail.jsx";
import LGUDetail from "../components/lgu/LGUDetails.jsx";
import { useLGUImages } from "../assets/LguImages.js";

/**
 * LGUPage — provinces view first
 */
export default function LGUPage() {
  const RAW_LGU_IMAGES = useLGUImages();
  const { getAllLgusNoPagination, getLguById, getAllAssessors, getSMVProcesses, updateLgu, deleteLgu } = useApi();

  // state
  const [lgus, setLgus] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedLguId, setSelectedLguId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI states
  const [expandedProvinces, setExpandedProvinces] = useState(() => new Set());
  const expandedRefs = useRef(new Map());

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
            } catch (_err) {
              const status = _err?.response?.status;
              if (status >= 400 && status < 500 && status !== 429) return reject(_err);

              if (attempt < MAX_RETRIES && (status === 429 || status >= 500 || !status)) {
                attempt++;
                const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 200, MAX_BACKOFF_MS);
                if (attempt === 1) toast.loading(`Server busy - retrying ${context}...`, { id: "retry-toast" });
                await sleep(backoff);
                continue;
              }

              toast.dismiss("retry-toast");
              return reject(_err);
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
  // UI - improved card styles for consistent visuals and subtle motion - Mobile Optimized
  const cardBaseClasses =
    "bg-base-100 rounded-lg sm:rounded-xl border border-base-200 shadow-sm sm:hover:shadow-lg transform sm:hover:scale-105 transition-transform duration-200 cursor-pointer text-center p-3 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 min-h-[10rem] sm:min-h-[12rem] w-full";
  const cardAccentRing = "ring-2 ring-primary/20 focus:outline-none";

  // handlers
  const handleOpenProvince = (province) => {
    setSelectedProvince(province);
    setSelectedLguId(null);
    setCurrentPage(1);
  };

  const handleOpenLgu = (id) => setSelectedLguId(id);
  const handleCloseDetail = () => setSelectedLguId(null);

  const toggleExpanded = (prov) => {
    const isExpanded = expandedProvinces.has(prov);
    const el = expandedRefs.current.get(prov);

    // If no element reference, fallback to state toggle
    if (!el) {
      setExpandedProvinces((prev) => {
        const next = new Set(prev);
        if (next.has(prov)) next.delete(prov);
        else next.add(prov);
        return next;
      });
      return;
    }

    // Ensure transition properties
    el.style.overflow = 'hidden';
    el.style.transition = 'max-height 300ms ease, opacity 200ms ease';

    if (isExpanded) {
      // collapse: set explicit height then animate to 0
      el.style.maxHeight = `${el.scrollHeight}px`;
      el.style.opacity = '1';
      // force reflow
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.maxHeight = '0px';
        el.style.opacity = '0';
      });
      const onEnd = (e) => {
        if (e.propertyName === 'max-height') {
          el.style.removeProperty('max-height');
          el.style.removeProperty('opacity');
          el.style.removeProperty('transition');
          el.removeEventListener('transitionend', onEnd);
        }
      };
      el.addEventListener('transitionend', onEnd);

      setExpandedProvinces((prev) => {
        const next = new Set(prev);
        next.delete(prov);
        return next;
      });
    } else {
      // expand: animate from 0 to scrollHeight then clear maxHeight to allow natural growth
      el.style.maxHeight = '0px';
      el.style.opacity = '0';
      // force reflow
      void el.offsetHeight;
      const target = `${el.scrollHeight}px`;
      requestAnimationFrame(() => {
        el.style.maxHeight = target;
        el.style.opacity = '1';
      });
      const onEnd = (e) => {
        if (e.propertyName === 'max-height') {
          // remove max-height to allow dynamic content height
          el.style.removeProperty('max-height');
          el.style.removeProperty('opacity');
          el.style.removeProperty('transition');
          el.removeEventListener('transitionend', onEnd);
        }
      };
      el.addEventListener('transitionend', onEnd);

      setExpandedProvinces((prev) => {
        const next = new Set(prev);
        next.add(prov);
        return next;
      });
    }
  };

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

  // Get the current LGU name if we're viewing a specific LGU
  const currentLgu = useMemo(() => {
    if (!selectedLguId) return null;
    return lgus.find(lgu => lgu._id === selectedLguId || lgu.id === selectedLguId);
  }, [selectedLguId, lgus]);

  // render
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3 space-y-2 sm:space-y-3">
      {/* Breadcrumb Navigation - Mobile Optimized */}
      <nav className="text-xs sm:text-sm breadcrumbs">
        <ul className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <li>
            <button 
              onClick={() => {
                setSelectedLguId(null);
                setSelectedProvince(null);
                setCurrentPage(1);
              }}
              className={`link link-hover inline-flex items-center whitespace-nowrap ${!selectedProvince && !selectedLguId ? 'font-medium text-primary' : 'text-base-content/70'}`}
              aria-label="View all provinces and cities"
            >
              <Building className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Provinces & Cities</span>
              <span className="sm:hidden">Home</span>
            </button>
          </li>

          {selectedProvince && (
            <li>
              <button 
                onClick={() => {
                  setSelectedLguId(null);
                  setCurrentPage(1);
                }}
                className={`link link-hover inline-flex items-center whitespace-nowrap ${!selectedLguId ? 'font-medium text-primary' : 'text-base-content/70'}`}
                aria-label={`Back to ${selectedProvince}`}
              >
                <span className="truncate max-w-24 sm:max-w-none">{selectedProvince}</span>
              </button>
            </li>
          )}

          {currentLgu && (
            <li>
              <span className="font-medium text-primary truncate max-w-32 sm:max-w-none">{currentLgu.name}</span>
            </li>
          )}
        </ul>
      </nav>

      {/* header - Mobile Optimized */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              {currentLgu ? currentLgu.name :
               selectedProvince ? `${selectedProvince} LGUs` :
               'Provinces'}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 mt-1">
              {currentLgu ? `${currentLgu.classification} • ${currentLgu.incomeClass}` :
               selectedProvince ? `Browse ${provinces[selectedProvince]?.length?.toLocaleString() || 0} LGUs in ${selectedProvince}` :
               `Browse ${Object.keys(provinces).length.toLocaleString()} Provinces`}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="btn btn-outline btn-xs sm:btn-sm" onClick={() => fetchLgus(true)} disabled={isLoading} aria-label="Refresh LGU data">
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? "animate-spin" : ""}`} /> 
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button className="btn btn-primary btn-xs sm:btn-sm" onClick={exportData} disabled={filteredLgus.length === 0} aria-label="Export filtered LGU data">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
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
            <p className="font-medium text-base-content">Loading Provinces...</p>
            <p className="text-sm text-base-content/60">This may take a moment</p>
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

          {!selectedProvince && (
            <>
              {Object.keys(provinces).length === 0 ? (
                    <div className="text-center py-12">
                      <Building className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Provinces Found</h3>
                      <p className="text-base-content/60 mb-4">Try adjusting your search or filters</p>
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
                    aria-label="Clear all filters"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile compact list (visible on xs) */}
                  <div className="sm:hidden space-y-3">
                    {Object.keys(provinces)
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((prov) => {
                        const img = getCandidatesFor(prov)[0];
                        const isExpanded = expandedProvinces.has(prov);
                        return (
                          <div key={`mobile-${prov}`} className="bg-base-100 border border-base-200 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-base-200 rounded-full flex items-center justify-center overflow-hidden border border-base-300">
                                  <img
                                    src={img}
                                    alt={`${prov} image`}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-base-content truncate w-40">{prov}</div>
                                  <div className="text-xs text-base-content/60">{provinces[prov].length.toLocaleString()} LGUs</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => handleOpenProvince(prov)}
                                  aria-label={`Open ${prov} province`}
                                >
                                  Open
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => toggleExpanded(prov)}
                                  aria-expanded={isExpanded}
                                  aria-controls={`prov-exp-${prov}`}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div id={`prov-exp-${prov}`} ref={(el) => { if (el) expandedRefs.current.set(prov, el); else expandedRefs.current.delete(prov); }} className={`mt-3 overflow-hidden`} aria-hidden={!isExpanded}>
                              <div className={`${cardBaseClasses} ${cardAccentRing} text-left p-4`}>
                                <div className="flex items-start gap-4 w-full">
                                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={img} alt={`${prov} large`} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{prov}</h3>
                                    <p className="text-sm text-base-content/60 mt-1">{provinces[prov].length.toLocaleString()} LGUs</p>
                                    <div className="mt-3 flex gap-2">
                                      <button className="btn btn-sm" onClick={() => handleOpenProvince(prov)}>View LGUs</button>
                                      <button className="btn btn-outline btn-sm" onClick={() => toggleExpanded(prov)}>Collapse</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                  </div>

                  {/* Desktop / tablet grid (hidden on xs) - Mobile Optimized */}
                  <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                    {Object.keys(provinces)
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((prov) => {
                        const img = getCandidatesFor(prov)[0];
                        return (
                          <div
                            key={prov}
                            role="button"
                            tabIndex={0}
                            className={`${cardBaseClasses} ${cardAccentRing}`}
                            onClick={() => handleOpenProvince(prov)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenProvince(prov); }}
                            aria-label={`Open ${prov} province details`}
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-base-200 rounded-full flex items-center justify-center overflow-hidden border border-base-300 mb-1 sm:mb-2">
                              <img
                                src={img}
                                alt={`${prov} image`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                              />
                            </div>
                            <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-base-content truncate w-full px-1">{prov}</h3>
                            <p className="text-xs text-base-content/60">{provinces[prov].length.toLocaleString()} LGUs</p>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              {/* pagination - Mobile Optimized */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                <button
                  className="btn btn-xs sm:btn-sm btn-ghost"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  Page {currentPage} / {Math.max(1, Math.ceil(Object.keys(provinces).length / itemsPerPage))}
                </span>
                <button
                  className="btn btn-xs sm:btn-sm btn-ghost"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, Math.ceil(Object.keys(provinces).length / itemsPerPage)))
                  }
                  disabled={currentPage === Math.ceil(Object.keys(provinces).length / itemsPerPage)}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
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
              updateLgu={updateLgu}
              deleteLgu={deleteLgu}
            />
          )}
          <QuickStats filteredLgus={filteredLgus} />

        </>
      )}
    </div>
  );
}
