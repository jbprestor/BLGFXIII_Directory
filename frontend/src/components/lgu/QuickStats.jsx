import { Building, MapPin, TrendingUp, Calendar } from "lucide-react";

export default function QuickStats({ filteredLgus }) {
  const stats = {
    total: filteredLgus.length,
    cities: filteredLgus.filter((p) => (p.classification || "").toLowerCase().includes("city")).length,
    municipalities: filteredLgus.filter((p) => (p.classification || "").toLowerCase().includes("municipality")).length,
    provinces: filteredLgus.filter((p) => (p.classification || "").toLowerCase().includes("province")).length,
    conducting2025: filteredLgus.filter((p) => p.existingSMV?.conductingRevision2025 === true).length,
    completed: filteredLgus.filter((p) => p.currentSMVStatus === "Completed" || p.currentSMVStatus === "Implemented").length,
    inProgress: filteredLgus.filter((p) => 
      p.currentSMVStatus && 
      p.currentSMVStatus !== "No Revision" && 
      p.currentSMVStatus !== "Completed" && 
      p.currentSMVStatus !== "Implemented"
    ).length,
    noRevision: filteredLgus.filter((p) => !p.currentSMVStatus || p.currentSMVStatus === "No Revision").length
  };

  const items = [
    { label: "Total LGUs", value: stats.total, icon: Building, color: "bg-primary" },
    { label: "2025 Revision", value: stats.conducting2025, icon: Calendar, color: "bg-success" },
    { label: "SMV Completed", value: stats.completed, icon: TrendingUp, color: "bg-success" },
    { label: "SMV In Progress", value: stats.inProgress, icon: TrendingUp, color: "bg-warning" },
    { label: "No SMV Revision", value: stats.noRevision, icon: Building, color: "bg-neutral" },
    { label: "Cities", value: stats.cities, icon: Building, color: "bg-secondary" },
    { label: "Municipalities", value: stats.municipalities, icon: Building, color: "bg-info" },
    { label: "Provinces", value: stats.provinces, icon: MapPin, color: "bg-accent" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
      {items.map((stat, idx) => (
        <div key={idx} className="bg-gradient-to-br from-white/80 to-base-100/60 border border-base-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200">
          <div className="card-body p-4 flex flex-col items-center text-center">
            <div className={`p-3 rounded-full ${stat.color} bg-opacity-15 mb-2`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-base-content/70">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
