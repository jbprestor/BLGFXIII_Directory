import React, { useState, useEffect } from "react";
import { useLGUImages } from "../../assets/LguImages";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Manila",
    }).format(date);
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(word => !["del", "de", "the", "City", "Province", "Municipality", "Sur", "Norte"].includes(word))
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 3) || name.slice(0, 2).toUpperCase();
}

const RANK_CONFIG = [
  { medal: "🥇", gradient: "from-yellow-400 to-amber-500", ring: "ring-yellow-400/40", text: "text-amber-700 dark:text-amber-300", bg: "bg-yellow-50 dark:bg-yellow-500/10", border: "border-yellow-200 dark:border-yellow-500/30" },
  { medal: "🥈", gradient: "from-slate-300 to-slate-400", ring: "ring-slate-400/40", text: "text-slate-700 dark:text-slate-300", bg: "bg-slate-50 dark:bg-slate-500/10", border: "border-slate-200 dark:border-slate-500/30" },
  { medal: "🥉", gradient: "from-orange-400 to-amber-600", ring: "ring-orange-400/40", text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/30" },
];

const CONGRATULATORY_MESSAGES = [
  "Setting the standard for excellence in QRRPA reporting! Your commitment to timely and accurate property assessment data is commendable.",
  "Congratulations on being a leader in RPU data submission! Your efficiency in completing the QRRPA requirements is truly impressive.",
  "Exemplary performance in Real Property Assessment monitoring! Your early QRRPA submission demonstrates proactive local administration.",
  "A benchmark for QRRPA compliance! Thank you for your dedication to maintaining the integrity of regional assessment records.",
  "Outstanding achievement in QRRPA submission! Your LGU leads the way in transparent and efficient property assessment reporting."
];

function CongratulatoryBanner({ topProvince, topCity, topMunicipality }) {
  const lguImages = useLGUImages();
  
  const performers = React.useMemo(() => {
    const list = [];
    if (topProvince) list.push({ type: "Top Performing Province", name: topProvince, tagColor: "#10b981", gradient: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" });
    if (topCity) list.push({ type: "Top Performing City", name: topCity, tagColor: "#f59e0b", gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)" });
    if (topMunicipality) list.push({ type: "Top Performing Municipality", name: topMunicipality, tagColor: "#ec4899", gradient: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)" });
    return list;
  }, [topProvince, topCity, topMunicipality]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [logoErrors, setLogoErrors] = useState({});

  const handleLogoError = (name) => {
    setLogoErrors(prev => ({ ...prev, [name]: true }));
  };

  useEffect(() => {
    const shuffled = [...CONGRATULATORY_MESSAGES].sort(() => 0.5 - Math.random());
    setMessages(performers.map((_, i) => shuffled[i % shuffled.length]));
  }, [performers.length]);

  useEffect(() => {
    if (performers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % performers.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [performers.length]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? performers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % performers.length);
  };

  if (performers.length === 0) return null;

  return (
    <div className="relative mb-8 w-full overflow-hidden rounded-3xl shadow-xl border border-black/5 dark:border-white/10">
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {performers.map((perf, index) => {
          const logoUrl = lguImages[perf.name];
          return (
            <div 
              key={perf.name}
              className="w-full shrink-0 relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-10 group"
              style={{
                background: perf.gradient,
                color: "#ffffff"
              }}
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              </div>
              
              <div className="relative shrink-0 flex items-center justify-center z-10 w-24 h-24 sm:w-28 sm:h-28">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                {logoUrl && !logoErrors[perf.name] ? (
                  <img 
                    src={logoUrl} 
                    alt={`${perf.name} logo`} 
                    className="w-full h-full object-contain relative z-10 drop-shadow-xl hover:scale-105 transition-transform duration-300 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-sm p-1"
                    onError={() => handleLogoError(perf.name)}
                  />
                ) : (
                  <div className="w-full h-full rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center relative z-10 shadow-inner group-hover:scale-105 transition-transform">
                    <span className="text-3xl sm:text-4xl font-black tracking-tighter text-white drop-shadow-md">
                      {getInitials(perf.name)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left relative z-10">
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 tracking-widest text-[10px] sm:text-xs font-bold uppercase shadow-sm rounded-full"
                  style={{ backgroundColor: perf.tagColor, color: '#ffffff' }}
                >
                  <svg className="w-3.5 h-3.5 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {perf.type}
                </span>
                <h2 
                  className="tracking-tighter drop-shadow-2xl mb-4 sm:mb-6" 
                  style={{ 
                    color: '#ffffff', 
                    fontSize: 'clamp(2.5rem, 10vw, 6rem)', 
                    fontWeight: 950,
                    lineHeight: '1.05',
                    paddingBottom: '0.15em',
                    textShadow: '0 10px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  {perf.name}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg font-medium max-w-2xl leading-relaxed italic relative z-10" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  "{messages[index] || CONGRATULATORY_MESSAGES[0]}"
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {performers.length > 1 && (
        <>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {performers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "bg-white w-6 opacity-100" : "bg-white/50 opacity-60 hover:opacity-100 hover:bg-white"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          
          <button 
            onClick={handlePrev} 
            className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-30 opacity-0 cursor-pointer"
            aria-label="Previous LGU"
          />
          <button 
            onClick={handleNext} 
            className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-30 opacity-0 cursor-pointer"
            aria-label="Next LGU"
          />
        </>
      )}
    </div>
  );
}

function getRankConfig(i) {
  return RANK_CONFIG[i] ?? { medal: `#${i + 1}`, gradient: "from-primary to-secondary", ring: "ring-primary/30", text: "text-base-content", bg: "bg-base-200", border: "border-base-300" };
}

const KNOWN_MUNICIPALITIES_COUNT = {
  "Agusan del Sur": 13,
  "Agusan del Norte": 9,
  "Surigao del Norte": 20,
  "Surigao del Sur": 17,
  "Dinagat Islands": 7,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function QrrpaOverview({ records = [] }) {
  // Period filter states (synced with localStorage)
  const [selectedYear, setSelectedYear] = useState(() => {
    return localStorage.getItem('qrrpa-year') || "2025";
  });
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    return localStorage.getItem('qrrpa-quarter') || "Q3";
  });

  // Calculate dynamic year options
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2025; y <= currentYear; y++) {
      years.push(y.toString());
    }
    return years;
  };
  const yearOptions = getYearOptions();

  const quarterOptions = [
    { value: "Q1", label: "Q1 (Jan-Mar)" },
    { value: "Q2", label: "Q2 (Apr-Jun)" },
    { value: "Q3", label: "Q3 (Jul-Sep)" },
    { value: "Q4", label: "Q4 (Oct-Dec)" }
  ];

  const handleYearChange = (e) => {
    const val = e.target.value;
    setSelectedYear(val);
    localStorage.setItem('qrrpa-year', val);
  };

  const handleQuarterChange = (e) => {
    const val = e.target.value;
    setSelectedQuarter(val);
    localStorage.setItem('qrrpa-quarter', val);
  };

  // Filter records by period
  const currentPeriod = `${selectedYear}-${selectedQuarter}`;
  const periodRecords = records.filter(r => r.period === currentPeriod);

  // Submitted records correctly transformed
  const submittedRecords = periodRecords
    .filter((r) => r.status === "Submitted" && r.dateSubmitted)
    .map((r) => ({
      ...r,
      lguName: r.lguId?.name || r.lguName || "Unknown LGU",
      province: r.lguId?.province || r.province || "Unknown Province",
      classification: r.lguId?.classification || r.classification || "Unknown",
      submissionDate: new Date(r.dateSubmitted),
    }))
    .sort((a, b) => a.submissionDate - b.submissionDate);

  // 1. Top 3 Municipalities
  const topMunicipalitiesObj = [...submittedRecords]
    .filter((r) => r.classification?.toLowerCase() === "municipality")
    .reduce((acc, r) => {
      if (!acc[r.lguName]) acc[r.lguName] = r;
      return acc;
    }, {});
  const municipalityList = Object.values(topMunicipalitiesObj)
    .sort((a, b) => a.submissionDate - b.submissionDate)
    .slice(0, 3);

  // 2. Top 3 Cities
  const topCitiesObj = [...submittedRecords]
    .filter((r) => r.classification?.toLowerCase().includes("city"))
    .reduce((acc, r) => {
      if (!acc[r.lguName]) acc[r.lguName] = r;
      return acc;
    }, {});
  const cityList = Object.values(topCitiesObj)
    .sort((a, b) => a.submissionDate - b.submissionDate)
    .slice(0, 3);

  // 3. Province Stats & Top 3 Provinces (100% Submission)
  const provinceStats = periodRecords.reduce((acc, record) => {
    const province = record.province || record.lguId?.province || "Unknown Province";
    const classification = record.classification || record.lguId?.classification || "";
    const isMunicipality = classification === "Municipality";

    if (!acc[province]) {
      acc[province] = {
        total: KNOWN_MUNICIPALITIES_COUNT[province] || 0,
        submitted: 0,
        lastSubmissionDate: null,
      };
    }
    if (isMunicipality && record.status === "Submitted" && record.dateSubmitted) {
      acc[province].submitted++;
      const d = new Date(record.dateSubmitted);
      if (!acc[province].lastSubmissionDate || d > acc[province].lastSubmissionDate) {
        acc[province].lastSubmissionDate = d;
      }
    }
    return acc;
  }, {});

  const allProvinces = Object.entries(provinceStats)
    .map(([province, stats]) => ({
      province,
      total: stats.total,
      submitted: stats.submitted,
      lastDate: stats.lastSubmissionDate,
      pct: stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0,
      isComplete: stats.submitted >= stats.total && stats.submitted > 0,
    }));

  const completedProvinces = allProvinces
    .filter(p => p.isComplete)
    .sort((a, b) => a.lastDate - b.lastDate);

  const top3Provinces = completedProvinces.slice(0, 3);
  const top1ProvinceName = top3Provinces.length > 0 ? top3Provinces[0].province : null;
  const top1CityName = cityList.length > 0 ? cityList[0].lguName : null;
  const top1MunicipalityName = municipalityList.length > 0 ? municipalityList[0].lguName : null;

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* ── Congratulatory Hero Banner ── */}
      {(top1ProvinceName || top1CityName || top1MunicipalityName) && (
        <CongratulatoryBanner 
          topProvince={top1ProvinceName} 
          topCity={top1CityName} 
          topMunicipality={top1MunicipalityName} 
        />
      )}

      {/* ── Header Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold text-base-content text-sm sm:text-base">Filter Submissions by Period</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            value={selectedYear} 
            onChange={handleYearChange}
            className="select select-bordered select-sm w-full sm:w-32 bg-base-100 font-medium"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={selectedQuarter} 
            onChange={handleQuarterChange}
            className="select select-bordered select-sm w-full sm:w-40 bg-base-100 font-medium"
          >
            {quarterOptions.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Top 3 Boards (Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* 1. Top 3 Provinces */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-base-200 bg-base-200/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base-content text-lg">Top 3 Provinces</h3>
              <p className="text-xs text-base-content/50 font-medium">First to complete all municipalities</p>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            {top3Provinces.length > 0 ? (
              top3Provinces.map((p, i) => {
                const cfg = getRankConfig(i);
                return (
                  <div key={p.province} className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.border} ${cfg.bg} transition-transform hover:scale-[1.02]`}>
                    <div className="text-3xl shrink-0 w-10 text-center drop-shadow-sm">{cfg.medal}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base-content text-base truncate">{p.province}</p>
                      <p className={`text-xs font-semibold ${cfg.text} truncate`}>{p.total} Municipalities</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-base-content/80">{formatDate(p.lastDate)}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full mt-1">
                        100% Done
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-base-content/40 py-10">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm font-semibold">No finished provinces yet</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Top 3 Cities */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-base-200 bg-base-200/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10l9-7 9 7v11a1 1 0 01-1 1h-5a1 1 0 01-1-1v-4H9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V10z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base-content text-lg">Top 3 Cities</h3>
              <p className="text-xs text-base-content/50 font-medium">Earliest city submissions</p>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            {cityList.length > 0 ? (
              cityList.map((record, i) => {
                const cfg = getRankConfig(i);
                return (
                  <div key={record.lguName} className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.border} ${cfg.bg} transition-transform hover:scale-[1.02]`}>
                    <div className="text-3xl shrink-0 w-10 text-center drop-shadow-sm">{cfg.medal}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base-content text-base truncate">{record.lguName}</p>
                      <p className={`text-xs font-semibold ${cfg.text} truncate`}>{record.province}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-base-content/80">{formatDate(record.submissionDate)}</p>
                      <p className="text-[10px] text-base-content/40 font-medium mt-1">Submission Date</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-base-content/40 py-10">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm font-semibold">No cities have submitted yet</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Top 3 Municipalities */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-base-200 bg-base-200/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base-content text-lg">Top 3 Municipalities</h3>
              <p className="text-xs text-base-content/50 font-medium">Earliest municipality submissions</p>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            {municipalityList.length > 0 ? (
              municipalityList.map((record, i) => {
                const cfg = getRankConfig(i);
                return (
                  <div key={record.lguName} className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.border} ${cfg.bg} transition-transform hover:scale-[1.02]`}>
                    <div className="text-3xl shrink-0 w-10 text-center drop-shadow-sm">{cfg.medal}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base-content text-base truncate">{record.lguName}</p>
                      <p className={`text-xs font-semibold ${cfg.text} truncate`}>{record.province}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-base-content/80">{formatDate(record.submissionDate)}</p>
                      <p className="text-[10px] text-base-content/40 font-medium mt-1">Submission Date</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-base-content/40 py-10">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm font-semibold">No municipalities submitted yet</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
