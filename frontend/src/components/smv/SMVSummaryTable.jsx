import React from "react";
import SMVProgressBar from "./SMVProgressBar";

/**
 * SMV Summary Table - Simplified & Polished
 * Clean card-based list view with essential information
 * Click to edit timeline for detailed work
 */
export default function SMVSummaryTable({ 
  filteredTableData, 
  stages, 
  isAdmin, 
  onSetTimeline,
  viewMode = "detailed" 
}) {

  // Calculate days from BLGF Notice (Day 0)
  const calculateDaysFromNotice = (timeline) => {
    if (!timeline?.blgfNoticeDate) return null;
    
    const noticeDate = new Date(timeline.blgfNoticeDate);
    const today = new Date();
    const diffTime = today - noticeDate;
    const daysSinceNotice = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return daysSinceNotice;
  };

  // Calculate days until next deadline
  const getNextDeadline = (timeline) => {
    if (!timeline) return null;
    
    const today = new Date();
    const deadlines = [
      { name: "RO Submission", date: timeline.regionalOfficeSubmissionDeadline, priority: 1 },
      { name: "Publication", date: timeline.publicationDeadline, priority: 2 },
      { name: "Public Consultation", date: timeline.publicConsultationDeadline, priority: 3 },
      { name: "Sanggunian", date: timeline.sanggunianSubmissionDeadline, priority: 4 },
      { name: "BLGF Approval", date: timeline.blgfApprovalDeadline, priority: 5 },
      { name: "Effectivity", date: timeline.effectivityDate, priority: 6 },
    ].filter(d => d.date);

    // Find upcoming deadlines (future dates)
    const upcomingDeadlines = deadlines
      .map(d => ({
        ...d,
        deadline: new Date(d.date),
        daysUntil: Math.ceil((new Date(d.date) - today) / (1000 * 60 * 60 * 24))
      }))
      .filter(d => d.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // If no upcoming, check overdue
    if (upcomingDeadlines.length === 0) {
      const overdueDeadlines = deadlines
        .map(d => ({
          ...d,
          deadline: new Date(d.date),
          daysUntil: Math.ceil((new Date(d.date) - today) / (1000 * 60 * 60 * 24))
        }))
        .filter(d => d.daysUntil < 0)
        .sort((a, b) => b.daysUntil - a.daysUntil); // Most recent overdue first

      return overdueDeadlines[0] || null;
    }

    return upcomingDeadlines[0];
  };

  // Get current stage based on stageMap completion
  const getCurrentStage = (stageMap) => {
    // Find first incomplete stage
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const activities = stageMap[stage] || [];
      const completed = activities.filter(a => a.status === "Completed").length;
      const total = activities.length;
      
      if (completed < total) {
        return { name: stage, number: i + 1 };
      }
    }
    // All stages complete
    return { name: "Completed", number: stages.length };
  };

  const getComplianceBadge = (status) => {
    const badges = {
      "On Track": { class: "badge-success", icon: "✅", text: "On Track" },
      "At Risk": { class: "badge-warning", icon: "⚠️", text: "At Risk" },
      "Delayed": { class: "badge-warning", icon: "🟡", text: "Delayed" },
      "Overdue": { class: "badge-error", icon: "🔴", text: "Overdue" },
    };
    return badges[status] || { class: "badge-ghost", icon: "⚪", text: status };
  };

  if (filteredTableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-base-content/60">
        <svg className="w-20 h-20 mb-4 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-semibold text-base-content">No LGUs Found</p>
        <p className="text-sm text-base-content/60 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  // Simple View - Compact list
  if (viewMode === "simple") {
    return (
      <div className="space-y-2 mt-6">
        {filteredTableData.map((row, index) => {
          const colorSchemes = [
            'border-l-primary',
            'border-l-secondary',
            'border-l-accent',
            'border-l-info',
          ];
          const colorScheme = colorSchemes[index % colorSchemes.length];

          return (
            <div
              key={row.lguId}
              className={`group bg-base-100 rounded-lg border-2 border-base-300 border-l-4 ${colorScheme} hover:shadow-lg hover:scale-[1.005] transition-all duration-200 overflow-hidden`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* LGU Name */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-base-content truncate">
                    {row.lguName}
                  </h4>
                  <p className="text-xs text-base-content/50">Caraga Region</p>
                </div>

                {/* Progress Bar - Compact */}
                <div className="flex-[2] min-w-0">
                  <SMVProgressBar
                    tab1Progress={row.tab1Progress || 0}
                    tab2Progress={row.tab2Progress || 0}
                    tab3Progress={row.tab3Progress || 0}
                    tab4Progress={row.tab4Progress || 0}
                  />
                </div>

                {/* Edit Button */}
                {isAdmin && onSetTimeline && (
                  <button
                    className="btn btn-primary btn-sm rounded-lg gap-2"
                    title="Edit Timeline & Activities"
                    onClick={() => onSetTimeline(row)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Detailed View - Full cards
  return (
    <div className="space-y-4 mt-6">
      {/* LGU Cards - Simplified & Polished with Color Emphasis */}
      {filteredTableData.map((row, index) => {
        const daysSinceNotice = calculateDaysFromNotice(row.timeline);
        const nextDeadline = getNextDeadline(row.timeline);

        // Alternating color scheme for visual distinction
        const colorSchemes = [
          'bg-primary/5 border-primary/30 hover:border-primary hover:bg-primary/10',
          'bg-secondary/5 border-secondary/30 hover:border-secondary hover:bg-secondary/10',
          'bg-accent/5 border-accent/30 hover:border-accent hover:bg-accent/10',
          'bg-info/5 border-info/30 hover:border-info hover:bg-info/10',
        ];
        const colorScheme = colorSchemes[index % colorSchemes.length];

        return (
          <div 
            key={row.lguId}
            className={`group rounded-2xl border-2 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 overflow-hidden ${colorScheme}`}
          >
            {/* Colored accent bar at top */}
            <div className={`h-2 ${
              index % 4 === 0 ? 'bg-gradient-to-r from-primary to-primary/50' :
              index % 4 === 1 ? 'bg-gradient-to-r from-secondary to-secondary/50' :
              index % 4 === 2 ? 'bg-gradient-to-r from-accent to-accent/50' :
              'bg-gradient-to-r from-info to-info/50'
            }`}></div>

            <div className="p-5 sm:p-6">
              {/* Header: LGU Name + Progress Percentage */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {/* Color indicator dot with pulse effect */}
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      index % 4 === 0 ? 'bg-primary' :
                      index % 4 === 1 ? 'bg-secondary' :
                      index % 4 === 2 ? 'bg-accent' :
                      'bg-info'
                    }`}></div>
                    <h4 className="text-xl font-bold text-base-content tracking-tight">
                      {row.lguName}
                    </h4>
                  </div>
                  <p className="text-xs text-base-content/60 ml-[1.25rem] font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Caraga Region
                  </p>
                </div>
                {isAdmin && onSetTimeline && (
                  <button 
                    className="btn btn-primary btn-sm h-10 px-5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 gap-2"
                    title="Edit Timeline & Activities"
                    aria-label="Edit timeline and activities"
                    onClick={() => onSetTimeline(row)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline font-medium">Edit Timeline</span>
                    <span className="sm:hidden font-medium">Edit</span>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <SMVProgressBar
                  tab1Progress={row.tab1Progress || 0}
                  tab2Progress={row.tab2Progress || 0}
                  tab3Progress={row.tab3Progress || 0}
                  tab4Progress={row.tab4Progress || 0}
                />
              </div>

              {/* Stage Checklist - Compact Grid with Color Coding */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {/* Timeline */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 min-h-[2.75rem] shadow-sm transition-all duration-200 ${
                  row.tab1Progress === 100 
                    ? 'bg-success/10 border-success/30' 
                    : 'bg-base-200/70 border-base-300'
                }`}>
                  {row.tab1Progress === 100 ? (
                    <span className="text-success text-sm font-bold">✅</span>
                  ) : (
                    <span className="text-base-content/40 text-sm">⏳</span>
                  )}
                  <span className={`text-xs font-semibold ${
                    row.tab1Progress === 100 ? 'text-success' : 'text-base-content/70'
                  }`}>
                    Timeline
                  </span>
                </div>
                
                {/* Development */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 min-h-[2.75rem] shadow-sm transition-all duration-200 ${
                  row.tab2Progress === 100 ? 'bg-success/10 border-success/30' :
                  row.tab2Progress > 0 ? 'bg-warning/10 border-warning/30' :
                  'bg-base-200/70 border-base-300'
                }`}>
                  {row.tab2Progress === 100 ? (
                    <span className="text-success text-sm font-bold">✅</span>
                  ) : row.tab2Progress > 0 ? (
                    <span className="text-warning text-sm font-bold">🔄</span>
                  ) : (
                    <span className="text-base-content/40 text-sm">⏳</span>
                  )}
                  <span className={`text-xs font-semibold ${
                    row.tab2Progress === 100 ? 'text-success' :
                    row.tab2Progress > 0 ? 'text-warning' :
                    'text-base-content/70'
                  }`}>
                    Development
                  </span>
                </div>
                
                {/* Publication */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 min-h-[2.75rem] shadow-sm transition-all duration-200 ${
                  row.tab3Progress === 100 ? 'bg-success/10 border-success/30' :
                  row.tab3Progress > 0 ? 'bg-warning/10 border-warning/30' :
                  'bg-base-200/70 border-base-300'
                }`}>
                  {row.tab3Progress === 100 ? (
                    <span className="text-success text-sm font-bold">✅</span>
                  ) : row.tab3Progress > 0 ? (
                    <span className="text-warning text-sm font-bold">🔄</span>
                  ) : (
                    <span className="text-base-content/40 text-sm">⏳</span>
                  )}
                  <span className={`text-xs font-semibold ${
                    row.tab3Progress === 100 ? 'text-success' :
                    row.tab3Progress > 0 ? 'text-warning' :
                    'text-base-content/70'
                  }`}>
                    Publication
                  </span>
                </div>
                
                {/* Review */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 min-h-[2.75rem] shadow-sm transition-all duration-200 ${
                  row.tab4Progress === 100 ? 'bg-success/10 border-success/30' :
                  row.tab4Progress > 0 ? 'bg-warning/10 border-warning/30' :
                  'bg-base-200/70 border-base-300'
                }`}>
                  {row.tab4Progress === 100 ? (
                    <span className="text-success text-sm font-bold">✅</span>
                  ) : row.tab4Progress > 0 ? (
                    <span className="text-warning text-sm font-bold">🔄</span>
                  ) : (
                    <span className="text-base-content/40 text-sm">⏳</span>
                  )}
                  <span className={`text-xs font-semibold ${
                    row.tab4Progress === 100 ? 'text-success' :
                    row.tab4Progress > 0 ? 'text-warning' :
                    'text-base-content/70'
                  }`}>
                    Review
                  </span>
                </div>
              </div>

              {/* Footer: Current Stage + Timeline with Enhanced Styling */}
              <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 pt-5 mt-5 border-t-2 ${
                index % 4 === 0 ? 'border-primary/20' :
                index % 4 === 1 ? 'border-secondary/20' :
                index % 4 === 2 ? 'border-accent/20' :
                'border-info/20'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-base-content/60 font-medium">Status:</span>
                  <span className={`badge badge-sm font-semibold ${
                    index % 4 === 0 ? 'badge-primary' :
                    index % 4 === 1 ? 'badge-secondary' :
                    index % 4 === 2 ? 'badge-accent' :
                    'badge-info'
                  }`}>
                    {row.currentStage || "Timeline Setup"}
                  </span>
                </div>
                
                {daysSinceNotice !== null ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-base-content/60 font-medium">Day:</span>
                      <span className={`badge badge-sm font-bold ${
                        index % 4 === 0 ? 'badge-primary badge-outline' :
                        index % 4 === 1 ? 'badge-secondary badge-outline' :
                        index % 4 === 2 ? 'badge-accent badge-outline' :
                        'badge-info badge-outline'
                      }`}>
                        {daysSinceNotice}
                      </span>
                    </div>
                    {nextDeadline && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content/60 font-medium">Next Deadline:</span>
                        <span className={`badge badge-sm font-semibold ${
                          nextDeadline.daysUntil < 0 ? 'badge-error' :
                          nextDeadline.daysUntil < 30 ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {nextDeadline.name} — {nextDeadline.daysUntil < 0 ? 
                            `${Math.abs(nextDeadline.daysUntil)}d overdue` :
                            `${nextDeadline.daysUntil}d left`
                          }
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 bg-warning/10 px-3 py-1.5 rounded-lg border border-warning/30">
                    <span className="text-sm">⚠️</span>
                    <span className="text-xs text-warning font-semibold">
                      Set BLGF Notice Date
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
