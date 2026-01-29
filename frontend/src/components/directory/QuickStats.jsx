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
    <div className="w-full">
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(stats).map(([key, value]) => (
          <StatCard
            key={key}
            title={key.charAt(0).toUpperCase() + key.slice(1)}
            value={value}
            color={getColor(key)}
          />
        ))}
      </div>
    </div>
  );
}

function getColor(key) {
  switch (key) {
    case "total": return "text-primary";
    case "cities": return "text-secondary";
    case "municipalities": return "text-accent";
    case "provinces": return "text-warning";
    case "male": return "text-info";
    case "female": return "text-pink-500";
    case "other": return "text-base-content";
    default: return "text-base-content";
  }
}

function StatCard({ title, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center border border-base-200 bg-base-100 px-3 py-2 rounded-lg shadow-sm flex-1 min-w-[80px]">
      <div className={`text-[10px] w-full text-center uppercase tracking-wide opacity-70`}>{title}</div>
      <div className={`text-xl font-bold leading-none mt-1 ${color}`}>{value}</div>
    </div>
  );
}
