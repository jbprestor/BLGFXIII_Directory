import { useState, useRef } from "react";
import useQrrpa from "../hooks/useQrrpa";
import QrrpaOverview from "../components/qrrpa/QrrpaOverview";
import QrrpaChecklist from "../components/qrrpa/QrrpaChecklist";
import QrrpaBatchReviewer from "../components/qrrpa/QrrpaBatchReviewer";

const TABS = [
  {
    id: "checklist",
    label: "Checklist",
    shortLabel: "Check",
    icon: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: "overview",
    label: "Analytics",
    shortLabel: "Stats",
    icon: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "reviewer",
    label: "Reviewer",
    shortLabel: "Review",
    icon: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
];

export default function QRRPAMonitoringPage() {
  const { loading, records, lgus, error, fetchData } = useQrrpa();
  const [tab, setTab] = useState("checklist");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visibleTab, setVisibleTab] = useState("checklist");
  const contentRef = useRef(null);

  const activeTab = TABS.find((t) => t.id === tab);

  const switchTab = (newTab) => {
    if (newTab === tab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setTab(newTab);
      setVisibleTab(newTab);
      setIsTransitioning(false);
    }, 160);
  };



  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 pb-12">

      {/* ─────────────── HEADER ─────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content mb-3">
            QRRPA Monitoring
          </h1>
          <p className="text-base sm:text-lg text-base-content/60 max-w-2xl leading-relaxed">
            Quarterly Revenue Report on Provincial Assessors — Track and manage LGU submissions in real-time with automated compliance tracking.
          </p>
        </div>
      </div>

      {/* ─────────────── ERROR BANNER ─────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-error/10 border border-error/30 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-error shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-error text-sm font-medium">{error}</span>
        </div>
      )}

      {/* ─────────────── TABS & CONTENT CARD ─────────────── */}
      <div className="bg-base-100 border border-base-200 shadow-sm rounded-xl overflow-hidden min-h-[70vh] flex flex-col">
        
        {/* TAB NAV */}
        <div className="border-b border-base-200 bg-base-100/50">
          <div className="flex px-2 sm:px-6 gap-2 sm:gap-8 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  id={`qrrpa-tab-${t.id}`}
                  onClick={() => switchTab(t.id)}
                  className={`
                    flex items-center shrink-0 whitespace-nowrap py-4 sm:py-5 px-4 font-semibold text-[15px] transition-all duration-200 border-b-2 -mb-px outline-none
                    ${isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-base-content/50 hover:text-base-content hover:border-base-300"
                    }
                  `}
                >
                  <span className={isActive ? "opacity-100" : "opacity-70"}>{t.icon}</span>
                  <span className="hidden xs:inline sm:inline">{t.label}</span>
                  <span className="xs:hidden sm:hidden">{t.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div
          ref={contentRef}
          className="flex-1 bg-base-100"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.16s ease, transform 0.16s ease",
          }}
        >
          {visibleTab === "checklist" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <QrrpaChecklist records={records} lgus={lgus} loading={loading} onRefresh={fetchData} />
            </div>
          )}
          {visibleTab === "overview" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <QrrpaOverview records={records} />
            </div>
          )}
          {visibleTab === "reviewer" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <QrrpaBatchReviewer />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 400px) {
          .xs\\:inline { display: none !important; }
          .xs\\:hidden { display: block !important; }
        }
      `}</style>
    </div>
  );
}
