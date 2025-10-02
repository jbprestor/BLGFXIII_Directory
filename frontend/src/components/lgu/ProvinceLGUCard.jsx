// src/components/lgu/ProvinceLguCard.jsx
import React from "react";

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

/**
 * ProvinceLguCard
 *
 * Props:
 *  - lgu: object
 *  - onClick: fn
 *  - getCandidatesFor: fn
 *  - PLACEHOLDER_IMAGE: string
 *  - cardBaseClasses: string
 *  - cardAccentRing: string
 *  - getTypeBorder: fn
 */
export default React.memo(function ProvinceLguCard({
  lgu,
  onClick,
  getCandidatesFor,
  PLACEHOLDER_IMAGE,
  cardBaseClasses = "",
  cardAccentRing = "",
  getTypeBorder
}) {
  const candidates = getCandidatesFor ? getCandidatesFor(lgu) : [PLACEHOLDER_IMAGE];
  const typeBorder = getTypeBorder ? getTypeBorder(lgu?.classification) : "border-l-4 border-neutral/10";

  return (
    <article
      role="button"
      onClick={onClick}
      className={`group relative ${cardBaseClasses} ${cardAccentRing} p-0 overflow-hidden ${typeBorder}`}
      aria-label={`Open ${lgu?.name}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick && onClick(); } }}
    >
      {/* Status indicators */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        {lgu?.currentSMVStatus && lgu.currentSMVStatus !== "No Revision" && (
          <span className={`badge badge-xs ${getStatusBadgeClass(lgu.currentSMVStatus)}`}>
            {lgu.currentSMVStatus}
          </span>
        )}
        {lgu?.existingSMV?.conductingRevision2025 && (
          <span className="badge badge-xs badge-warning">2025</span>
        )}
      </div>

      <div className="flex items-stretch">
        <div className="w-28 h-full flex items-center justify-center bg-white border-r border-base-200 p-3">
          <img
            src={candidates[0] || PLACEHOLDER_IMAGE}
            alt={`${lgu?.name || "LGU"} logo`}
            loading="lazy"
            onError={(e) => {
              const current = e.currentTarget;
              const idx = candidates.indexOf(current.src);
              const next = (idx >= 0 && candidates[idx + 1]) ? candidates[idx + 1] : PLACEHOLDER_IMAGE;
              current.onerror = null;
              current.src = next;
            }}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex-1 p-4">
          <h4 className="font-semibold text-base-content truncate">{lgu?.name}</h4>
          <p className="text-sm text-base-content/60 capitalize mt-1">{lgu?.classification}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {lgu?.incomeClass && <div className="badge badge-sm badge-outline">{lgu.incomeClass}</div>}
            {!lgu?.isActive && <div className="badge badge-sm badge-error">Inactive</div>}
          </div>
        </div>
      </div>
    </article>
  );
});
