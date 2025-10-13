import React, { useState } from "react";
import SMVProgressBar from "./SMVProgressBar";

export default function SMVCompactTable({ 
  filteredTableData, 
  stages, 
  isAdmin, 
  handleCheckboxToggle,
  onSetTimeline 
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (lguId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(lguId)) {
      newExpanded.delete(lguId);
    } else {
      newExpanded.add(lguId);
    }
    setExpandedRows(newExpanded);
  };

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

  // Heat map color based on completion
  const getHeatMapColor = (percent) => {
    if (percent === 100) return "bg-success/20 hover:bg-success/30";
    if (percent >= 75) return "bg-success/10 hover:bg-success/20";
    if (percent >= 50) return "bg-warning/10 hover:bg-warning/20";
    if (percent >= 25) return "bg-orange-500/10 hover:bg-orange-500/20";
    return "bg-error/10 hover:bg-error/20";
  };

  const getComplianceBadge = (status) => {
    const badges = {
      "On Track": { class: "badge-success", icon: "✅" },
      "At Risk": { class: "badge-warning", icon: "⚠️" },
      "Delayed": { class: "badge-warning", icon: "🟡" },
      "Overdue": { class: "badge-error", icon: "🔴" },
    };
    return badges[status] || { class: "badge-ghost", icon: "⚪" };
  };

  if (filteredTableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-semibold">No LGUs Found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-xs w-full">
        <thead className="bg-base-200 sticky top-0 z-10">
          <tr className="text-xs">
            <th className="w-8"></th>
            <th className="min-w-[180px]">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                LGU
              </div>
            </th>
            <th className="text-center w-24">
              <div className="flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Status
              </div>
            </th>
            <th className="text-center w-20">
              <div className="flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Days
              </div>
            </th>
            {stages.map((stage, idx) => (
              <th key={stage} className="text-center w-16">
                <div className="text-[10px] leading-tight">{idx + 1}</div>
              </th>
            ))}
            <th className="text-center w-24 sticky right-0 bg-base-200">
              <div className="flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Progress
              </div>
            </th>
            <th className="w-20 sticky right-0 bg-base-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTableData.map((row) => {
            const isExpanded = expandedRows.has(row.lguId);
            const badge = getComplianceBadge(row.complianceStatus);
            const heatMapClass = getHeatMapColor(row.totalPercent);

            return (
              <React.Fragment key={row.lguId}>
                {/* Main Row */}
                <tr 
                  className={`hover:bg-base-200/70 transition-colors border-b border-base-300 ${heatMapClass}`}
                >
                  {/* Expand Button */}
                  <td className="p-1">
                    <button
                      onClick={() => toggleRow(row.lguId)}
                      className="btn btn-ghost btn-xs btn-square"
                    >
                      <svg 
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>

                  {/* LGU Name */}
                  <td className="p-2 font-semibold text-xs">
                    {row.lguName}
                  </td>

                  {/* Compliance Status */}
                  <td className="p-1 text-center">
                    <div className={`badge ${badge.class} badge-xs gap-1`}>
                      <span className="text-[9px]">{badge.icon}</span>
                    </div>
                  </td>

                  {/* Days - BLGF Notice Tracking */}
                  <td className="p-1 text-center">
                    {(() => {
                      const daysSinceNotice = calculateDaysFromNotice(row.timeline);
                      const nextDeadline = getNextDeadline(row.timeline);
                      
                      return (
                        <div className="flex flex-col gap-0.5">
                          {/* Days since BLGF Notice (Day 0) */}
                          {daysSinceNotice !== null ? (
                            <>
                              <div className="text-[9px] text-base-content/60">Day {daysSinceNotice}</div>
                              {nextDeadline && (
                                <div className={`text-[10px] font-bold ${
                                  nextDeadline.daysUntil < 0 ? 'text-error' : 
                                  nextDeadline.daysUntil <= 30 ? 'text-warning' : 
                                  'text-success'
                                }`}>
                                  {nextDeadline.daysUntil < 0 ? (
                                    <>{Math.abs(nextDeadline.daysUntil)}d ⏰</>
                                  ) : (
                                    <>{nextDeadline.daysUntil}d 📅</>
                                  )}
                                </div>
                              )}
                              {nextDeadline && (
                                <div className="text-[8px] text-base-content/50">{nextDeadline.name}</div>
                              )}
                            </>
                          ) : (
                            <div className="text-[9px] text-base-content/40">No date</div>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Stage Mini Progress Indicators */}
                  {stages.map((stage) => {
                    const activities = row.stageMap[stage];
                    const completed = activities.filter(a => a.status === "Completed").length;
                    const total = activities.length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                    
                    return (
                      <td key={stage} className="p-1 text-center">
                        <div 
                          className={`radial-progress text-[8px] ${
                            percent === 100 ? 'text-success' : 
                            percent > 0 ? 'text-warning' : 
                            'text-base-content/30'
                          }`}
                          style={{"--value": percent, "--size": "2rem", "--thickness": "3px"}}
                        >
                          {percent}
                        </div>
                      </td>
                    );
                  })}

                  {/* Total Progress - 4-Tab Segmented Progress */}
                  <td className="p-2 sticky right-20 bg-inherit">
                    <div className="w-24 group">
                      <SMVProgressBar
                        tab1Progress={row.tab1Progress || 0}
                        tab2Progress={row.tab2Progress || 0}
                        tab3Progress={row.tab3Progress || 0}
                        tab4Progress={row.tab4Progress || 0}
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-1 sticky right-0 bg-inherit">
                    <div className="flex gap-0.5 justify-center">
                      {isAdmin && onSetTimeline && (
                        <button 
                          className="btn btn-primary btn-xs btn-square"
                          title="Set Timeline"
                          onClick={() => onSetTimeline(row)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      <button 
                        className="btn btn-ghost btn-xs btn-square"
                        title="View Details"
                        onClick={() => toggleRow(row.lguId)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <tr className="bg-base-200/50">
                    <td colSpan={stages.length + 6} className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stages.map((stage) => (
                          <div key={stage} className="card bg-base-100 shadow-sm">
                            <div className="card-body p-3">
                              <h4 className="text-xs font-bold text-base-content flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {stage}
                              </h4>
                              <div className="space-y-1">
                                {row.stageMap[stage].map((activity) => (
                                  <label
                                    key={activity._id}
                                    className="flex items-center gap-2 text-xs hover:bg-base-200 p-1 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={activity.status === "Completed"}
                                      disabled={!isAdmin}
                                      onChange={() =>
                                        handleCheckboxToggle(
                                          row.monitoringId,
                                          activity,
                                          row.lguId
                                        )
                                      }
                                      className="checkbox checkbox-xs checkbox-primary"
                                    />
                                    <span className={`flex-1 ${
                                      activity.status === "Completed" 
                                        ? "text-success line-through" 
                                        : activity.status === "In Progress"
                                        ? "text-warning"
                                        : "text-base-content/60"
                                    }`}>
                                      {activity.name}
                                    </span>
                                    <span className={`badge badge-xs ${
                                      activity.status === "Completed" 
                                        ? "badge-success" 
                                        : activity.status === "In Progress"
                                        ? "badge-warning"
                                        : "badge-ghost"
                                    }`}>
                                      {activity.status === "Completed" ? "✓" : 
                                       activity.status === "In Progress" ? "⏳" : "○"}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* BLGF Notice Timeline - RA 12001 Tracking */}
                      {row.timeline && (
                        <div className="mt-3 p-3 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
                          <h4 className="text-xs font-bold mb-3 flex items-center gap-2 text-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            RA 12001 Compliance Timeline
                            {row.timeline.blgfNoticeDate && (
                              <span className="badge badge-primary badge-xs ml-auto">
                                Day {calculateDaysFromNotice(row.timeline)}
                              </span>
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            {/* BLGF Notice Date (Day 0) */}
                            {row.timeline.blgfNoticeDate && (
                              <div className="flex flex-col p-2 bg-base-100 rounded border-l-2 border-primary">
                                <span className="text-[10px] text-primary font-bold mb-1">🔔 BLGF NOTICE (DAY 0)</span>
                                <span className="font-semibold text-base-content">
                                  {new Date(row.timeline.blgfNoticeDate).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </span>
                              </div>
                            )}

                            {/* Regional Office Submission (12 months) */}
                            {row.timeline.regionalOfficeSubmissionDeadline && (
                              <div className="flex flex-col p-2 bg-base-100 rounded border-l-2 border-warning">
                                <span className="text-[10px] text-warning font-bold mb-1">📤 RO SUBMISSION</span>
                                <span className="font-semibold text-base-content">
                                  {new Date(row.timeline.regionalOfficeSubmissionDeadline).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </span>
                                <span className="text-[9px] text-base-content/60 mt-1">Within 12 months</span>
                              </div>
                            )}

                            {/* Publication Deadline */}
                            {row.timeline.publicationDeadline && (
                              <div className="flex flex-col p-2 bg-base-100 rounded border-l-2 border-info">
                                <span className="text-[10px] text-info font-bold mb-1">📰 PUBLICATION</span>
                                <span className="font-semibold text-base-content">
                                  {new Date(row.timeline.publicationDeadline).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </span>
                                <span className="text-[9px] text-base-content/60 mt-1">2 weeks before consultation</span>
                              </div>
                            )}

                            {/* Public Consultation */}
                            {row.timeline.publicConsultationDeadline && (
                              <div className="flex flex-col p-2 bg-base-100 rounded border-l-2 border-secondary">
                                <span className="text-[10px] text-secondary font-bold mb-1">👥 PUBLIC CONSULTATION</span>
                                <span className="font-semibold text-base-content">
                                  {new Date(row.timeline.publicConsultationDeadline).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </span>
                                <span className="text-[9px] text-base-content/60 mt-1">60 days before RO submission</span>
                              </div>
                            )}

                            {/* Sanggunian Submission */}
                            {row.timeline.sanggunianSubmissionDeadline && (
                              <div className="flex flex-col p-2 bg-base-100 rounded border-l-2 border-accent">
                                <span className="text-[10px] text-accent font-bold mb-1">🏛️ SANGGUNIAN</span>
                                <span className="font-semibold text-base-content">
                                  {new Date(row.timeline.sanggunianSubmissionDeadline).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </span>
                              </div>
                            )}

                            {/* BLGF Approval */}
                            {row.timeline.blgfApprovalDeadline && (
                              <div className="flex flex-col p-2 bg-base-100 rounded border-l-2 border-success">
                                <span className="text-[10px] text-success font-bold mb-1">✅ BLGF APPROVAL</span>
                                <span className="font-semibold text-base-content">
                                  {new Date(row.timeline.blgfApprovalDeadline).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </span>
                              </div>
                            )}

                            {/* Effectivity Date */}
                            {row.timeline.effectivityDate && (
                              <div className="flex flex-col p-2 bg-base-100 rounded border-l-2 border-error">
                                <span className="text-[10px] text-error font-bold mb-1">🎯 EFFECTIVITY</span>
                                <span className="font-semibold text-base-content">
                                  {new Date(row.timeline.effectivityDate).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </span>
                                <span className="text-[9px] text-base-content/60 mt-1">SMV takes effect</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Alerts if any */}
                      {row.alerts && row.alerts.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {row.alerts.map((alert, idx) => (
                            <div 
                              key={idx} 
                              className={`alert ${alert.type === 'danger' ? 'alert-error' : 'alert-warning'} py-2 text-xs`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>{alert.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Stage Legend */}
      <div className="mt-4 p-3 bg-base-200 rounded-lg">
        <h4 className="text-xs font-bold mb-2">Stage Legend:</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {stages.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-2">
              <span className="font-bold text-primary">{idx + 1}</span>
              <span className="text-base-content/70">{stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
