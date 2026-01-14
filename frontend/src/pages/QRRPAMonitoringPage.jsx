import { useState, useEffect } from "react";
import useQrrpa from "../hooks/useQrrpa";
import QrrpaList from "../components/qrrpa/QrrpaList";
import QrrpaOverview from "../components/qrrpa/QrrpaOverview";
import QrrpaChecklist from "../components/qrrpa/QrrpaChecklist";
import QrrpaBatchReviewer from "../components/qrrpa/QrrpaBatchReviewer";

export default function QRRPAMonitoringPage() {
  const { loading, records, lgus, error, fetchData } = useQrrpa();
  const [tab, setTab] = useState("checklist");

  // Note: useQrrpa hook already handles initial data loading
  // No need for additional useEffect here to prevent double loading

  return (
    <div className="min-h-screen bg-base-200/30">

      {/* Header with Title */}
      <div className="px-4 pt-12 pb-6 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">QRRPA Monitoring</h1>
          <p className="text-sm text-base-content/60">Track and monitor quarterly reports</p>
        </div>
      </div>

      {/* Error Display - Only show if there's an error */}
      {error && (
        <div className="sticky top-16 z-10 mx-2 sm:mx-4 mt-2">
          <div className="alert alert-error text-error-content bg-error/10 border-error/20 mx-auto max-w-sm sm:max-w-4xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Tab Navigation - Closer to navbar */}
      <div className="px-2 pt-2 pb-3 sm:px-4">
        {/* Enhanced Tab Navigation */}
        <div className="flex bg-base-100 rounded-xl p-1 shadow-lg border border-base-300/50 max-w-sm mx-auto sm:max-w-4xl backdrop-blur-sm">
          <button
            className={`flex-1 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${tab === "checklist"
              ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
              }`}
            onClick={() => setTab("checklist")}
          >
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Checklist</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${tab === "list"
              ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
              }`}
            onClick={() => setTab("list")}
          >
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Records</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${tab === "overview"
              ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
              }`}
            onClick={() => setTab("overview")}
          >
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${tab === "reviewer"
              ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
              }`}
            onClick={() => setTab("reviewer")}
          >
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span>Reviewer</span>
            </div>
          </button>
        </div>
      </div>

      {/* Enhanced Tab Content */}
      <div className="px-2 pb-4 sm:px-4">
        <div className="bg-base-100/95 backdrop-blur-sm rounded-xl shadow-xl border border-base-300/50 min-h-[calc(100vh-280px)] sm:min-h-[calc(100vh-300px)] max-w-sm mx-auto sm:max-w-7xl overflow-hidden">
          {tab === "list" && (
            <section className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-base-content">Recent Records</h3>
                  <p className="text-sm text-base-content/60">View and manage QRRPA submissions</p>
                </div>
              </div>
              <div className="bg-base-100 text-base-content rounded-lg">
                <QrrpaList records={records} loading={loading} />
              </div>
            </section>
          )}

          {tab === "checklist" && (
            <section className="p-2 sm:p-3 lg:p-4">
              <div className="bg-base-100 text-base-content rounded-lg">
                <QrrpaChecklist
                  records={records}
                  lgus={lgus}
                  loading={loading}
                  onRefresh={fetchData}
                />
              </div>
            </section>
          )}

          {tab === "overview" && (
            <section className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-base-content">Analytics Dashboard</h3>
                  <p className="text-sm text-base-content/60">Overview of submission statistics and trends</p>
                </div>
              </div>
              <div className="bg-base-100 text-base-content rounded-lg">
                <QrrpaOverview records={records} />
              </div>
            </section>
          )}

          {tab === "reviewer" && (
            <section className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-base-content">QRRPA Batch Reviewer</h3>
                  <p className="text-sm text-base-content/60">Process multiple QRRPA files and generate compilation report</p>
                </div>
              </div>
              <div className="bg-base-100 text-base-content rounded-lg">
                <QrrpaBatchReviewer />
              </div>
            </section>
          )}
        </div>
      </div>

    </div>
  );
}
