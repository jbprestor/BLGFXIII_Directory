export default function QuickStats({ directory }) {
  const stats = {
    total: directory.length,
    cities: directory.filter(p => p.lguType === "City").length,
    municipalities: directory.filter(p => p.lguType === "Municipality").length,
    provinces: directory.filter(p => p.lguType === "Province").length,
    male: directory.filter(p => p.sex === "Male").length,
    female: directory.filter(p => p.sex === "Female").length,
    other: directory.filter(p => p.sex === "Other").length,
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 py-2 min-w-max">
        {Object.entries(stats).map(([key, value]) => (
          <StatCard
            key={key}
            title={key.charAt(0).toUpperCase() + key.slice(1)}
            value={value}
            desc={getDesc(key)}
            color={getColor(key)}
          />
        ))}
      </div>
    </div>
  );
}

function getDesc(key) {
  switch (key) {
    case "total": return "Registered in system";
    case "cities": return "Personnel in cities";
    case "municipalities": return "Personnel in municipalities";
    case "provinces": return "Personnel in provinces";
    case "male": return "Male personnel";
    case "female": return "Female personnel";
    case "other": return "Other gender";
    default: return "";
  }
}

function getColor(key) {
  switch (key) {
    case "total": return "text-primary";
    case "cities": return "text-secondary";
    case "municipalities": return "text-accent";
    case "provinces": return "text-warning";
    case "male": return "text-info";
    case "female": return "text-pink-500";
    case "other": return "text-purple-500";
    default: return "text-base-content";
  }
}

function StatCard({ title, value, desc, color }) {
  return (
    <div className="stat border border-base-300 bg-base-100 p-4 rounded-lg min-w-[140px]">
      <div className={`stat-title text-xs md:text-sm ${color}`}>{title}</div>
      <div className={`stat-value text-lg md:text-2xl ${color}`}>{value}</div>
      <div className="stat-desc text-xs">{desc}</div>
    </div>
  );
}
