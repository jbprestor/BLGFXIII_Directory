// src/components/lgu/LGUDetail.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  FileText,
  Users,
  BarChart3,
  MapPin,
  Building,
  Phone,
  User,
  Mail,
  Calendar,
  Globe,
  Award,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

// small helpers (pretty population)
const prettyPopulation = (n) => {
  if (!n && n !== 0) return "N/A";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

// SMV Status badge styling
const getStatusBadgeClass = (status) => {
  switch (status) {
    case "No Revision": return "badge-ghost";
    case "Preparatory": return "badge-info";
    case "Data Collection": return "badge-warning";
    case "Data Analysis": return "badge-warning";
    case "Preparation": return "badge-primary";
    case "Testing": return "badge-secondary";
    case "Finalization": return "badge-accent";
    case "Completed": return "badge-success";
    case "Implemented": return "badge-success";
    default: return "badge-ghost";
  }
};

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=LGU";

export default function LGUDetail({
  id,
  onClose,
  enqueueRequest,
  getLguById,
  getAllAssessors,
  getSMVProcesses,
  getCandidatesFor,
  lguCache,
  assessorsCache,
  smvCache
}) {
  const [lgu, setLgu] = useState(null);
  const [assessors, setAssessors] = useState([]);
  const [smvProcesses, setSmvProcesses] = useState([]);
  const [loading, setLoading] = useState({ lgu: false, assessors: false, smv: false });
  const [errors, setErrors] = useState({ lgu: null, assessors: null, smv: null });
  const [activeTab, setActiveTab] = useState("overview");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // loader with caching (keeps your pattern)
  const load = useCallback(async (type) => {
    if (!id) return;
    const cache = type === "lgu" ? lguCache.current
                  : type === "assessors" ? assessorsCache.current
                  : smvCache.current;

    if (cache.has(id)) {
      const data = cache.get(id);
      if (type === "lgu") setLgu(data);
      if (type === "assessors") setAssessors(data);
      if (type === "smv") setSmvProcesses(data);
      return;
    }

    setLoading(s => ({ ...s, [type]: true }));
    setErrors(s => ({ ...s, [type]: null }));

    try {
      let res;
      if (type === "lgu") res = await enqueueRequest(() => getLguById(id), `LGU ${id}`);
      if (type === "assessors") res = await enqueueRequest(() => getAllAssessors({ lgu_id: id }), `Assessors ${id}`);
      if (type === "smv") res = await enqueueRequest(() => getSMVProcesses({ lgu_id: id }), `SMV ${id}`);

      const data = res?.data ?? (type === "lgu" ? null : []);
      cache.set(id, data);
      if (!mountedRef.current) return;

      if (type === "lgu") setLgu(data);
      if (type === "assessors") setAssessors(data);
      if (type === "smv") setSmvProcesses(data);
    } catch (err) {
      if (mountedRef.current) {
        setErrors(s => ({ ...s, [type]: err.message || String(err) }));
        toast.error(`Failed to load ${type}`);
      }
    } finally {
      if (mountedRef.current) setLoading(s => ({ ...s, [type]: false }));
    }
  }, [id, enqueueRequest, getLguById, getAllAssessors, getSMVProcesses, lguCache, assessorsCache, smvCache]);

  useEffect(() => { if (id) load("lgu"); }, [id, load]);
  useEffect(() => { if (id && activeTab === "assessors") load("assessors"); }, [id, activeTab, load]);
  useEffect(() => { if (id && activeTab === "smv") load("smv"); }, [id, activeTab, load]);

  // image candidates
  const candidates = useMemo(() => getCandidatesFor(lgu) || [PLACEHOLDER_IMAGE], [getCandidatesFor, lgu]);
  const [imgSrc, setImgSrc] = useState(candidates[0] || PLACEHOLDER_IMAGE);
  useEffect(() => { setImgSrc(candidates[0] || PLACEHOLDER_IMAGE); }, [candidates]);

  const onImgError = useCallback((e) => {
    const cur = e.currentTarget;
    const idx = candidates.indexOf(cur.src);
    const next = candidates[idx + 1] || PLACEHOLDER_IMAGE;
    cur.onerror = null;
    cur.src = next;
    setImgSrc(next);
  }, [candidates]);

  // modal focus trap + Escape
  const dialogRef = useRef(null);
  const prevFocusedRef = useRef(null);

  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;
    prevFocusedRef.current = document.activeElement;

    const focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
      'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ].join(",");
    const nodes = Array.from(root.querySelectorAll(focusableSelectors)).filter(n => !n.hasAttribute("disabled") && n.offsetParent !== null);
    const first = nodes[0] || root;
    try { first.focus(); } catch (e) {}

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const currentIndex = nodes.indexOf(document.activeElement);
        let nextIndex;
        if (e.shiftKey) nextIndex = (currentIndex - 1 + nodes.length) % nodes.length;
        else nextIndex = (currentIndex + 1) % nodes.length;
        e.preventDefault();
        nodes[nextIndex].focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      try { prevFocusedRef.current?.focus?.(); } catch {}
    };
  }, [onClose]);

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* dialog */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className="relative w-full max-w-4xl mx-4 md:mx-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border">
              <img src={imgSrc} alt={lgu?.name || "LGU"} onError={onImgError} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{lgu?.name || "Loading..."}</h3>
              <p className="text-sm text-gray-500">{lgu?.province} • {lgu?.region}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(lgu || {})); toast.success('Copied'); }}>Copy</button>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Close detail"><X /></button>
          </div>
        </div>

        {/* tab nav */}
        <div className="p-3 border-b">
          <nav className="flex gap-2">
            <button className={`btn btn-sm ${activeTab === "overview" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("overview")}><FileText className="w-4 h-4 mr-2" /> Overview</button>
            <button className={`btn btn-sm ${activeTab === "assessors" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("assessors")}><Users className="w-4 h-4 mr-2" /> Assessors</button>
            <button className={`btn btn-sm ${activeTab === "smv" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("smv")}><BarChart3 className="w-4 h-4 mr-2" /> SMV</button>
          </nav>
        </div>

        {/* content */}
        <div className="p-6 max-h-[70vh] overflow-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-3 bg-base-200">
                  <div className="text-sm text-gray-500">Population</div>
                  <div className="text-lg font-bold">{prettyPopulation(lgu?.population)}</div>
                </div>
                <div className="card p-3 bg-base-200">
                  <div className="text-sm text-gray-500">Income Class</div>
                  <div className="text-lg font-bold">{lgu?.incomeClass || "N/A"}</div>
                </div>
                <div className="card p-3 bg-base-200">
                  <div className="text-sm text-gray-500">Land Area</div>
                  <div className="text-lg font-bold">{lgu?.landArea ? `${lgu.landArea} km²` : "N/A"}</div>
                </div>
                <div className="card p-3 bg-base-200">
                  <div className="text-sm text-gray-500">Classification</div>
                  <div className="text-lg font-bold">{lgu?.classification || "N/A"}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-3"><Building className="inline-block mr-2" /> Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Region</span><span>{lgu?.region ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Province</span><span>{lgu?.province ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Classification</span><span>{lgu?.classification ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Income Class</span><span>{lgu?.incomeClass ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Status</span><span className={lgu?.isActive ? "text-green-600" : "text-red-600"}>{lgu?.isActive ? "Active" : "Inactive"}</span></div>
                  </div>
                </div>

                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-3"><User className="inline-block mr-2" /> Local Chief Executive</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Full Name</span>
                      <span>
                        {lgu?.lce ? 
                          `${lgu.lce.firstName} ${lgu.lce.middleName || ''} ${lgu.lce.lastName}`.trim() 
                          : "—"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between"><span>Office Address</span><span>{lgu?.lce?.officeAddress || "—"}</span></div>
                    {lgu?.lce?.officialEmail && (
                      <div className="flex justify-between">
                        <span>Official Email</span>
                        <a className="text-primary" href={`mailto:${lgu.lce.officialEmail}`}>
                          {lgu.lce.officialEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SMV Status Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-3">
                    <TrendingUp className="inline-block mr-2" /> SMV Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Status</span>
                      <span className={`badge ${getStatusBadgeClass(lgu?.currentSMVStatus)}`}>
                        {lgu?.currentSMVStatus || "No Revision"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conducting 2025 Revision</span>
                      <span className={`badge ${lgu?.existingSMV?.conductingRevision2025 ? 'badge-success' : 'badge-ghost'}`}>
                        {lgu?.existingSMV?.conductingRevision2025 ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-3">
                    <FileText className="inline-block mr-2" /> SMV History
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ordinance No.</span>
                      <span>{lgu?.existingSMV?.ordinanceNo || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Year</span>
                      <span>{lgu?.existingSMV?.baseYear || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval Year</span>
                      <span>{lgu?.existingSMV?.approvalYear || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Implementation Year</span>
                      <span>{lgu?.existingSMV?.implementationYear || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {lgu?.contactInfo && (
                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-3">
                    <Phone className="inline-block mr-2" /> Contact Information
                  </h4>
                  <div className="space-y-2">
                    {lgu.contactInfo.phoneNumber && (
                      <div className="flex justify-between">
                        <span>Phone</span>
                        <span>{lgu.contactInfo.phoneNumber}</span>
                      </div>
                    )}
                    {lgu.contactInfo.faxNumber && (
                      <div className="flex justify-between">
                        <span>Fax</span>
                        <span>{lgu.contactInfo.faxNumber}</span>
                      </div>
                    )}
                    {lgu.contactInfo.website && (
                      <div className="flex justify-between">
                        <span>Website</span>
                        <a className="text-primary" href={lgu.contactInfo.website} target="_blank" rel="noopener noreferrer">
                          {lgu.contactInfo.website}
                        </a>
                      </div>
                    )}
                    {lgu.zipCode && (
                      <div className="flex justify-between">
                        <span>Zip Code</span>
                        <span>{lgu.zipCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              {lgu?.performanceMetrics && (
                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-3">
                    <Award className="inline-block mr-2" /> Performance Metrics
                  </h4>
                  <div className="space-y-2">
                    {lgu.performanceMetrics.sealOfGoodLocalGovernance?.hasAward && (
                      <div className="flex justify-between">
                        <span>Seal of Good Local Governance</span>
                        <span className="badge badge-success">
                          {lgu.performanceMetrics.sealOfGoodLocalGovernance.level} ({lgu.performanceMetrics.sealOfGoodLocalGovernance.year})
                        </span>
                      </div>
                    )}
                    {lgu.performanceMetrics.businessPermitProcessingTime && (
                      <div className="flex justify-between">
                        <span>Business Permit Processing</span>
                        <span>{lgu.performanceMetrics.businessPermitProcessingTime} days</span>
                      </div>
                    )}
                    {lgu.performanceMetrics.taxCollectionEfficiency && (
                      <div className="flex justify-between">
                        <span>Tax Collection Efficiency</span>
                        <span>{lgu.performanceMetrics.taxCollectionEfficiency}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              {(lgu?.createdAt || lgu?.updatedAt) && (
                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-3">
                    <Calendar className="inline-block mr-2" /> Record Information
                  </h4>
                  <div className="space-y-2">
                    {lgu?.createdAt && (
                      <div className="flex justify-between">
                        <span>Created</span>
                        <span>{new Date(lgu.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {lgu?.updatedAt && (
                      <div className="flex justify-between">
                        <span>Last Updated</span>
                        <span>{new Date(lgu.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {lgu?.establishmentDate && (
                      <div className="flex justify-between">
                        <span>Established</span>
                        <span>{new Date(lgu.establishmentDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lgu?.additionalInfo && (
                <div className="card p-4 bg-base-100">
                  <h4 className="font-semibold mb-2"><ExternalLink className="inline-block mr-2" /> Description</h4>
                  <p className="text-gray-600">{lgu.additionalInfo}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "assessors" && (
            <div className="space-y-3">
              {loading.assessors ? <div className="py-6 text-center"><span className="loading loading-spinner loading-lg"></span></div> :
                errors.assessors ? <div className="alert alert-error">{errors.assessors}</div> :
                assessors.length === 0 ? <div className="py-6 text-center text-gray-500">No assessors found</div> :
                assessors.map(a => (
                  <div key={a._id || a.id} className="card p-3 bg-base-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{a.firstName} {a.lastName}</div>
                        <div className="text-sm text-gray-500">{a.position}</div>
                      </div>
                      <div className="text-sm text-gray-500">{a.prcNo}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === "smv" && (
            <div className="space-y-3">
              {loading.smv ? <div className="py-6 text-center"><span className="loading loading-spinner loading-lg"></span></div> :
                errors.smv ? <div className="alert alert-error">{errors.smv}</div> :
                smvProcesses.length === 0 ? <div className="py-6 text-center text-gray-500">No SMV processes found</div> :
                smvProcesses.map(p => (
                  <div key={p._id || p.id} className="card p-3 bg-base-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{p.title || p.name}</div>
                        <div className="text-sm text-gray-500">Reference: {p.referenceYear || "—"}</div>
                      </div>
                      <div className="text-sm">{p.status}</div>
                    </div>
                    {p.description && <div className="mt-2 text-sm text-gray-600">{p.description}</div>}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* footer */}
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(lgu || {})); toast.success('Copied'); }}>Copy JSON</button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
