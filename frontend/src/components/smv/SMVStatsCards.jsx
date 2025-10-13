import { useMemo } from "react";

export default function SMVStatsCards({ tableData, loading }) {
  const stats = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return {
        totalLGUs: 0,
        avgCompletion: 0,
        onTrack: 0,
        atRisk: 0,
        delayed: 0,
        overdue: 0,
        avgDaysElapsed: 0,
        mostAdvanced: null,
        leastAdvanced: null,
      };
    }

    const total = tableData.length;
    const totalPercent = tableData.reduce((sum, row) => sum + row.totalPercent, 0);
    const avgCompletion = Math.round(totalPercent / total);

    // Compliance breakdown
    const compliance = {
      onTrack: tableData.filter(r => r.complianceStatus === "On Track").length,
      atRisk: tableData.filter(r => r.complianceStatus === "At Risk").length,
      delayed: tableData.filter(r => r.complianceStatus === "Delayed").length,
      overdue: tableData.filter(r => r.complianceStatus === "Overdue").length,
    };

    // Average days elapsed
    const daysElapsedArr = tableData
      .filter(r => r.daysElapsed !== undefined)
      .map(r => r.daysElapsed);
    const avgDaysElapsed = daysElapsedArr.length > 0
      ? Math.round(daysElapsedArr.reduce((sum, d) => sum + d, 0) / daysElapsedArr.length)
      : 0;

    // Most/Least advanced
    const sorted = [...tableData].sort((a, b) => b.totalPercent - a.totalPercent);
    const mostAdvanced = sorted[0];
    const leastAdvanced = sorted[sorted.length - 1];

    return {
      totalLGUs: total,
      avgCompletion,
      ...compliance,
      avgDaysElapsed,
      mostAdvanced,
      leastAdvanced,
    };
  }, [tableData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-box"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total LGUs Card */}
      <div className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="text-3xl">🏛️</div>
            <div className="text-right">
              <p className="text-xs opacity-80 uppercase font-semibold">Total LGUs</p>
              <h2 className="text-4xl font-bold">{stats.totalLGUs}</h2>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs opacity-80">Provinces & Cities Monitored</div>
          </div>
        </div>
      </div>

      {/* Average Completion Card */}
      <div className="card bg-gradient-to-br from-success to-success-focus text-success-content shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="text-3xl">📊</div>
            <div className="text-right">
              <p className="text-xs opacity-80 uppercase font-semibold">Avg. Completion</p>
              <h2 className="text-4xl font-bold">{stats.avgCompletion}%</h2>
            </div>
          </div>
          <div className="mt-2">
            <progress 
              className="progress progress-success-content w-full h-2" 
              value={stats.avgCompletion} 
              max="100"
            ></progress>
          </div>
        </div>
      </div>

      {/* Compliance Status Card */}
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">⚡</div>
            <div className="text-right">
              <p className="text-xs text-base-content/70 uppercase font-semibold">Compliance</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                On Track
              </span>
              <span className="font-bold text-success">{stats.onTrack}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning"></span>
                At Risk
              </span>
              <span className="font-bold text-warning">{stats.atRisk}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Delayed
              </span>
              <span className="font-bold text-orange-500">{stats.delayed}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                Overdue
              </span>
              <span className="font-bold text-error">{stats.overdue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="card bg-gradient-to-br from-info to-info-focus text-info-content shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="text-3xl">⏱️</div>
            <div className="text-right">
              <p className="text-xs opacity-80 uppercase font-semibold">Avg. Days</p>
              <h2 className="text-4xl font-bold">{stats.avgDaysElapsed}</h2>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs opacity-80">Average Days Since Start</div>
          </div>
        </div>
      </div>

      {/* Most Advanced LGU (Spanning) */}
      {stats.mostAdvanced && (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 sm:col-span-2">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏆</div>
              <div className="flex-1">
                <p className="text-xs text-base-content/70 uppercase font-semibold">Most Advanced</p>
                <h3 className="text-lg font-bold text-base-content">{stats.mostAdvanced.lguName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <progress 
                    className="progress progress-success w-32" 
                    value={stats.mostAdvanced.totalPercent} 
                    max="100"
                  ></progress>
                  <span className="text-sm font-bold text-success">{stats.mostAdvanced.totalPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Least Advanced LGU (Spanning) */}
      {stats.leastAdvanced && (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 sm:col-span-2">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <p className="text-xs text-base-content/70 uppercase font-semibold">Needs Attention</p>
                <h3 className="text-lg font-bold text-base-content">{stats.leastAdvanced.lguName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <progress 
                    className="progress progress-error w-32" 
                    value={stats.leastAdvanced.totalPercent} 
                    max="100"
                  ></progress>
                  <span className="text-sm font-bold text-error">{stats.leastAdvanced.totalPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
