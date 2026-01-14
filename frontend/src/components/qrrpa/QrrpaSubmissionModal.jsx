import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function QrrpaSubmissionModal({
    isOpen,
    onClose,
    lgus = [],
    onSubmit,
    uploadProgress = 0,
    isSubmitting = false
}) {
    const { user } = useAuth();

    // Default State
    const fileInputRef = React.useRef(null);
    const [dragActive, setDragActive] = useState(false);

    const [formData, setFormData] = useState({
        region: "",
        province: "",
        lguId: "",
        year: new Date().getFullYear().toString(),
        quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
        status: "Submitted",
        description: "",
        attachment: null
    });

    // Derived Data
    const regions = React.useMemo(() =>
        [...new Set(lgus.map(l => l.region).filter(Boolean))].sort(),
        [lgus]);

    const [availableProvinces, setAvailableProvinces] = useState([]);
    const [availableLgus, setAvailableLgus] = useState([]);

    // Initialize/Reset logic
    useEffect(() => {
        if (isOpen) {
            // If user has a specific region/province/lgu assigned, pre-fill it
            // For now, assuming standard user might be an LGU user
            if (user?.role === 'LGU' && user?.lguId) {
                // Find the LGU object
                const functionalLgu = lgus.find(l => (l._id || l.id) === user.lguId);
                if (functionalLgu) {
                    setFormData(prev => ({
                        ...prev,
                        region: functionalLgu.region,
                        province: functionalLgu.province,
                        lguId: functionalLgu._id || functionalLgu.id
                    }));
                }
            }
        }
    }, [isOpen, user, lgus]);

    // Cascading Logic
    useEffect(() => {
        if (formData.region) {
            const provs = [...new Set(lgus.filter(l => l.region === formData.region).map(l => l.province).filter(Boolean))].sort();
            setAvailableProvinces(provs);
        } else {
            setAvailableProvinces([]);
        }
    }, [formData.region, lgus]);

    useEffect(() => {
        if (formData.province) {
            const filtered = lgus.filter(l => l.province === formData.province);
            setAvailableLgus(filtered);
        } else if (formData.region && !formData.province) {
            // If region selected but no province (rare case if province is strictly required), show all in region? 
            // Better to stick to cascading: Region -> Select Province -> Select LGU
            setAvailableLgus([]);
        } else {
            setAvailableLgus([]);
        }
    }, [formData.province, formData.region, lgus]);


    // Handlers
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Reset downward cascade
        if (field === "region") setFormData(prev => ({ ...prev, region: value, province: "", lguId: "" }));
        if (field === "province") setFormData(prev => ({ ...prev, province: value, lguId: "" }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, attachment: file }));
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFormData(prev => ({ ...prev, attachment: e.dataTransfer.files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.lguId) return toast.error("Please select an LGU");
        if (!formData.status) return toast.error("Please select a status");

        const payload = {
            lguId: formData.lguId,
            period: `${formData.year}-${formData.quarter}`,
            status: formData.status,
            description: formData.description,
            attachment: formData.attachment
        };

        const result = await onSubmit(payload);
        if (result && result.success) {
            toast.success("Submission successful!");
            onClose();
            // Reset form
            setFormData({
                region: "",
                province: "",
                lguId: "",
                year: new Date().getFullYear().toString(),
                quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
                status: "Submitted",
                description: "",
                attachment: null
            });
        } else {
            toast.error(result?.message || "Submission failed");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-base-300 flex flex-col">

                {/* Header */}
                <div className="p-5 border-b border-base-200 flex justify-between items-center sticky top-0 bg-base-100 z-10">
                    <div>
                        <h2 className="text-xl font-bold">New QRRPA Submission</h2>
                        <p className="text-xs text-base-content/60">Submit quarterly report for Local Government Units</p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-grow">

                    {/* Section 1: Context (Period & LGU) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Year</span></label>
                            <select className="select select-bordered" value={formData.year} onChange={(e) => handleChange("year", e.target.value)}>
                                {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Quarter</span></label>
                            <select className="select select-bordered" value={formData.quarter} onChange={(e) => handleChange("quarter", e.target.value)}>
                                {["Q1", "Q2", "Q3", "Q4"].map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="divider text-xs text-base-content/40 my-0">LGU DETAILS</div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Region</span></label>
                            <select
                                className="select select-bordered w-full"
                                value={formData.region}
                                onChange={(e) => handleChange("region", e.target.value)}
                                disabled={user?.role === 'Regional' || user?.role === 'LGU'}
                            >
                                <option value="">Select Region</option>
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Province</span></label>
                            <select
                                className="select select-bordered w-full"
                                value={formData.province}
                                onChange={(e) => handleChange("province", e.target.value)}
                                disabled={!formData.region || user?.role === 'LGU'}
                            >
                                <option value="">Select Province</option>
                                {availableProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">LGU</span></label>
                            <select
                                className="select select-bordered w-full"
                                value={formData.lguId}
                                onChange={(e) => handleChange("lguId", e.target.value)}
                                disabled={!formData.province || user?.role === 'LGU'}
                            >
                                <option value="">Select LGU</option>
                                {availableLgus.map(l => (
                                    <option key={l._id || l.id} value={l._id || l.id}>{l.name} {l.classification ? `(${l.classification})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="divider text-xs text-base-content/40 my-0">SUBMISSION DETAILS</div>

                    <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Description / Remarks</span></label>
                        <textarea
                            className="textarea textarea-bordered h-20"
                            placeholder="Enter any additional notes or remarks..."
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Status Selection */}
                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Status</span></label>
                            <div className="flex flex-col gap-2">
                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.status === "Submitted" ? "border-success bg-success/10" : "border-base-300 hover:bg-base-200"}`}>
                                    <input type="radio" name="status" className="radio radio-success" checked={formData.status === "Submitted"} onChange={() => handleChange("status", "Submitted")} />
                                    <div>
                                        <span className="font-bold text-sm block">Submitted</span>
                                        <span className="text-xs text-base-content/70">Completed submission</span>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.status === "Late Submission" ? "border-warning bg-warning/10" : "border-base-300 hover:bg-base-200"}`}>
                                    <input type="radio" name="status" className="radio radio-warning" checked={formData.status === "Late Submission"} onChange={() => handleChange("status", "Late Submission")} />
                                    <div>
                                        <span className="font-bold text-sm block">Late Submission</span>
                                        <span className="text-xs text-base-content/70">Submitted after deadline</span>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.status === "Not Submitted" ? "border-error bg-error/10" : "border-base-300 hover:bg-base-200"}`}>
                                    <input type="radio" name="status" className="radio radio-error" checked={formData.status === "Not Submitted"} onChange={() => handleChange("status", "Not Submitted")} />
                                    <div>
                                        <span className="font-bold text-sm block">Not Submitted</span>
                                        <span className="text-xs text-base-content/70">Mark as missing</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="form-control">
                            <label className="label"><span className="label-text font-medium">Attachment</span></label>
                            <div
                                className={`
                  border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all h-full
                  ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-base-300 hover:border-primary/50"}
                  ${formData.attachment ? "bg-base-200/50 border-success/50" : ""}
                `}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {formData.attachment ? (
                                    <div className="animate-in fade-in zoom-in duration-200">
                                        <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="font-medium text-sm truncate max-w-[200px]">{formData.attachment.name}</p>
                                        <p className="text-xs text-base-content/60 mt-1">{(formData.attachment.size / 1024).toFixed(1)} KB</p>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-ghost text-error mt-2 hover:bg-error/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData(prev => ({ ...prev, attachment: null }));
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        </div>
                                        <p className="text-sm font-medium">Click to upload or drag & drop</p>
                                        <p className="text-xs text-base-content/50 mt-1">Excel (.xlsx) or CSV files</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <progress className="progress progress-primary w-full" value={uploadProgress} max="100"></progress>
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="p-5 border-t border-base-200 bg-base-50/50 flex justify-end gap-3 sticky bottom-0 z-10">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.lguId}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                </div>

            </div>
        </div>
    );
}
