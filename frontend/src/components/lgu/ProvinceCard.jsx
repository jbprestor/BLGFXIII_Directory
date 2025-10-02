// ProvinceCard.jsx
import React from "react";

/**
 * ProvinceCard — shows province summary and top LGU preview
 * Props:
 *  - province: string
 *  - provinceLgus: array
 *  - onOpen: () => void
 *  - getCandidatesFor: fn
 *  - PLACEHOLDER_IMAGE, cardBaseClasses, cardAccentRing
 */
export default React.memo(function ProvinceCard({
  province,
  provinceLgus = [],
  onOpen,
  getCandidatesFor,
  PLACEHOLDER_IMAGE,
  cardBaseClasses,
  cardAccentRing
}) {
  const candidates = getCandidatesFor ? getCandidatesFor(province) : [PLACEHOLDER_IMAGE];
  const totalCount = provinceLgus.length;
  const citiesCount = provinceLgus.filter(l => (l.classification || "").toLowerCase().includes("city")).length;
  const municipalitiesCount = provinceLgus.filter(l => (l.classification || "").toLowerCase().includes("municipality")).length;
  const topNames = provinceLgus.slice(0, 5).map(l => l.name);

  return (
    <article
      className={`group relative ${cardBaseClasses} ${cardAccentRing} cursor-pointer`}
      onClick={onOpen}
      aria-label={`Open province ${province}`}
    >
      <div className="card-body p-4 flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden bg-white border flex-shrink-0">
          <img
            src={candidates[0] || PLACEHOLDER_IMAGE}
            alt={`${province} logo`}
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg truncate">{province}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-base-content/60">{totalCount} LGU{totalCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="badge badge-xs badge-primary">{citiesCount} {citiesCount === 1 ? "City" : "Cities"}</span>
            <span className="badge badge-xs badge-secondary">{municipalitiesCount} {municipalitiesCount === 1 ? "Municipality" : "Municipalities"}</span>
          </div>
        </div>
      </div>

      {/* Hover preview overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
        <div className="w-full text-sm text-white/90 bg-black/60 backdrop-blur-sm rounded-md p-3">
          <div className="font-medium">Top LGUs</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {topNames.length === 0 ? <span className="text-xs text-white/80">No LGUs</span> :
              topNames.map((n, i) => <span key={i} className="text-xs px-2 py-1 bg-white/10 rounded">{n}</span>)}
          </div>
        </div>
      </div>
    </article>
  );
});
