import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useOrdinanceConfig } from "../../hooks/useOrdinanceConfig";
import { parseQrrpaCsv } from "../../utils/qrrpa/parser";
import { validateQrrpaData } from "../../utils/qrrpa/validator";
import { getDefaultOrdinances, MUNICIPALITY_TO_PROVINCE, PROVINCES_AND_CITIES } from "../../utils/qrrpa/defaultOrdinances";
import AssessmentConfig from "./AssessmentConfig";
import * as XLSX from "xlsx";

const parseNumber = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/,/g, '').trim();
  if (str === '-' || str === '') return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};



export default function QrrpaBatchReviewer() {
  // Views: 'home', 'config', 'review'
  const [view, setView] = useState('home');
  // Use shared hook for ordinance config
  const { ordinanceConfig, saveConfig, isLoading } = useOrdinanceConfig();

  // Validation Scope: 'AUTO' or specific Province Name
  const [validationScope, setValidationScope] = useState('AUTO');

  // Reviewer State
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [compilationData, setCompilationData] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleSaveConfig = (newConfig) => {
    saveConfig(newConfig);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files).filter(f =>
      f.name.match(/\.(csv|xls|xlsx|xlsm)$/i)
    );

    if (files.length === 0) {
      toast.error("No valid files selected (CSV, Excel)");
      return;
    }

    setProcessing(true);
    setProgress({ current: 0, total: files.length, message: "Starting..." });
    setCompilationData([]);
    setErrors([]);

    const newResults = [];
    const newErrors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setProgress({
          current: i + 1,
          total: files.length,
          message: `Processing ${file.name}...`
        });

        // 1. Parsing
        const parsed = await parseQrrpaCsv(file);

        // 2. Identify Scope for Validation
        let provinceOrCity = "Agusan del Norte"; // Default Fallback

        if (validationScope !== 'AUTO') {
          // User forced a specific scope
          provinceOrCity = validationScope;
        } else {
          // Auto-detect based on LGU Name
          const rawLguName = parsed?.meta?.lguName || "";

          // Helper to find province from map
          const findProvince = (name) => {
            const cleanName = name.replace(/MUNICIPALITY OF|CITY OF|LGU/gi, "").trim();
            // Try validation against direct keys
            const directMatch = MUNICIPALITY_TO_PROVINCE[cleanName];
            if (directMatch) return directMatch;

            // Try case-insensitive matching
            const key = Object.keys(MUNICIPALITY_TO_PROVINCE).find(k =>
              cleanName.toUpperCase() === k.toUpperCase() ||
              cleanName.toUpperCase().includes(k.toUpperCase())
            );
            return key ? MUNICIPALITY_TO_PROVINCE[key] : null;
          };

          // 1. Try to get Province from Metadata (Best for Disambiguation)
          if (parsed.meta && parsed.meta.province && ordinanceConfig[parsed.meta.province]) {
            provinceOrCity = parsed.meta.province;
          }
          // 2. Fallback: Map Municipality to Province (e.g. Bunawan -> Agusan del Sur)
          else if (MUNICIPALITY_TO_PROVINCE[rawLguName] && ordinanceConfig[MUNICIPALITY_TO_PROVINCE[rawLguName]]) {
            provinceOrCity = MUNICIPALITY_TO_PROVINCE[rawLguName];
          }
          // 3. Fallback: Check if the LGU name itself is a City/Province in config
          else if (ordinanceConfig[rawLguName]) {
            provinceOrCity = rawLguName;
          }
        }

        // 3. Validation with Config
        const validation = validateQrrpaData(parsed, ordinanceConfig, provinceOrCity);

        // 4. Calculate Unique Barangays
        const barangays = new Set();
        Object.values(parsed.data).forEach(section => {
          section.forEach(r => {
            if (r.barangay && r.barangay !== 'Unknown') barangays.add(r.barangay);
          });
        });
        const barangayCount = barangays.size;

        newResults.push({
          fileName: file.name,
          lguName: parsed?.meta?.lguName || "Unknown",
          period: parsed?.meta?.period || "Unknown",
          // New Fields
          barangayHeader: parsed?.meta?.barangay || "",
          preparedBy: parsed?.meta?.preparedBy || "",
          assessor: parsed?.meta?.assessor || "",

          ordinanceInfo: parsed?.meta?.ordinance || "",
          taxableLandTotal: parsed?.meta?.taxableLand?.total || 0,
          assessedValueTotal: parsed?.meta?.assessedValueTotal || 0,

          provinceScope: provinceOrCity,
          barangayCount: barangayCount,
          score: validation.score,
          findings: validation.findings,
          errors: validation.errors,
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.error(`Failed to process ${file.name}`, err);
        newErrors.push({
          fileName: file.name,
          error: err.message || "Unknown parsing error"
        });
      }
      await new Promise(r => setTimeout(r, 50));
    }

    setCompilationData(newResults);
    setErrors(newErrors);
    setProcessing(false);

    if (newResults.length > 0) toast.success(`Processed ${newResults.length} files`);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    if (compilationData.length === 0) return;
    const exportRows = compilationData.map(r => ({
      "File Name": r.fileName,
      "LGU": r.lguName,
      "Period": r.period,
      "Barangay (Header)": r.barangayHeader,
      "Ordinance Info": r.ordinanceInfo,
      "Assessor": r.assessor,
      "Prepared By": r.preparedBy,
      "Province/Scope": r.provinceScope,
      "Barangay Count": r.barangayCount,
      "Score": r.score,
      "Findings Count": r.findings.length,
      "Errors Count": r.errors.length,
      "Findings": r.findings.join("; "),
      "Errors": r.errors.join("; ")
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Review Results");
    XLSX.writeFile(wb, `QRRPA_Review_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Report exported!");
  };

  const handleReset = () => {
    setCompilationData([]);
    setErrors([]);
    setProgress({ current: 0, total: 0, message: "" });
  };

  // --- Views ---

  if (view === 'config') {
    return <AssessmentConfig config={ordinanceConfig} onSave={handleSaveConfig} onBack={() => setView('home')} />;
  }

  if (view === 'review') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('home')} className="btn btn-ghost btn-sm gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Menu
          </button>
          <div className="text-sm font-semibold opacity-60">Batch Review Mode</div>
        </div>

        {/* File Selection Area */}
        <div className="bg-base-200 rounded-lg p-6 border-2 border-dashed border-base-300">
          <div className="text-center space-y-4">

            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-base-content mb-2">
                Upload QRRPA Files
              </h3>

              {/* Validation Scope Selection */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Validation Ordinance Scope</span>
                </label>
                <select
                  className="select select-bordered w-full font-bold text-center"
                  value={validationScope}
                  onChange={(e) => setValidationScope(e.target.value)}
                >
                  <option value="AUTO">✨ Auto-detect (Recommended)</option>
                  <option disabled>──────────────</option>
                  {PROVINCES_AND_CITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    {validationScope === 'AUTO'
                      ? "Will automatically match LGU to its Province."
                      : `Will enforce ${validationScope} rules for ALL files.`}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <label className={`btn btn-primary btn-lg gap-2 ${processing ? 'loading' : ''}`}>
                {!processing && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                {processing ? 'Processing...' : 'Upload CSV/Excel'}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".csv,.xls,.xlsx,.xlsm"
                  onChange={handleFileSelect}
                  disabled={processing}
                  className="hidden"
                />
              </label>

              {compilationData.length > 0 && (
                <button onClick={handleReset} className="btn btn-outline btn-lg gap-2">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Display */}
        {compilationData.length > 0 && (
          <div className="bg-base-100 rounded-lg border border-base-300 shadow-lg overflow-hidden">
            <div className="p-4 bg-base-200 border-b border-base-300 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base-content">Review Results</h4>
                <p className="text-sm text-base-content/60">
                  {compilationData.length} file(s) analyzed
                </p>
              </div>
              <button onClick={handleExport} className="btn btn-success btn-sm gap-2">
                Download Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm table-pin-rows w-full">
                <thead className="bg-base-200/50 text-base-content/70">
                  <tr>
                    <th className="min-w-[200px]">File / LGU</th>
                    <th>Period</th>
                    <th className="min-w-[150px]">Barangay</th>
                    <th>Ordinance</th>
                    <th className="text-right">Taxable Land (sqm)</th>
                    <th className="text-right">Total AV</th>
                    <th>Officials</th>
                    <th>Scope</th>
                    <th className="text-center">Score</th>
                    <th>Status</th>
                    <th className="min-w-[350px]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {compilationData.map((record, idx) => (
                    <tr key={idx} className="hover:bg-base-200/50 align-top transition-colors">
                      <td>
                        <div className="font-bold text-sm whitespace-normal break-words" title={record.lguName}>{record.lguName}</div>
                        <div className="font-mono text-[10px] opacity-50 break-all" title={record.fileName}>{record.fileName}</div>
                      </td>
                      <td className="whitespace-nowrap text-xs">{record.period}</td>
                      <td className="text-xs whitespace-normal break-words" title={record.barangayHeader}>
                        {record.barangayHeader || <span className="opacity-30">-</span>}
                      </td>
                      <td className="max-w-[120px]">
                        <div className="text-xs text-info truncate" title={record.ordinanceInfo}>
                          {record.ordinanceInfo || <span className="opacity-30">-</span>}
                        </div>
                      </td>
                      <td className="text-xs font-mono text-right pr-4">
                        {record.taxableLandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-xs font-mono text-right font-bold text-primary pr-4">
                        ₱{parseNumber(record.assessedValueTotal)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-xs">
                        <div className="flex flex-col gap-0.5 max-w-[150px]">
                          <span className="opacity-70 truncate" title={`Assessor: ${record.assessor}`}>
                            A: {record.assessor || "-"}
                          </span>
                          <span className="opacity-70 truncate" title={`Prepared By: ${record.preparedBy}`}>
                            P: {record.preparedBy || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-xs italic opacity-70">
                        {record.provinceScope}
                      </td>
                      <td className="text-center pt-3">
                        <span className={`badge font-bold ${record.score === 100 ? 'badge-success text-white' : record.score > 80 ? 'badge-warning' : 'badge-error text-white'}`}>
                          {record.score}%
                        </span>
                      </td>
                      <td className="pt-3">
                        {record.errors.length > 0 ? (
                          <div className="badge badge-xs badge-error gap-1 p-2 text-white">Failed</div>
                        ) : record.findings.length > 0 ? (
                          <div className="badge badge-xs badge-warning gap-1 p-2">Warning</div>
                        ) : (
                          <div className="badge badge-xs badge-success gap-1 p-2 text-white">Clean</div>
                        )}
                      </td>
                      <td className="min-w-[300px]">
                        <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                          {record.errors.map((err, i) => (
                            <div key={`err-${i}`} className={`text-error text-xs flex items-start gap-1 ${err.includes("Effective Assessment Level") ? "font-bold" : ""}`}>
                              <span>❌</span> <span>{err}</span>
                            </div>
                          ))}
                          {record.findings.map((finding, i) => (
                            <div key={`find-${i}`} className="text-warning-content text-xs flex items-start gap-1">
                              <span>⚠️</span> <span>{finding}</span>
                            </div>
                          ))}
                          {record.errors.length === 0 && record.findings.length === 0 && (
                            <div className="text-success text-xs italic flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              No issues found
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Errors List */}
        {errors.length > 0 && (
          <div className="alert alert-error">
            <div>
              <h3 className="font-bold">Parsing Errors</h3>
              <ul className="text-xs list-disc list-inside">
                {errors.map((e, i) => (
                  <li key={i}>{e.fileName}: {e.error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: HOME
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <h2 className="text-2xl font-bold">QRRPA for Region XIII</h2>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => setView('review')}
          className="btn btn-primary btn-lg h-24 text-xl shadow-lg border-2 border-primary hover:scale-105 transition-transform"
        >
          Start Batch Review
        </button>
        <button
          onClick={() => setView('config')}
          className="btn btn-outline btn-lg h-20 text-lg shadow-sm hover:bg-base-200"
        >
          Assessment Levels
        </button>
      </div>
      <p className="text-sm text-base-content/50 text-center max-w-xs">
        Configure assessment levels (ordinances) before running the review to ensure accurate validation.
      </p>
    </div>
  );
}
