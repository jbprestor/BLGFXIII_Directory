import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { processBatchFiles, exportToExcel } from "../../utils/excelParser";

export default function QrrpaBatchReviewer() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [compilationData, setCompilationData] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files).filter(f => 
      f.name.match(/\.xls[xm]?$/i)
    );

    if (files.length === 0) {
      toast.error("No valid Excel files selected");
      return;
    }

    setProcessing(true);
    setProgress({ current: 0, total: files.length, message: "Starting..." });
    setCompilationData([]);
    setErrors([]);

    try {
      const { results, errors: parseErrors } = await processBatchFiles(
        files,
        (progressInfo) => {
          setProgress(progressInfo);
        }
      );

      setCompilationData(results);
      setErrors(parseErrors);

      if (results.length > 0) {
        toast.success(`Successfully processed ${results.length} file(s)`);
      }

      if (parseErrors.length > 0) {
        toast.error(`Failed to process ${parseErrors.length} file(s)`);
      }

      setProgress({
        current: files.length,
        total: files.length,
        message: `Completed! ${results.length} files processed successfully.`,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      toast.error("An error occurred during processing");
    } finally {
      setProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExport = () => {
    if (compilationData.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportToExcel(compilationData, `QRRPA_Report_${timestamp}.xlsx`);
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  const handleReset = () => {
    setCompilationData([]);
    setErrors([]);
    setProgress({ current: 0, total: 0, message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* File Selection Area */}
      <div className="bg-base-200 rounded-lg p-6 border-2 border-dashed border-base-300">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-base-content mb-2">
              Select QRRPA Files to Process
            </h3>
            <p className="text-sm text-base-content/60 mb-4">
              Choose multiple Excel files (.xls, .xlsx) containing QRRPA data
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <label className="btn btn-primary btn-lg gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Select Files
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xls,.xlsx,.xlsm"
                onChange={handleFileSelect}
                disabled={processing}
                className="hidden"
              />
            </label>

            {compilationData.length > 0 && (
              <button
                onClick={handleReset}
                className="btn btn-outline btn-lg gap-2"
                disabled={processing}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Display */}
      {(processing || progress.total > 0) && (
        <div className="bg-base-100 rounded-lg p-6 border border-base-300 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base-content">Processing Status</h4>
                <p className="text-sm text-base-content/60">{progress.message}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {progress.current} / {progress.total}
                </div>
                <div className="text-xs text-base-content/60">files processed</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 rounded-full"
                style={{ 
                  width: progress.total > 0 
                    ? `${(progress.current / progress.total) * 100}%` 
                    : "0%" 
                }}
              />
            </div>

            {processing && (
              <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Processing files, please wait...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Table */}
      {compilationData.length > 0 && (
        <div className="bg-base-100 rounded-lg border border-base-300 shadow-lg overflow-hidden">
          <div className="p-4 bg-base-200 border-b border-base-300 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-base-content">Compilation Results</h4>
              <p className="text-sm text-base-content/60">
                {compilationData.length} record(s) extracted
              </p>
            </div>
            <button
              onClick={handleExport}
              className="btn btn-success gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead className="bg-base-200">
                <tr>
                  <th className="text-xs">#</th>
                  <th className="text-xs">Source File</th>
                  <th className="text-xs">LGU Name</th>
                  <th className="text-xs">Province</th>
                  <th className="text-xs">LGU Type</th>
                  <th className="text-xs">Findings</th>
                  <th className="text-xs">Count</th>
                </tr>
              </thead>
              <tbody>
                {compilationData.map((record, idx) => (
                  <tr key={idx} className="hover:bg-base-200/50">
                    <td className="text-xs">{idx + 1}</td>
                    <td className="text-xs font-mono">{record.sourceFile}</td>
                    <td className="text-xs font-semibold">{record.lguName}</td>
                    <td className="text-xs">{record.province}</td>
                    <td className="text-xs">{record.lguType}</td>
                    <td className="text-xs max-w-md truncate" title={record.findings}>
                      {record.findings}
                    </td>
                    <td className="text-xs">
                      <span className="badge badge-sm badge-primary">
                        {record.findingsCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Errors Display */}
      {errors.length > 0 && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-bold text-error mb-2">
                Failed to Process {errors.length} File(s)
              </h4>
              <ul className="space-y-1 text-sm">
                {errors.map((error, idx) => (
                  <li key={idx} className="text-error-content/80">
                    <span className="font-mono">{error.sourceFile}</span>: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!processing && compilationData.length === 0 && (
        <div className="bg-base-100 rounded-lg p-6 border border-base-300">
          <h4 className="font-bold text-base-content mb-3">How to Use:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-base-content/80">
            <li>Click "Select Files" and choose multiple QRRPA Excel files</li>
            <li>Files will be processed automatically to extract LGU data and findings</li>
            <li>Review the compilation table with extracted data</li>
            <li>Click "Export Report" to download the compiled Excel report</li>
          </ol>
          
          <div className="mt-4 p-3 bg-info/10 rounded-lg border border-info/20">
            <p className="text-xs text-info-content">
              <strong>Note:</strong> Expected file structure should contain sheets named "Findings", "Value1", and optionally "Data" or "DataCaptured" with the standard QRRPA template format.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
