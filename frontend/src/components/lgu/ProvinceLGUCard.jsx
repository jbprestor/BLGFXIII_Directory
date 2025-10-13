// src/components/lgu/ProvinceLguCard.jsx
import React from "react";
import { Building } from "lucide-react";
import LguIcon from "../common/LguIcon.jsx";

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

  // Safe image URL helper
  const toSafeImageUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;
    if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) return url;
    return `https://via.placeholder.com/400x400?text=${encodeURIComponent(String(url).replace(/[?#].*$/, ''))}`;
  };

  const iconName = (() => {
    const cls = (lgu?.classification || '').toLowerCase();
    if (cls.includes('province')) return 'province';
    if (cls.includes('city')) return 'city';
    if (cls.includes('municipality')) return 'municipality';
    return 'default';
  })();

  return (
    <article
      role="button"
      onClick={onClick}
      className={`group relative ${cardBaseClasses} ${cardAccentRing} overflow-hidden ${typeBorder} focus:outline-none focus:ring-2 focus:ring-primary/30`}
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

      <div className="flex flex-col">
        {/* Centered logo */}
        <div className="w-full py-6 flex items-center justify-center bg-base-100">
          {/* Icon on xs to save bandwidth, image on sm+ */}
          <div className="sm:hidden w-14 h-14 rounded-full bg-base-200 flex items-center justify-center border border-base-300">
            <LguIcon name={iconName} className="w-8 h-8 text-base-content/40" />
          </div>

          <div className="hidden sm:flex w-40 h-40 overflow-hidden bg-base-200 items-center justify-center border border-base-300 rounded-full transition-all duration-300 group-hover:shadow-md">
            <img
              src={toSafeImageUrl(candidates[0])}
              alt={`${lgu?.name || "LGU"} logo`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const current = e.currentTarget;
                const idx = candidates.indexOf(current.src);
                const next = (idx >= 0 && candidates[idx + 1]) ? toSafeImageUrl(candidates[idx + 1]) : PLACEHOLDER_IMAGE;
                current.onerror = null;
                current.src = next;
              }}
              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Details section with subtle separator */}
        <div className="p-4 text-center border-t border-base-200 bg-base-100/50">
          <h4 className="font-semibold text-lg text-base-content group-hover:text-primary transition-colors duration-300">
            {lgu?.name}
          </h4>
          <p className="text-sm text-base-content/70 capitalize mt-1.5">{lgu?.classification}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {lgu?.incomeClass && (
              <div className="badge badge-outline group-hover:badge-primary transition-all duration-300">
                {lgu.incomeClass}
              </div>
            )}
            {!lgu?.isActive && (
              <div className="badge badge-error">
                Inactive
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});
