import { Building, MapPin } from "lucide-react";

export default function QuickStats({ filteredLgus }) {
  const stats = {
    total: filteredLgus.length,
    cities: filteredLgus.filter((p) => (p.classification || "").toLowerCase().includes("city")).length,
    municipalities: filteredLgus.filter((p) => (p.classification || "").toLowerCase().includes("municipality")).length,
    provinces: filteredLgus.filter((p) => (p.classification || "").toLowerCase().includes("province")).length
  };

  const items = [
    { label: "Total LGUs", value: stats.total, icon: Building, color: "bg-blue-500" },
    { label: "Cities", value: stats.cities, icon: Building, color: "bg-green-500" },
    { label: "Municipalities", value: stats.municipalities, icon: Building, color: "bg-purple-500" },
    { label: "Provinces", value: stats.provinces, icon: MapPin, color: "bg-orange-500" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {items.map((stat, idx) => (
        <div key={idx} className="bg-gradient-to-br from-white/80 to-base-100/60 border border-base-200 rounded-2xl shadow-sm hover:shadow-xl">
          <div className="card-body p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-base-content/70">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.color} bg-opacity-15`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
