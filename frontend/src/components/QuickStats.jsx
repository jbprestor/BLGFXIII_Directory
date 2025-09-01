// components/QuickStats.js
export default function QuickStats({ directory }) {
  const stats = {
    total: directory.length,
    cities: directory.filter(p => p.lguType === 'City').length,
    municipalities: directory.filter(p => p.lguType === 'Municipality').length,
    provinces: directory.filter(p => p.lguType === 'Province').length,
  };

  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow w-full border border-base-300 text-xs sm:text-sm">
      <div className="stat border-base-300">
        <div className="stat-title">Total Personnel</div>
        <div className="stat-value text-primary text-lg sm:text-2xl">{stats.total}</div>
        <div className="stat-desc">Registered in system</div>
      </div>

      <div className="stat border-base-300">
        <div className="stat-title">Cities</div>
        <div className="stat-value text-secondary text-lg sm:text-2xl">{stats.cities}</div>
        <div className="stat-desc">Personnel in cities</div>
      </div>

      <div className="stat border-base-300">
        <div className="stat-title">Municipalities</div>
        <div className="stat-value text-accent text-lg sm:text-2xl">{stats.municipalities}</div>
        <div className="stat-desc">Personnel in municipalities</div>
      </div>

      <div className="stat">
        <div className="stat-title">Provinces</div>
        <div className="stat-value text-warning text-lg sm:text-2xl">{stats.provinces}</div>
        <div className="stat-desc">Personnel in provinces</div>
      </div>
    </div>
  );
}