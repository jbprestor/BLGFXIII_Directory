// components/QuickStats.jsx
export default function QuickStats({ directory }) {
  const stats = {
    total: directory.length,
    cities: directory.filter((p) => p.lguType === "City").length,
    municipalities: directory.filter((p) => p.lguType === "Municipality")
      .length,
    provinces: directory.filter((p) => p.lguType === "Province").length,
  };

  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow w-full border border-base-300 bg-base-100 overflow-hidden">
      {/* Total Personnel */}
      <div className="stat border-base-300">
        <div className="stat-figure text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 opacity-75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </div>
        <div className="stat-title text-xs md:text-sm">Total Personnel</div>
        <div className="stat-value text-primary text-lg md:text-2xl">
          {stats.total}
        </div>
        <div className="stat-desc text-xs">Registered in system</div>
      </div>

      {/* Cities */}
      <div className="stat border-base-300">
        <div className="stat-figure text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 opacity-75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
            />
          </svg>
        </div>
        <div className="stat-title text-xs md:text-sm">Cities</div>
        <div className="stat-value text-secondary text-lg md:text-2xl">
          {stats.cities}
        </div>
        <div className="stat-desc text-xs">Personnel in cities</div>
      </div>

      {/* Municipalities */}
      <div className="stat border-base-300">
        <div className="stat-figure text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 opacity-75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1.096M4.5 9.755L8.25 12m11.25-2.245l-3-1.096"
            />
          </svg>
        </div>
        <div className="stat-title text-xs md:text-sm">Municipalities</div>
        <div className="stat-value text-accent text-lg md:text-2xl">
          {stats.municipalities}
        </div>
        <div className="stat-desc text-xs">Personnel in municipalities</div>
      </div>

      {/* Provinces */}
      <div className="stat">
        <div className="stat-figure text-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 opacity-75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
            />
          </svg>
        </div>
        <div className="stat-title text-xs md:text-sm">Provinces</div>
        <div className="stat-value text-warning text-lg md:text-2xl">
          {stats.provinces}
        </div>
        <div className="stat-desc text-xs">Personnel in provinces</div>
      </div>
    </div>
  );
}
