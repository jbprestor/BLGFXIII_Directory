import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, FileText, Users, BarChart3, Edit2, Trash2, Save, XCircle, Building } from "../common/Icon";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const PLACEHOLDER_IMAGE = "https://placehold.co/200x200/3b82f6/white?text=LGU";
const prettyPopulation = (n) => (n === 0 ? "0" : (n ? n.toLocaleString() : "—"));
const prettyNumber = (n) => (n === 0 ? "0" : (n || n === 0 ? n.toLocaleString() : "—"));
const prettyDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
};

function isAbsoluteUrl(s) {
  return typeof s === 'string' && /^(https?:)?\/\//i.test(s) || /^data:/i.test(s);
}

function toSafeCandidate(c) {
  if (!c) return PLACEHOLDER_IMAGE;
  if (isAbsoluteUrl(c)) return c;
  // If candidate looks like a short label (e.g. "Province:1"), encode as placeholder text
  try {
    return `https://placehold.co/400x400/3b82f6/white?text=${encodeURIComponent(String(c))}`;
  } catch {
    return PLACEHOLDER_IMAGE;
  }
}

export default function LGUDetails({
  id,
  onClose,
  enqueueRequest,
  getLguById,
  getAllAssessors,
  getSMVProcesses,
  getCandidatesFor,
  lguCache,
  assessorsCache,
  smvCache,
  updateLgu, // Added for CRUD
  deleteLgu  // Added for CRUD
}) {
  const { user } = useAuth();
  const dialogRef = useRef(null);
  const [lgu, setLgu] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [imgSrc, setImgSrc] = useState(PLACEHOLDER_IMAGE);
  const [candidates, setCandidates] = useState([PLACEHOLDER_IMAGE]);
  const [activeTab, setActiveTab] = useState("overview");
  const [assessors, setAssessors] = useState([]);
  const [smvProcesses, setSmvProcesses] = useState([]);
  const [loading, setLoading] = useState({ lgu: false, assessors: false, smv: false });

  // Check if user has admin/editor permissions
  // Check if user has admin/editor permissions
  const canEdit = user && ['admin', 'editor'].includes(user.role?.toLowerCase());
  const canDelete = user && user.role?.toLowerCase() === 'admin';

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (editMode && lgu) {
      setEditData({ ...lgu });
    }
  }, [editMode, lgu]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setEditData(prev => {
      const newData = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newData[parent] = { ...newData[parent], [child]: value };
      } else {
        newData[field] = value;
      }
      return newData;
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!editData || !canEdit) return;

    setLoading(prev => ({ ...prev, lgu: true }));
    try {
      const res = await enqueueRequest(() =>
        updateLgu(editData._id || editData.id, editData),
        "Update LGU"
      );

      // Update local state and cache
      const updatedLgu = res?.data || res;
      setLgu(updatedLgu);
      lguCache?.current?.set(updatedLgu._id || updatedLgu.id, updatedLgu);

      setEditMode(false);
      toast.success('LGU updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update LGU');
    } finally {
      setLoading(prev => ({ ...prev, lgu: false }));
    }
  };

  // Delete LGU
  const handleDelete = async () => {
    if (!canDelete) return;

    if (!window.confirm('Are you sure you want to delete this LGU? This action cannot be undone.')) {
      return;
    }

    setLoading(prev => ({ ...prev, lgu: true }));
    try {
      await enqueueRequest(() =>
        deleteLgu(lgu._id || lgu.id),
        "Delete LGU"
      );

      toast.success('LGU deleted successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete LGU');
    } finally {
      setLoading(prev => ({ ...prev, lgu: false }));
    }
  };

  const loadLgu = useCallback(async () => {
    if (!id) return;
    setLoading((s) => ({ ...s, lgu: true }));
    try {
      const cached = lguCache?.current?.get(id);
      if (cached) {
        setLgu(cached);
      } else {
        const res = await enqueueRequest(() => getLguById(id), "LGU detail");
        // Normalize possible response shapes: { data: LGU } or { data: { lgu: LGU } } or LGU
        let data = res;
        if (res && res.data) data = res.data;
        if (data && data.lgu) data = data.lgu;
        // If API wrapped fields under .data.lgu or returned object directly, we handle both
        setLgu(data || null);
        try { lguCache?.current?.set(id, data); } catch { /* ignore cache errors */ }
      }
    } catch (e) { console.error(e); }
    finally { setLoading((s) => ({ ...s, lgu: false })); }
  }, [id, enqueueRequest, getLguById, lguCache]);

  useEffect(() => { loadLgu(); }, [loadLgu]);

  useEffect(() => {
    if (!lgu) return;
    const raw = getCandidatesFor ? getCandidatesFor(lgu) : [PLACEHOLDER_IMAGE];
    const c = Array.isArray(raw) ? raw.map(toSafeCandidate) : [toSafeCandidate(raw)];
    setCandidates(c);
    setImgSrc(c[0] || PLACEHOLDER_IMAGE);
  }, [lgu, getCandidatesFor]);

  const onImgError = (e) => {
    const cur = e.currentTarget;
    const idx = candidates.indexOf(cur.src);
    const next = candidates[idx + 1] || PLACEHOLDER_IMAGE;
    cur.onerror = null;
    cur.src = next;
    setImgSrc(next);
  };

  useEffect(() => {
    let mounted = true;
    const loadAssessors = async () => {
      if (!lgu) return;
      setLoading((s) => ({ ...s, assessors: true }));
      try {
        const cached = assessorsCache?.current?.get(lgu._id || lgu.id);
        if (cached) setAssessors(cached);
        else {
          // Get all assessors and filter for this specific LGU
          const res = await enqueueRequest(() => getAllAssessors(), "Assessors");
          const allAssessors = res?.data || res || [];
          // Only keep assessors where lgu._id matches current LGU's _id
          const lguAssessors = allAssessors.filter(a =>
            (a.lgu?._id === (lgu._id || lgu.id)) || // match by LGU reference
            (a.lguName === lgu.name) // fallback: match by LGU name
          );
          if (!mounted) return;
          setAssessors(lguAssessors);
          try { assessorsCache?.current?.set(lgu._id || lgu.id, lguAssessors); } catch { void 0; }
        }
      } catch { toast.error('Failed to load assessors'); }
      finally { setLoading((s) => ({ ...s, assessors: false })); }
    };

    const loadSmv = async () => {
      if (!lgu) return;
      setLoading((s) => ({ ...s, smv: true }));
      try {
        const cached = smvCache?.current?.get(lgu._id || lgu.id);
        if (cached) setSmvProcesses(cached);
        else {
          const res = await enqueueRequest(() => getSMVProcesses(lgu._id || lgu.id), "SMV");
          const data = res?.data || res || [];
          if (!mounted) return;
          setSmvProcesses(data);
          try { smvCache?.current?.set(lgu._id || lgu.id, data); } catch { void 0; }
        }
      } catch { toast.error('Failed to load SMV processes'); }
      finally { setLoading((s) => ({ ...s, smv: false })); }
    };

    if (activeTab === 'assessors' || activeTab === 'overview') loadAssessors();
    if (activeTab === 'smv') loadSmv();
    return () => { mounted = false; };
  }, [activeTab, lgu, enqueueRequest, getAllAssessors, getSMVProcesses, assessorsCache, smvCache]);

  // Helper to find Head Assessor and check vacancy
  const getHeadAssessorData = () => {
    if (!assessors || assessors.length === 0) return { head: null, isVacant: true };

    const exactTitles = ["Municipal Assessor", "City Assessor", "Provincial Assessor"];

    // Priority 1: Exact Match
    let head = assessors.find(a =>
      exactTitles.includes(a.plantillaPosition) || exactTitles.includes(a.officialDesignation)
    );

    // Priority 2: Loose Match (contains Assessor, excludes Assistant/Admin)
    if (!head) {
      head = assessors.find(a => {
        const title = (a.officialDesignation || a.plantillaPosition || "").toLowerCase();
        return title.includes("assessor") &&
          !title.includes("assistant") &&
          !title.includes("administrative");
      });
    }

    if (!head) return { head: null, isVacant: true };

    // Apply User's Vacancy Logic:
    // "check if status of appointment is not permanent annd the plantilla position or official designation is not Municipal Assessor or Provincial Assessor or City Assessor meaning that one is vacant positiion"
    const status = head.statusOfAppointment;
    const pPos = head.plantillaPosition;
    const oDes = head.officialDesignation;

    const isTitleMatch = exactTitles.includes(pPos) || exactTitles.includes(oDes);
    const isPermanent = status === "Permanent";

    // If (Not Permanent AND Not ExactTitle) -> VACANT
    const isVacant = (!isPermanent && !isTitleMatch);

    return { head, isVacant };
  };

  const { head: headAssessor, isVacant: headAssessorVacant } = getHeadAssessorData();

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      {/* Responsive modal: increased max-width for better edit layout */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className="relative w-full h-full sm:h-auto max-h-[90vh] max-w-5xl mx-auto bg-base-100 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between p-4 border-b border-base-200 gap-4 bg-base-100/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-base-200 border border-base-300 shadow-sm flex-shrink-0">
              <img src={imgSrc} alt={lgu?.name || 'LGU'} onError={onImgError} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold truncate">{editMode ? `Editing: ${lgu?.name}` : (lgu?.name || 'Loading...')}</h3>
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <span className="badge badge-sm badge-ghost">{lgu?.province}</span>
                <span className="hidden sm:inline">•</span>
                <span className="truncate">{lgu?.region}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!editMode && (
              <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(lgu || {})); toast.success('Copied'); }}>
                Copy Data
              </button>
            )}
            <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}><X /></button>
          </div>
        </div>

        {/* Tabs - Hidden in Edit Mode */}
        {!editMode && (
          <div className="px-4 pt-2 border-b border-base-200 bg-base-50/50">
            <nav className="flex gap-6 -mb-px">
              {['overview', 'assessors', 'smv'].map((tab) => (
                <button
                  key={tab}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content/80'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'assessors' && assessors.length > 0 && <span className="ml-2 badge badge-xs badge-ghost">{assessors.length}</span>}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">

          {editMode ? (
            /* EDIT MODE */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1: Core Identity */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                    <Building className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-lg">Core Information</h4>
                  </div>

                  <div className="form-control w-full">
                    <label className="label font-medium">LGU Name</label>
                    <input type="text" className="input input-bordered w-full focus:input-primary" value={editData?.name || ''} onChange={e => handleChange('name', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control w-full">
                      <label className="label font-medium">Classification</label>
                      <select className="select select-bordered w-full focus:select-primary" value={editData?.classification || ''} onChange={e => handleChange('classification', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="HUC">HUC</option>
                        <option value="CC">CC</option>
                        <option value="Municipality">Municipality</option>
                        <option value="Province">Province</option>
                        <option value="ICC">ICC</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label font-medium">Income Class</label>
                      <input type="text" className="input input-bordered w-full focus:input-primary" value={editData?.incomeClass || ''} onChange={e => handleChange('incomeClass', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label font-medium">Population</label>
                    <input type="number" className="input input-bordered w-full focus:input-primary" value={editData?.population || ''} onChange={e => handleChange('population', parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                {/* Section 2: Leadership */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                    <Users className="w-5 h-5 text-secondary" />
                    <h4 className="font-bold text-lg">Local Chief Executive</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control w-full">
                      <label className="label font-medium">First Name</label>
                      <input type="text" className="input input-bordered w-full focus:input-primary" value={editData?.lce?.firstName || ''} onChange={e => handleChange('lce.firstName', e.target.value)} />
                    </div>
                    <div className="form-control w-full">
                      <label className="label font-medium">Last Name</label>
                      <input type="text" className="input input-bordered w-full focus:input-primary" value={editData?.lce?.lastName || ''} onChange={e => handleChange('lce.lastName', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label font-medium">Official Email</label>
                    <input type="email" className="input input-bordered w-full focus:input-primary" value={editData?.lce?.officialEmail || ''} onChange={e => handleChange('lce.officialEmail', e.target.value)} />
                  </div>

                  <div className="form-control w-full">
                    <label className="label font-medium">Office Address</label>
                    <input type="text" className="input input-bordered w-full focus:input-primary" value={editData?.lce?.officeAddress || ''} onChange={e => handleChange('lce.officeAddress', e.target.value)} />
                  </div>
                </div>

                {/* Section 3: Status & Revision */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <h4 className="font-bold text-lg">Monitoring Status</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-control w-full">
                      <label className="label font-medium">Current SMV Status</label>
                      <select className="select select-bordered w-full focus:select-primary" value={editData?.currentSMVStatus || ''} onChange={e => handleChange('currentSMVStatus', e.target.value)}>
                        <option value="No Revision">No Revision</option>
                        <option value="Preparatory">Preparatory</option>
                        <option value="Data Collection">Data Collection</option>
                        <option value="Data Analysis">Data Analysis</option>
                        <option value="Preparation">Preparation</option>
                        <option value="Testing">Testing</option>
                        <option value="Finalization">Finalization</option>
                        <option value="Completed">Completed</option>
                        <option value="Implemented">Implemented</option>
                      </select>
                      <div className="label">
                        <span className="label-text-alt text-base-content/60">Select the current phase of SMV revision.</span>
                      </div>
                    </div>

                    <div className="bg-base-200/50 p-4 rounded-lg flex items-center justify-between border border-base-300">
                      <div>
                        <div className="font-medium">2025 General Revision</div>
                        <div className="text-sm text-base-content/60">Is the LGU participating?</div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-lg"
                        checked={editData?.existingSMV?.conductingRevision2025 === true}
                        onChange={e => handleChange('existingSMV.conductingRevision2025', e.target.checked)}
                      />
                    </div>
                  </div>
                </div>


              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="space-y-6 animate-in fade-in duration-300">
              {activeTab === 'overview' && (
                /* ... (rest of View Mode Overview logic preserved) ... */
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="stat bg-base-200/50 rounded-xl p-4 border border-base-200">
                      <div className="stat-title text-xs uppercase tracking-wider opacity-60">Population</div>
                      <div className="stat-value text-lg sm:text-2xl mt-1">{prettyPopulation(lgu?.population)}</div>
                    </div>
                    <div className="stat bg-base-200/50 rounded-xl p-4 border border-base-200">
                      <div className="stat-title text-xs uppercase tracking-wider opacity-60">Income Class</div>
                      <div className="stat-value text-lg sm:text-2xl mt-1">{lgu?.incomeClass || '—'}</div>
                    </div>
                    <div className="stat bg-base-200/50 rounded-xl p-4 border border-base-200">
                      <div className="stat-title text-xs uppercase tracking-wider opacity-60">Class</div>
                      <div className="stat-value text-lg sm:text-2xl mt-1">{lgu?.classification || '—'}</div>
                    </div>
                    <div className="stat bg-base-200/50 rounded-xl p-4 border border-base-200">
                      <div className="stat-title text-xs uppercase tracking-wider opacity-60">SMV Status</div>
                      <div className="stat-value text-lg sm:text-lg mt-1 whitespace-nowrap overflow-hidden text-ellipsis text-primary">{lgu?.currentSMVStatus || '—'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LCE Card */}
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                      <div className="card-body p-5">
                        <h3 className="card-title text-base flex items-center gap-2 text-secondary mb-2">
                          <Users className="w-5 h-5" /> Local Chief Executive
                        </h3>
                        {lgu?.lce ? (
                          <div className="space-y-3">
                            <div>
                              <div className="text-xl font-bold">{[lgu.lce.firstName, lgu.lce.middleName, lgu.lce.lastName].filter(Boolean).join(' ')}</div>
                              <div className="text-sm opacity-60">Mayor / LCE</div>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex items-start gap-2 opacity-70">
                                <span className="font-medium min-w-[60px]">Office:</span>
                                <span>{lgu.lce.officeAddress || 'No address on record'}</span>
                              </div>
                              <div className="flex items-start gap-2 opacity-70">
                                <span className="font-medium min-w-[60px]">Email:</span>
                                <span>{lgu.lce.officialEmail || '—'}</span>
                              </div>
                            </div>
                          </div>
                        ) : <div className="text-base-content/60 italic">No LCE information available.</div>}
                      </div>
                    </div>

                    {/* Local Assessor Card */}
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                      <div className="card-body p-5">
                        <div className="flex justify-between items-start">
                          <h3 className="card-title text-base flex items-center gap-2 text-primary mb-2">
                            <Users className="w-5 h-5" /> Local Assessor
                          </h3>
                          {headAssessorVacant && (
                            <div className="badge badge-error gap-1 font-bold text-white bg-red-500 border-none animate-pulse">
                              VACANT POSITION
                            </div>
                          )}
                        </div>

                        {headAssessor ? (
                          <div className="space-y-3">
                            <div>
                              <div className="text-xl font-bold">
                                {[headAssessor.firstName, headAssessor.middleName, headAssessor.lastName].filter(Boolean).join(' ')}
                              </div>
                              <div className="text-sm opacity-60 flex items-center gap-2">
                                {headAssessor.officialDesignation || headAssessor.plantillaPosition || 'Assessor'}
                                {!headAssessorVacant && <span className="badge badge-xs badge-success badge-outline">Filled</span>}
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex items-start gap-2 opacity-70">
                                <span className="font-medium min-w-[60px]">Status:</span>
                                <span>{headAssessor.statusOfAppointment || '—'}</span>
                              </div>
                              <div className="flex items-start gap-2 opacity-70">
                                <span className="font-medium min-w-[60px]">Email:</span>
                                <span>{headAssessor.officeEmail || '—'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-base-content/60 italic py-2">
                            No Assessor information available.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Geography Card */}
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                      <div className="card-body p-5">
                        <h3 className="card-title text-base flex items-center gap-2 text-accent mb-2">
                          <Building className="w-5 h-5" /> Geography & Contact
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="opacity-60 text-xs">Land Area</div>
                            <div className="font-medium">{prettyNumber(lgu?.landArea)} km²</div>
                          </div>
                          <div>
                            <div className="opacity-60 text-xs">ZIP Code</div>
                            <div className="font-medium">{lgu?.zipCode || '—'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="opacity-60 text-xs">Phone</div>
                            <div className="font-medium">{lgu?.contactInfo?.phoneNumber || '—'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="opacity-60 text-xs">Location</div>
                            <div className="font-medium truncate" title={lgu?.coordinates?.latitude ? `${lgu.coordinates.latitude}, ${lgu.coordinates.longitude}` : ''}>
                              {lgu?.coordinates?.latitude ? `${lgu.coordinates.latitude}, ${lgu.coordinates.longitude}` : 'No coordinates'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-5">
                      <h3 className="card-title text-base mb-4">Performance Metrics</h3>
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td className="text-base-content/60 font-medium">Seal of Good Local Governance</td>
                              <td className="font-bold text-right">
                                {lgu?.performanceMetrics?.sealOfGoodLocalGovernance?.hasAward
                                  ? <span className="badge badge-success badge-sm">Awarded</span>
                                  : <span className="opacity-50">Not Awarded</span>}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-base-content/60 font-medium">Business Permit Processing</td>
                              <td className="text-right">{prettyNumber(lgu?.performanceMetrics?.businessPermitProcessingTime)} days</td>
                            </tr>
                            <tr>
                              <td className="text-base-content/60 font-medium">Tax Collection Efficiency</td>
                              <td className="text-right font-mono">{lgu?.performanceMetrics?.taxCollectionEfficiency ? `${lgu.performanceMetrics.taxCollectionEfficiency}%` : '—'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'assessors' && (
                /* Assessors Tab Logic */
                <div className="space-y-4">
                  {loading.assessors ? (
                    <div className="py-12 text-center"><span className="loading loading-spinner loading-lg text-primary" /></div>
                  ) : assessors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-base-300 rounded-xl bg-base-100/50">
                      <Users className="w-12 h-12 text-base-content/20 mb-3" />
                      <div className="font-medium opacity-60">No Assessors Assigned</div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {assessors.map(a => (
                        <div key={a._id || a.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-200 border border-base-200">
                          <div className="card-body p-4">
                            <div className="flex gap-3">
                              <div className="avatar placeholder">
                                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10">
                                  <span className="text-sm">{a.firstName?.[0]}{a.lastName?.[0]}</span>
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold truncate">{[a.firstName, a.lastName].filter(Boolean).join(' ')}</div>
                                <div className="text-xs opacity-60 truncate">{a.officialDesignation || 'Assessor'}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs opacity-70 space-y-1">
                              <div>{a.officeEmail || 'No email'}</div>
                              <div>{a.mobileNumber || 'No phone'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'smv' && (
                <div className="space-y-4">
                  {loading.smv ? <div className="py-12 text-center"><span className="loading loading-spinner loading-lg text-primary" /></div> :
                    smvProcesses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-base-300 rounded-xl bg-base-100/50">
                        <BarChart3 className="w-12 h-12 text-base-content/20 mb-3" />
                        <div className="font-medium opacity-60">No SMV Processes Recorded</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {smvProcesses.map(p => (
                          <div key={p._id || p.id} className="alert relative border border-base-200 bg-base-100 shadow-sm align-start">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <div>
                              <h3 className="font-bold">{p.title || p.name}</h3>
                              <div className="text-xs">Base Year: {p.referenceYear || p.baseYear || '—'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-base-100 border-t border-base-200 flex justify-between items-center gap-4 sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            {editMode ? (
              <div className="text-sm opacity-60 hidden sm:block">* Unsaved changes will be lost</div>
            ) : (
              <div className="text-sm opacity-60 hidden sm:block">Last updated: {prettyDate(lgu?.updatedAt)}</div>
            )}

          </div>

          <div className="flex gap-3">
            {editMode ? (
              <>
                <button
                  className="btn btn-ghost hover:bg-base-200"
                  onClick={() => { setEditMode(false); setEditData(null); }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary px-6"
                  onClick={handleSave}
                  disabled={loading.lgu}
                >
                  {loading.lgu ? <span className="loading loading-spinner loading-xs" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
              </>
            ) : (
              canEdit && (
                <button
                  className="btn btn-primary shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                  onClick={() => setEditMode(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Details
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
