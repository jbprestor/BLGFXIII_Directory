// src/components/lgu/ProvinceDetail.jsx
import React from "react";
import ProvinceLguCard from "./ProvinceLGUCard.jsx";
import { ChevronLeft } from "lucide-react";

/**
 * ProvinceDetail — extracted from LGUPage
 * Props:
 *  - selectedProvince: string
 *  - provinces: object (grouped)
 *  - getCandidatesFor, PLACEHOLDER_IMAGE, cardBaseClasses, cardAccentRing
 *  - getTypeBorder
 *  - onOpenLgu(id)
 *  - onBack()
 */
export default React.memo(function ProvinceDetail({
  selectedProvince,
  provinces,
  getCandidatesFor,
  PLACEHOLDER_IMAGE,
  cardBaseClasses,
  cardAccentRing,
  getTypeBorder,
  onOpenLgu,
  onBack
}) {
  if (!selectedProvince) return null;
  const provinceLgus = provinces[selectedProvince] || [];
  const cities = provinceLgus.filter(l => (l.classification || "").toLowerCase().includes("city"));
  const municipalities = provinceLgus.filter(l => (l.classification || "").toLowerCase().includes("municipality"));
  const others = provinceLgus.filter(l => !/city|municipality/i.test(l.classification || ""));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" /> All Provinces
        </button>

        <div className="text-sm text-base-content/50">
          <span className="cursor-pointer hover:underline" onClick={onBack}>All Provinces</span>
          <span className="mx-2">/</span>
          <span className="font-semibold">{selectedProvince}</span>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold">{selectedProvince}</h2>
          <p className="text-base-content/60">{provinceLgus.length || 0} LGU{provinceLgus.length !== 1 ? "s" : ""} in this province</p>
        </div>
      </div>

      <div className="space-y-6">
        {others.length > 0 && (
          <section>
            <h3 className="text-xl font-bold mb-2">Province</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {others.map((l) => (
                <ProvinceLguCard
                  key={l._id || l.id}
                  lgu={l}
                  onClick={() => onOpenLgu(l._id || l.id)}
                  getCandidatesFor={getCandidatesFor}
                  PLACEHOLDER_IMAGE={PLACEHOLDER_IMAGE}
                  cardBaseClasses={cardBaseClasses}
                  cardAccentRing={cardAccentRing}
                  getTypeBorder={getTypeBorder}
                />
              ))}
            </div>
          </section>
        )}

        {cities.length > 0 && (
          <section>
            <h3 className="text-xl font-bold mb-2">Cities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((l) => (
                <ProvinceLguCard
                  key={l._id || l.id}
                  lgu={l}
                  onClick={() => onOpenLgu(l._id || l.id)}
                  getCandidatesFor={getCandidatesFor}
                  PLACEHOLDER_IMAGE={PLACEHOLDER_IMAGE}
                  cardBaseClasses={cardBaseClasses}
                  cardAccentRing={cardAccentRing}
                  getTypeBorder={getTypeBorder}
                />
              ))}
            </div>
          </section>
        )}

        {municipalities.length > 0 && (
          <section>
            <h3 className="text-xl font-bold mb-2">Municipalities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {municipalities.map((l) => (
                <ProvinceLguCard
                  key={l._id || l.id}
                  lgu={l}
                  onClick={() => onOpenLgu(l._id || l.id)}
                  getCandidatesFor={getCandidatesFor}
                  PLACEHOLDER_IMAGE={PLACEHOLDER_IMAGE}
                  cardBaseClasses={cardBaseClasses}
                  cardAccentRing={cardAccentRing}
                  getTypeBorder={getTypeBorder}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
});
