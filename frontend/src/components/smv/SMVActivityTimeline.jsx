import { useMemo } from "react";

export default function SMVActivityTimeline({ tableData }) {
  // Calculate stage durations and status
  const stageAnalytics = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    const stages = [
      "Preparatory",
      "Data Collection", 
      "Data Analysis",
      "Preparation of Proposed SMV",
      "Valuation Testing",
      "Finalization"
    ];

    return stages.map(stageName => {
      const stageData = tableData.flatMap(lgu => 
        lgu.stageMap?.[stageName] || []
      );

      const completed = stageData.filter(a => a.status === "Completed");
      const inProgress = stageData.filter(a => a.status === "In Progress");
      const notStarted = stageData.filter(a => a.status === "Not Started");

      // Calculate average days to complete (if dateCompleted exists)
      const completedWithDates = completed.filter(a => a.dateCompleted);
      const avgDaysToComplete = completedWithDates.length > 0
        ? Math.round(
            completedWithDates.reduce((sum, a) => {
              const start = new Date(a.dateCompleted);
              const days = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
              return sum + days;
            }, 0) / completedWithDates.length
          )
        : null;

      // Get earliest and latest completion dates
      const dates = completedWithDates
        .map(a => new Date(a.dateCompleted))
        .sort((a, b) => a - b);

      return {
        name: stageName,
        completed: completed.length,
        inProgress: inProgress.length,
        notStarted: notStarted.length,
        total: stageData.length,
        completionRate: stageData.length > 0 
          ? Math.round((completed.length / stageData.length) * 100) 
          : 0,
        avgDaysToComplete,
        earliestCompletion: dates[0],
        latestCompletion: dates[dates.length - 1],
      };
    });
  }, [tableData]);

  // Calculate overall timeline
  const overallTimeline = useMemo(() => {
    if (!tableData || tableData.length === 0) return null;

    const allActivities = tableData.flatMap(lgu => 
      Object.values(lgu.stageMap || {}).flat()
    );

    const completedActivities = allActivities.filter(
      a => a.status === "Completed" && a.dateCompleted
    );

    if (completedActivities.length === 0) return null;

    const dates = completedActivities
      .map(a => new Date(a.dateCompleted))
      .sort((a, b) => a - b);

    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const daysSpan = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24));

    return {
      startDate: earliest,
      endDate: latest,
      daysSpan,
      totalActivities: allActivities.length,
      completedActivities: completedActivities.length,
      completionRate: Math.round((completedActivities.length / allActivities.length) * 100),
    };
  }, [tableData]);

  return (
    <div className="space-y-6">
      {/* Overall Timeline Summary */}
      {overallTimeline && (
        <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
          <div className="card-body p-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Overall Timeline Progress
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div className="stat bg-base-100 rounded-lg p-3 shadow-sm">
                <div className="stat-title text-xs">Started</div>
                <div className="stat-value text-lg text-success">
                  {overallTimeline.startDate.toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  })}
                </div>
              </div>
              <div className="stat bg-base-100 rounded-lg p-3 shadow-sm">
                <div className="stat-title text-xs">Latest Activity</div>
                <div className="stat-value text-lg text-info">
                  {overallTimeline.endDate.toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  })}
                </div>
              </div>
              <div className="stat bg-base-100 rounded-lg p-3 shadow-sm">
                <div className="stat-title text-xs">Duration</div>
                <div className="stat-value text-lg text-warning">
                  {overallTimeline.daysSpan} days
                </div>
              </div>
              <div className="stat bg-base-100 rounded-lg p-3 shadow-sm">
                <div className="stat-title text-xs">Completion</div>
                <div className="stat-value text-lg text-primary">
                  {overallTimeline.completionRate}%
                </div>
                <div className="stat-desc text-xs mt-1">
                  {overallTimeline.completedActivities} / {overallTimeline.totalActivities} activities
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage-by-Stage Analytics */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4">
          <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Stage-by-Stage Progress
          </h3>
          
          <div className="space-y-3 mt-4">
            {stageAnalytics.map((stage, idx) => (
              <div key={stage.name} className="border border-base-300 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`badge badge-sm ${
                      stage.completionRate === 100 ? 'badge-success' :
                      stage.completionRate >= 75 ? 'badge-info' :
                      stage.completionRate >= 50 ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {idx + 1}
                    </div>
                    <h4 className="font-semibold text-sm">{stage.name}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-base-content/60">
                      {stage.completed} / {stage.total} LGUs
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {stage.completionRate}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-base-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      stage.completionRate === 100 ? 'bg-success' :
                      stage.completionRate >= 75 ? 'bg-info' :
                      stage.completionRate >= 50 ? 'bg-warning' :
                      'bg-error'
                    }`}
                    style={{ width: `${stage.completionRate}%` }}
                  ></div>
                </div>

                {/* Status Breakdown */}
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-base-content/70">
                      {stage.completed} Completed
                    </span>
                  </div>
                  {stage.inProgress > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                      <span className="text-base-content/70">
                        {stage.inProgress} In Progress
                      </span>
                    </div>
                  )}
                  {stage.notStarted > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-base-300"></div>
                      <span className="text-base-content/70">
                        {stage.notStarted} Not Started
                      </span>
                    </div>
                  )}
                </div>

                {/* Timeline Info */}
                {stage.earliestCompletion && stage.latestCompletion && (
                  <div className="mt-2 pt-2 border-t border-base-300">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-base-content/60">First completed: </span>
                        <span className="font-semibold">
                          {stage.earliestCompletion.toLocaleDateString('en-US', { 
                            month: 'short', year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-base-content/60">Last completed: </span>
                        <span className="font-semibold">
                          {stage.latestCompletion.toLocaleDateString('en-US', { 
                            month: 'short', year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {(!tableData || tableData.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-semibold">No Activity Data Available</p>
          <p className="text-sm">Start tracking activities to see timeline analytics</p>
        </div>
      )}
    </div>
  );
}
