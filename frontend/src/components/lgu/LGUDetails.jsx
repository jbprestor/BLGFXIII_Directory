import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, FileText, Users, BarChart3, Edit2, Trash2, Save, XCircle } from "../common/Icon";
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
  const canEdit = user && (user.role === 'admin' || user.role === 'editor');
  const canDelete = user && user.role === 'admin';

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

    if (activeTab === 'assessors') loadAssessors();
    if (activeTab === 'smv') loadSmv();
    return () => { mounted = false; };
  }, [activeTab, lgu, enqueueRequest, getAllAssessors, getSMVProcesses, assessorsCache, smvCache]);

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      {/* Responsive modal: full-screen on xs, centered panel on md+ */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className="relative w-full h-full sm:h-auto max-w-3xl mx-0 sm:mx-auto bg-base-100 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:justify-between p-4 border-b border-base-200 gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-base-200 border flex items-center justify-center">
              {/* Use lightweight icon on xs, image on sm+ */}
              <div className="sm:hidden text-base-content/50"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v6a4 4 0 004 4h10"/></svg></div>
              <img src={imgSrc} alt={lgu?.name || 'LGU'} onError={onImgError} className="hidden sm:block w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{lgu?.name || 'Loading...'}</h3>
              <div className="text-sm text-base-content/60">{lgu?.province} • {lgu?.region}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(lgu || {})); toast.success('Copied'); }}>Copy</button>
            <button className="btn btn-ghost" onClick={onClose}><X /></button>
          </div>
        </div>

        <div className="p-3 border-b border-base-200">
          <nav className="flex gap-2">
            <button className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('overview')}><FileText className="w-4 h-4 mr-2"/>Overview</button>
            <button className={`btn btn-sm ${activeTab === 'assessors' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('assessors')}><Users className="w-4 h-4 mr-2"/>Assessors</button>
            <button className={`btn btn-sm ${activeTab === 'smv' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('smv')}><BarChart3 className="w-4 h-4 mr-2"/>SMV</button>
          </nav>
        </div>

  <div className="p-4 max-h-[70vh] overflow-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60">Population</div>
                  <div className="font-semibold">{prettyPopulation(lgu?.population)}</div>
                </div>
                <div className="p-3 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60">Income Class</div>
                  <div className="font-semibold">{lgu?.incomeClass || '—'}</div>
                </div>
                <div className="p-3 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60">Classification</div>
                  <div className="font-semibold">{lgu?.classification || '—'}</div>
                </div>
                <div className="p-3 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60">Status</div>
                  <div className="font-semibold">{lgu?.currentSMVStatus || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Local Chief Executive (LCE)</h4>
                  {lgu?.lce ? (
                    <div className="text-sm text-base-content/70">
                      <div className="font-medium">{[lgu.lce.firstName, lgu.lce.middleName, lgu.lce.lastName].filter(Boolean).join(' ')}</div>
                      <div>{lgu.lce.officeAddress}</div>
                      <div className="text-xs">{lgu.lce.officialEmail}</div>
                    </div>
                  ) : <div className="text-sm text-base-content/60">—</div>}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Geography & Contact</h4>
                  <div className="text-sm text-base-content/70">
                    <div>Land area: {prettyNumber(lgu?.landArea)} km²</div>
                    <div>Coordinates: {lgu?.coordinates?.latitude ? `${lgu.coordinates.latitude}, ${lgu.coordinates.longitude}` : '—'}</div>
                      <div>Phone: {lgu?.contactInfo?.phoneNumber || '—'}</div>
                      <div>Website: {lgu?.contactInfo?.website ? (<a className="link" href={lgu.contactInfo.website} target="_blank" rel="noreferrer">{lgu.contactInfo.website}</a>) : '—'}</div>
                      <div>Facebook: {lgu?.contactInfo?.socialMedia?.facebook || '—'}</div>
                      <div>Twitter: {lgu?.contactInfo?.socialMedia?.twitter || '—'}</div>
                      <div>ZIP Code: {lgu?.zipCode || '—'}</div>
                    <div>Established: {prettyDate(lgu?.establishmentDate)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Performance & SMV</h4>
                <div className="text-sm text-base-content/70">
                  <div>Seal of Good Local Governance: {lgu?.performanceMetrics?.sealOfGoodLocalGovernance?.hasAward ? `${lgu.performanceMetrics.sealOfGoodLocalGovernance.level || ''} (${lgu.performanceMetrics.sealOfGoodLocalGovernance.year || '—'})` : 'No'}</div>
                  <div>Business permit processing (days): {prettyNumber(lgu?.performanceMetrics?.businessPermitProcessingTime)}</div>
                  <div>Tax collection efficiency: {lgu?.performanceMetrics?.taxCollectionEfficiency ? `${lgu.performanceMetrics.taxCollectionEfficiency}%` : '—'}</div>
                  <div>Existing SMV base year: {lgu?.existingSMV?.baseYear || '—'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">SMV History</h4>
                {Array.isArray(lgu?.smvHistory) && lgu.smvHistory.length ? (
                  <div className="space-y-2">
                    {lgu.smvHistory.map((h, i) => (
                      <div key={i} className="p-2 bg-base-100 rounded">
                        <div className="text-sm font-medium">{h.ordinanceNo || '—'} • {h.baseYear || '—'}</div>
                        <div className="text-xs text-base-content/70">{h.notes || ''}</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-sm text-base-content/60">No SMV history recorded</div>}
              </div>

              {/* Administrative & timestamps */}
              <div className="space-y-2">
                <h4 className="font-semibold">Administrative</h4>
                <div className="text-sm text-base-content/70">
                  <div>ZIP: {lgu?.zipCode || '—'}</div>
                  <div>Mayoral Term: {lgu?.mayoralTerm?.startDate ? `${prettyDate(lgu.mayoralTerm.startDate)} — ${prettyDate(lgu.mayoralTerm.endDate)}` : '—'}</div>
                  <div>Record created: {prettyDate(lgu?.createdAt)} • updated: {prettyDate(lgu?.updatedAt)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assessors' && (
            <div className="space-y-3">
              {loading.assessors ? (
                <div className="py-6 text-center">
                  <span className="loading loading-spinner loading-lg"/>
                </div>
              ) : assessors.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">👤</div>
                  <div className="font-medium text-base-content/70">No Assessors Assigned</div>
                  <div className="text-sm text-base-content/50 mt-1">This LGU currently has no assessors on record</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Assigned Assessors</h3>
                    <div className="badge badge-outline">{assessors.length} total</div>
                  </div>
                  <div className="grid gap-3">
                    {assessors.map(a => (
                      <div key={a._id || a.id} className="card bg-base-100 shadow-sm">
                        <div className="card-body p-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="card-title text-base">{[a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ')}</h4>
                              <div className="text-sm mt-1">
                                <div className="font-medium text-base-content/70">{a.officialDesignation || a.position || '—'}</div>
                                <div className="text-base-content/60 mt-2">
                                  {a.statusOfAppointment && (
                                    <div className="badge badge-sm mr-2">{a.statusOfAppointment}</div>
                                  )}
                                  {a.salaryGrade && (
                                    <span className="text-xs">SG {a.salaryGrade}-{a.stepIncrement || 1}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm text-base-content/60">
                              {a.dateOfAppointment && (
                                <div>Since {prettyDate(a.dateOfAppointment)}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                            <div>
                              <div className="text-xs font-medium text-base-content/50 mb-1">Contact Details</div>
                              <div>{a.officeEmail || a.personalEmail || '—'}</div>
                              <div>{a.mobileNumber || a.contactNumber || '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-base-content/50 mb-1">Credentials</div>
                              <div>{[a.bachelorDegree, a.masteralDegree, a.doctoralDegree].filter(Boolean).join(', ') || '—'}</div>
                              {a.prcLicenseNumber && (
                                <div className="text-xs mt-1">
                                  PRC: {a.prcLicenseNumber}
                                  {a.prcLicenseExpiration && ` (exp. ${prettyDate(a.prcLicenseExpiration)})`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'smv' && (
            <div className="space-y-3">
              {loading.smv ? <div className="py-6 text-center"><span className="loading loading-spinner loading-lg"/></div> :
                smvProcesses.length === 0 ? <div className="text-base-content/60">No SMV processes found</div> :
                smvProcesses.map(p => (
                  <div key={p._id || p.id} className="p-3 bg-base-100 rounded-lg">
                    <div className="font-medium">{p.title || p.name}</div>
                    <div className="text-sm text-base-content/60">{p.referenceYear || p.baseYear || '—'}</div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {editMode && (
          <div className="border-t border-base-200 p-4">
            <h3 className="font-semibold mb-4">Edit LGU Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="form-control">
                <label className="label">Name</label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={editData?.name || ''} 
                  onChange={e => handleChange('name', e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">Classification</label>
                <select 
                  className="select select-bordered" 
                  value={editData?.classification || ''} 
                  onChange={e => handleChange('classification', e.target.value)}
                >
                  <option value="">Select Classification</option>
                  <option value="HUC">HUC</option>
                  <option value="CC">CC</option>
                  <option value="Municipality">Municipality</option>
                  <option value="Province">Province</option>
                  <option value="ICC">ICC</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">Income Class</label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={editData?.incomeClass || ''} 
                  onChange={e => handleChange('incomeClass', e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">Population</label>
                <input 
                  type="number" 
                  className="input input-bordered" 
                  value={editData?.population || ''} 
                  onChange={e => handleChange('population', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* LCE Information */}
              <div className="form-control">
                <label className="label">LCE First Name</label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={editData?.lce?.firstName || ''} 
                  onChange={e => handleChange('lce.firstName', e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">LCE Last Name</label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={editData?.lce?.lastName || ''} 
                  onChange={e => handleChange('lce.lastName', e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">LCE Email</label>
                <input 
                  type="email" 
                  className="input input-bordered" 
                  value={editData?.lce?.officialEmail || ''} 
                  onChange={e => handleChange('lce.officialEmail', e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">LCE Office Address</label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={editData?.lce?.officeAddress || ''} 
                  onChange={e => handleChange('lce.officeAddress', e.target.value)}
                />
              </div>

              {/* SMV Status */}
              <div className="form-control">
                <label className="label">Current SMV Status</label>
                <select 
                  className="select select-bordered" 
                  value={editData?.currentSMVStatus || ''} 
                  onChange={e => handleChange('currentSMVStatus', e.target.value)}
                >
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
              </div>

              <div className="form-control">
                <label className="label">Conducting 2025 Revision</label>
                <select 
                  className="select select-bordered" 
                  value={editData?.existingSMV?.conductingRevision2025?.toString() || 'false'} 
                  onChange={e => handleChange('existingSMV.conductingRevision2025', e.target.value === 'true')}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-base-200 flex justify-between gap-2">
          {/* Left side - Edit/Delete buttons */}
          <div className="flex gap-2">
            {canEdit && !editMode && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setEditMode(true)}
              >
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </button>
            )}
            {canDelete && !editMode && (
              <button 
                className="btn btn-ghost btn-sm text-error" 
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </button>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditMode(false);
                    setEditData(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Cancel
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={loading.lgu}
                >
                  <Save className="w-4 h-4 mr-1" /> 
                  {loading.lgu ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => { 
                    navigator.clipboard?.writeText(JSON.stringify(lgu || {})); 
                    toast.success('Copied'); 
                  }}
                >
                  Copy JSON
                </button>
                <button className="btn btn-primary btn-sm" onClick={onClose}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

