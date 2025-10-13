import React, { useState } from "react";
import SMVProgressBar from "./SMVProgressBar";

/**
 * SMV Summary Table - Dashboard Card Style (Option 4)
 * Clean, scannable summary focusing on compliance status and timeline tracking.
 * Detailed editing done through SetTimelineModal (4-tab modal).
 */
export default function SMVSummaryTable({ 
  filteredTableData, 
  stages, 
  isAdmin, 
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

  return (
    <div className="space-y-3">
      {/* Table Header - Sticky */}
      <div className="sticky top-0 z-10 bg-base-200 rounded-lg p-3 shadow-sm border border-base-300">
        <div className="grid grid-cols-10 gap-3 items-center text-xs font-bold text-base-content/70">
          <div className="col-span-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            LGU
          </div>
          <div className="col-span-7">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Progress & Stage
            </div>
          </div>
          <div className="col-span-1 text-center">Actions</div>
        </div>
      </div>

      {/* Table Rows - Card Style with Alternating Colors */}
      {filteredTableData.map((row, index) => {
        const isExpanded = expandedRows.has(row.lguId);
        const badge = getComplianceBadge(row.complianceStatus);
        const daysSinceNotice = calculateDaysFromNotice(row.timeline);
        const nextDeadline = getNextDeadline(row.timeline);
        const currentStage = getCurrentStage(row.stageMap);

        return (
          <div 
            key={row.lguId}
            className={`rounded-lg shadow-sm border border-base-300 hover:shadow-md transition-all duration-200 ${
              index % 2 === 0 ? 'bg-base-100' : 'bg-base-200/30'
            }`}
          >
            {/* Main Row */}
            <div className="p-3">
              <div className="grid grid-cols-10 gap-3 items-center">
                
                {/* LGU Name + Region - REDUCED */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRow(row.lguId)}
                      className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-base-content">{row.lguName}</div>
                      <div className="text-xs text-base-content/60">Caraga Region</div>
                    </div>
                  </div>
                </div>

                {/* EXPANDED Progress & Stage Column */}
                <div className="col-span-7">
                  <div className="space-y-2">
                    {/* Overall Progress with Percentage */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-base-content min-w-[2.5rem]">
                        {row.overallProgress || 0}%
                      </span>
                      <div className="flex-1">
                        <SMVProgressBar
                          tab1Progress={row.tab1Progress || 0}
                          tab2Progress={row.tab2Progress || 0}
                          tab3Progress={row.tab3Progress || 0}
                          tab4Progress={row.tab4Progress || 0}
                        />
                      </div>
                    </div>
                    
                    {/* Stage Milestones Checklist */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                      {/* Timeline */}
                      <div className="flex items-center gap-2">
                        {row.tab1Progress === 100 ? (
                          <span className="text-success">✅</span>
                        ) : (
                          <span className="text-base-content/30">⏳</span>
                        )}
                        <span className={row.tab1Progress === 100 ? 'text-base-content font-medium' : 'text-base-content/60'}>
                          Timeline Complete
                        </span>
                      </div>
                      
                      {/* Development */}
                      <div className="flex items-center gap-2">
                        {row.tab2Progress === 100 ? (
                          <span className="text-success">✅</span>
                        ) : row.tab2Progress > 0 ? (
                          <span className="text-info">🔄</span>
                        ) : (
                          <span className="text-base-content/30">⏳</span>
                        )}
                        <span className={
                          row.tab2Progress === 100 ? 'text-base-content font-medium' : 
                          row.tab2Progress > 0 ? 'text-info font-medium' : 
                          'text-base-content/60'
                        }>
                          Development {row.tab2Progress > 0 && `(${row.tab2Progress}%)`}
                        </span>
                      </div>
                      
                      {/* Publication */}
                      <div className="flex items-center gap-2">
                        {row.tab3Progress === 100 ? (
                          <span className="text-success">✅</span>
                        ) : row.tab3Progress > 0 ? (
                          <span className="text-info">🔄</span>
                        ) : (
                          <span className="text-base-content/30">⏳</span>
                        )}
                        <span className={
                          row.tab3Progress === 100 ? 'text-base-content font-medium' : 
                          row.tab3Progress > 0 ? 'text-info font-medium' : 
                          'text-base-content/60'
                        }>
                          Publication {row.tab3Progress > 0 && `(${row.tab3Progress}%)`}
                        </span>
                      </div>
                      
                      {/* Review */}
                      <div className="flex items-center gap-2">
                        {row.tab4Progress === 100 ? (
                          <span className="text-success">✅</span>
                        ) : row.tab4Progress > 0 ? (
                          <span className="text-info">🔄</span>
                        ) : (
                          <span className="text-base-content/30">⏳</span>
                        )}
                        <span className={
                          row.tab4Progress === 100 ? 'text-base-content font-medium' : 
                          row.tab4Progress > 0 ? 'text-info font-medium' : 
                          'text-base-content/60'
                        }>
                          Review & Approval {row.tab4Progress > 0 && `(${row.tab4Progress}%)`}
                        </span>
                      </div>
                    </div>
                    
                    {/* Current Stage Indicator */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-base-300/50">
                      <span className="text-[10px] text-base-content/60">Working On:</span>
                      <span className="text-xs font-semibold text-primary">
                        {row.currentStage || "Timeline Setup"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions - REDUCED */}
                <div className="col-span-1">
                  <div className="flex flex-col gap-1 items-center">
                    {isAdmin && onSetTimeline && (
                      <button 
                        className="btn btn-primary btn-sm btn-circle"
                        title="Set Timeline & Activities"
                        onClick={() => onSetTimeline(row)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    <button 
                      className="btn btn-ghost btn-sm btn-circle"
                      title="View Details"
                      onClick={() => toggleRow(row.lguId)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-base-300 bg-base-200/30 p-4">
                {/* RA 12001 Timeline Details */}
                {row.timeline && Object.keys(row.timeline).length > 1 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      RA 12001 Compliance Timeline
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {/* BLGF Notice Date (Day 0) */}
                      {row.timeline.blgfNoticeDate && (
                        <div className="bg-base-100 p-3 rounded-lg border-l-4 border-primary">
                          <div className="text-[10px] text-primary font-bold mb-1">🔔 BLGF NOTICE (DAY 0)</div>
                          <div className="font-semibold text-sm text-base-content">
                            {new Date(row.timeline.blgfNoticeDate).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}

                      {/* Regional Office Submission */}
                      {row.timeline.regionalOfficeSubmissionDeadline && (
                        <div className="bg-base-100 p-3 rounded-lg border-l-4 border-warning">
                          <div className="text-[10px] text-warning font-bold mb-1">📤 RO SUBMISSION</div>
                          <div className="font-semibold text-sm text-base-content">
                            {new Date(row.timeline.regionalOfficeSubmissionDeadline).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </div>
                          <div className="text-[9px] text-base-content/60 mt-1">Within 12 months</div>
                        </div>
                      )}

                      {/* Publication Deadline */}
                      {row.timeline.publicationDeadline && (
                        <div className="bg-base-100 p-3 rounded-lg border-l-4 border-info">
                          <div className="text-[10px] text-info font-bold mb-1">📰 PUBLICATION</div>
                          <div className="font-semibold text-sm text-base-content">
                            {new Date(row.timeline.publicationDeadline).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </div>
                          <div className="text-[9px] text-base-content/60 mt-1">2 weeks before consultation</div>
                        </div>
                      )}

                      {/* Public Consultation */}
                      {row.timeline.publicConsultationDeadline && (
                        <div className="bg-base-100 p-3 rounded-lg border-l-4 border-secondary">
                          <div className="text-[10px] text-secondary font-bold mb-1">👥 PUBLIC CONSULTATION</div>
                          <div className="font-semibold text-sm text-base-content">
                            {new Date(row.timeline.publicConsultationDeadline).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </div>
                          <div className="text-[9px] text-base-content/60 mt-1">60 days before RO</div>
                        </div>
                      )}

                      {/* Sanggunian Submission */}
                      {row.timeline.sanggunianSubmissionDeadline && (
                        <div className="bg-base-100 p-3 rounded-lg border-l-4 border-accent">
                          <div className="text-[10px] text-accent font-bold mb-1">🏛️ SANGGUNIAN</div>
                          <div className="font-semibold text-sm text-base-content">
                            {new Date(row.timeline.sanggunianSubmissionDeadline).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}

                      {/* BLGF Approval */}
                      {row.timeline.blgfApprovalDeadline && (
                        <div className="bg-base-100 p-3 rounded-lg border-l-4 border-success">
                          <div className="text-[10px] text-success font-bold mb-1">✅ BLGF APPROVAL</div>
                          <div className="font-semibold text-sm text-base-content">
                            {new Date(row.timeline.blgfApprovalDeadline).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}

                      {/* Effectivity Date */}
                      {row.timeline.effectivityDate && (
                        <div className="bg-base-100 p-3 rounded-lg border-l-4 border-error">
                          <div className="text-[10px] text-error font-bold mb-1">🎯 EFFECTIVITY</div>
                          <div className="font-semibold text-sm text-base-content">
                            {new Date(row.timeline.effectivityDate).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </div>
                          <div className="text-[9px] text-base-content/60 mt-1">SMV takes effect</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stage Progress Summary */}
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-base-content">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Stage Progress Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {stages.map((stage, idx) => {
                      const activities = row.stageMap[stage] || [];
                      const completed = activities.filter(a => a.status === "Completed").length;
                      const total = activities.length;
                      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                      
                      return (
                        <div key={stage} className="bg-base-100 p-3 rounded-lg border border-base-300">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`radial-progress text-sm ${
                              percent === 100 ? 'text-success' : 
                              percent > 0 ? 'text-warning' : 
                              'text-base-content/30'
                            }`}
                            style={{"--value": percent, "--size": "2.5rem", "--thickness": "4px"}}
                            >
                              {percent}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-xs text-primary">Stage {idx + 1}</div>
                              <div className="text-[10px] text-base-content/60">{completed}/{total}</div>
                            </div>
                          </div>
                          <div className="text-[10px] text-base-content/70 leading-tight">{stage}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alerts */}
                {row.alerts && row.alerts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-warning">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Alerts
                    </h4>
                    {row.alerts.map((alert, idx) => (
                      <div 
                        key={idx} 
                        className={`alert ${alert.type === 'danger' ? 'alert-error' : 'alert-warning'} text-xs`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA to Open Modal */}
                {isAdmin && onSetTimeline && (
                  <div className="mt-4 pt-4 border-t border-base-300">
                    <button 
                      className="btn btn-primary btn-sm w-full sm:w-auto"
                      onClick={() => onSetTimeline(row)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Timeline & Activities (4-Tab Modal)
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        );
      })}

      {/* Stage Legend at Bottom */}
      <div className="bg-base-200 rounded-lg p-4 border border-base-300">
        <h4 className="text-sm font-bold mb-3 text-base-content">📊 Stage Legend (6 Stages per RA 12001)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {stages.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-2 bg-base-100 p-2 rounded">
              <div className="badge badge-primary badge-sm">{idx + 1}</div>
              <span className="text-base-content font-medium">{stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
