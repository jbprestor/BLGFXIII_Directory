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
  onSetTimeline
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

  // Find the NEXT unfilled milestone and calculate its recommended deadline.
  // A filled date = that step is DONE. We look for the first EMPTY step.
  const getNextDeadline = (row) => {
    const { timeline } = row;
    if (!timeline) return null;
    if (!timeline.blgfNoticeDate) return null; // No process started

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ordered milestones: each has a name, its date field, and how to calculate
    // its recommended deadline from previous dates.
    const milestones = [
      {
        name: "RO Submission",
        value: timeline.regionalOfficeSubmissionDeadline,
        // Recommended: within 12 months of BLGF Notice
        getRecommended: () => {
          if (!timeline.blgfNoticeDate) return null;
          const d = new Date(timeline.blgfNoticeDate);
          d.setFullYear(d.getFullYear() + 1);
          return d;
        }
      },
      {
        name: "1st Publication",
        value: timeline.firstPublicationDate,
        // No strict deadline — just mark as "Next" without countdown
        getRecommended: () => null
      },
      {
        name: "2nd Publication",
        value: timeline.secondPublicationDate,
        // Recommended: 1 week after 1st Publication
        getRecommended: () => {
          if (!timeline.firstPublicationDate) return null;
          const d = new Date(timeline.firstPublicationDate);
          d.setDate(d.getDate() + 7);
          return d;
        }
      },
      {
        name: "1st Consultation",
        value: timeline.firstPublicConsultationDate,
        // Recommended: 2 weeks after 2nd Publication
        getRecommended: () => {
          if (!timeline.secondPublicationDate) return null;
          const d = new Date(timeline.secondPublicationDate);
          d.setDate(d.getDate() + 14);
          return d;
        }
      },
      {
        name: "2nd Consultation",
        value: timeline.secondPublicConsultationDate,
        // Recommended: within 60 days before RO Submission
        getRecommended: () => {
          if (!timeline.regionalOfficeSubmissionDeadline) return null;
          const d = new Date(timeline.regionalOfficeSubmissionDeadline);
          d.setDate(d.getDate() - 60);
          return d;
        }
      },
      {
        name: "RO Review",
        value: timeline.roReviewDeadline,
        // Recommended: RO Submission + 45 days
        getRecommended: () => {
          if (!timeline.regionalOfficeSubmissionDeadline) return null;
          const d = new Date(timeline.regionalOfficeSubmissionDeadline);
          d.setDate(d.getDate() + 45);
          return d;
        }
      },
      {
        name: "CO Review",
        value: timeline.blgfCentralOfficeReviewDeadline,
        // Recommended: RO Review + 30 days
        getRecommended: () => {
          if (!timeline.roReviewDeadline) return null;
          const d = new Date(timeline.roReviewDeadline);
          d.setDate(d.getDate() + 30);
          return d;
        }
      },
      {
        name: "SoF Approval",
        value: timeline.secretaryOfFinanceReviewDeadline,
        // Recommended: CO Review + 30 days
        getRecommended: () => {
          if (!timeline.blgfCentralOfficeReviewDeadline) return null;
          const d = new Date(timeline.blgfCentralOfficeReviewDeadline);
          d.setDate(d.getDate() + 30);
          return d;
        }
      },
    ];

    // Walk through milestones in order. Find the first one that is NOT filled.
    for (const milestone of milestones) {
      if (!milestone.value) {
        // This is the next goal to achieve
        const recommended = milestone.getRecommended();

        if (recommended) {
          recommended.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((recommended - today) / (1000 * 60 * 60 * 24));
          return {
            name: milestone.name,
            daysUntil: diffDays,
            isNextGoal: true,
          };
        }

        // No recommended date calculable — just show as next goal
        return {
          name: milestone.name,
          isNextGoal: true,
          noDeadline: true,
        };
      }
    }

    // All milestones filled → process is complete
    return { name: "Completed", isCompleted: true };
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

  // Detailed View - Streamlined Dashboard List
  return (
    <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="bg-base-200/50 text-base-content/70">
            <tr>
              <th className="font-bold text-xs uppercase tracking-wider py-4 border-b-2 border-base-300">LGU Name</th>
              <th className="font-bold text-xs uppercase tracking-wider py-4 border-b-2 border-base-300">Status</th>
              <th className="font-bold text-xs uppercase tracking-wider py-4 hidden lg:table-cell border-b-2 border-base-300">Tracking Nodes</th>
              <th className="font-bold text-xs uppercase tracking-wider py-4 border-b-2 border-base-300">Deadline Status</th>
              <th className="font-bold text-xs uppercase tracking-wider py-4 text-right border-b-2 border-base-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-200/60">
            {filteredTableData.map((row) => {
              const daysSinceNotice = calculateDaysFromNotice(row.timeline);
              const nextDeadline = getNextDeadline(row);

              return (
                <tr key={row.lguId} className="hover:bg-base-200/30 transition-colors group">
                  {/* LGU Name Column */}
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-inner flex-shrink-0">
                        {row.lguName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base-content text-sm sm:text-base leading-tight truncate">
                          {row.lguName}
                        </div>
                        <div className="text-xs text-base-content/60 mt-0.5">Caraga Region</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Status / Overall Progress */}
                  <td className="py-4">
                    <span className={`badge badge-sm font-semibold border-0 ${
                      row.overallProgress === 100 ? 'bg-success/20 text-success' : 
                      row.overallProgress > 0 ? 'bg-warning/20 text-warning' : 
                      'bg-base-200 text-base-content/60'
                    }`}>
                      {row.currentStage || "Setup"}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5 max-w-[120px]">
                      <div className="w-full bg-base-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${row.overallProgress === 100 ? 'bg-success' : 'bg-primary'}`}
                          style={{ width: `${row.overallProgress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] uppercase font-mono opacity-60 flex-shrink-0">{row.overallProgress || 0}%</span>
                    </div>
                  </td>

                  {/* Tracking Nodes (Hidden on Mobile) */}
                  <td className="py-4 hidden lg:table-cell">
                    <div className="flex items-center">
                      <div className={`tooltip tooltip-primary`} data-tip="Timeline Phase">
                         <div className={`w-7 h-7 rounded-full flex items-center justify-center border-[2.5px] transition-colors ${row.tab1Progress === 100 ? 'border-success bg-success/10 text-success' : row.tab1Progress > 0 ? 'border-warning bg-warning/10 text-warning' : 'border-base-300 bg-base-200/50 text-base-content/30'}`}>
                            {row.tab1Progress === 100 ? <span className="text-xs font-bold">✓</span> : <span className="text-[10px] font-bold">T</span>}
                         </div>
                      </div>
                      <div className={`w-6 h-0.5 transition-colors ${row.tab2Progress > 0 ? 'bg-success/40' : 'bg-base-300'}`}></div>
                      
                      <div className={`tooltip tooltip-primary`} data-tip="Development Phase">
                         <div className={`w-7 h-7 rounded-full flex items-center justify-center border-[2.5px] transition-colors ${row.tab2Progress === 100 ? 'border-success bg-success/10 text-success' : row.tab2Progress > 0 ? 'border-warning bg-warning/10 text-warning' : 'border-base-300 bg-base-200/50 text-base-content/30'}`}>
                            {row.tab2Progress === 100 ? <span className="text-xs font-bold">✓</span> : <span className="text-[10px] font-bold">D</span>}
                         </div>
                      </div>
                      <div className={`w-6 h-0.5 transition-colors ${row.tab3Progress > 0 ? 'bg-success/40' : 'bg-base-300'}`}></div>
                      
                      <div className={`tooltip tooltip-primary`} data-tip="Publication Phase">
                         <div className={`w-7 h-7 rounded-full flex items-center justify-center border-[2.5px] transition-colors ${row.tab3Progress === 100 ? 'border-success bg-success/10 text-success' : row.tab3Progress > 0 ? 'border-warning bg-warning/10 text-warning' : 'border-base-300 bg-base-200/50 text-base-content/30'}`}>
                            {row.tab3Progress === 100 ? <span className="text-xs font-bold">✓</span> : <span className="text-[10px] font-bold">P</span>}
                         </div>
                      </div>
                      <div className={`w-6 h-0.5 transition-colors ${row.tab4Progress > 0 ? 'bg-success/40' : 'bg-base-300'}`}></div>
                      
                      <div className={`tooltip tooltip-primary`} data-tip="Review Phase">
                         <div className={`w-7 h-7 rounded-full flex items-center justify-center border-[2.5px] transition-colors ${row.tab4Progress === 100 ? 'border-success bg-success/10 text-success' : row.tab4Progress > 0 ? 'border-warning bg-warning/10 text-warning' : 'border-base-300 bg-base-200/50 text-base-content/30'}`}>
                            {row.tab4Progress === 100 ? <span className="text-xs font-bold">✓</span> : <span className="text-[10px] font-bold">R</span>}
                         </div>
                      </div>
                    </div>
                  </td>

                  {/* Deadline Metrics */}
                  <td className="py-4">
                     {nextDeadline ? (
                       nextDeadline.isCompleted ? (
                        <div className="flex items-center gap-1.5 text-success font-bold">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm">Completed ✅</span>
                        </div>
                       ) : nextDeadline.noDeadline ? (
                        /* Next goal but no calculable deadline */
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-info font-semibold">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-xs">Next Goal</span>
                          </div>
                          <div className="text-[10px] opacity-70 ml-5 font-medium uppercase tracking-tighter truncate max-w-[130px]">
                            {nextDeadline.name}
                          </div>
                        </div>
                       ) : (
                        /* Next goal with a calculable recommended deadline */
                        <div className={`flex flex-col gap-0.5 ${nextDeadline.daysUntil < 0 ? 'text-error' : nextDeadline.daysUntil < 30 ? 'text-warning' : 'text-success'}`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">
                              {nextDeadline.daysUntil < 0 
                                ? `${Math.abs(nextDeadline.daysUntil)}d overdue`
                                : nextDeadline.daysUntil === 0
                                ? `Due today!`
                                : `${nextDeadline.daysUntil}d remaining`}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-70 ml-5 font-medium uppercase tracking-tighter truncate max-w-[130px]">
                            Next: {nextDeadline.name}
                          </div>
                        </div>
                       )
                     ) : (
                      <div className="flex items-center gap-1.5 text-base-content/30 italic">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">Timeline not set</span>
                      </div>
                     )}
                     
                     {daysSinceNotice !== null && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] opacity-60 uppercase tracking-widest font-mono">
                        <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                        Day {daysSinceNotice}
                      </div>
                     )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 text-right">
                    {isAdmin && onSetTimeline && (
                      <button 
                        className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Update Timeline"
                        onClick={() => onSetTimeline(row)}
                      >
                       <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
