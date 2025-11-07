/**
 * SMV Progress Bar Component - Segmented Multi-Tab Progress Display
 * 
 * Shows overall progress with 4 mini segments representing each tab:
 * Tab 1: Timeline (BLGF Notice Date: 100% if filled, 0% if empty)
 * Tab 2: Development (Activity completion percentage)
 * Tab 3: Proposed Publication (Activity completion percentage)
 * Tab 4: Review & Publication (Activity completion percentage)
 */

export default function SMVProgressBar({ 
  tab1Progress = 0,  // Timeline: 0 or 100
  tab2Progress = 0,  // Development: 0-100
  tab3Progress = 0,  // Proposed Publication: 0-100
  tab4Progress = 0   // Review & Publication: 0-100
}) {
  // Calculate overall progress (weighted average)
  // Timeline is prerequisite, so give it less weight
  // Development is main work, give it most weight
  const overallProgress = Math.round(
    (tab1Progress * 0.1) +  // 10% weight
    (tab2Progress * 0.6) +  // 60% weight
    (tab3Progress * 0.2) +  // 20% weight
    (tab4Progress * 0.1)    // 10% weight
  );

  // Color based on completion level
  const getProgressColor = (percent) => {
    if (percent === 100) return 'progress-success';
    if (percent >= 75) return 'progress-primary';
    if (percent >= 50) return 'progress-warning';
    if (percent > 0) return 'progress-info';
    return 'progress-error';
  };

  // Mini segment color
  const getSegmentColor = (percent) => {
    if (percent === 100) return 'bg-success';
    if (percent >= 50) return 'bg-warning';
    if (percent > 0) return 'bg-info';
    return 'bg-base-300';
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Main Progress Bar */}
      <div className="flex items-center gap-3">
        <progress 
          className={`progress ${getProgressColor(overallProgress)} w-full h-3`}
          value={overallProgress} 
          max="100"
        ></progress>
        <span className="text-base font-bold text-base-content min-w-[3.5rem] text-right">
          {overallProgress}%
        </span>
      </div>

      {/* Enhanced Segmented Progress Indicators */}
      <div className="flex gap-1 w-full">
        {/* Tab 1: Timeline (10% weight) */}
        <div 
          className="flex-[1] group cursor-help"
          title="Timeline: 10% weight - BLGF Notice Date"
        >
          <div className={`h-6 rounded-lg transition-all border-2 border-base-content/10 ${getSegmentColor(tab1Progress)} flex items-center justify-center overflow-hidden relative group-hover:border-base-content/30`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            <span className="text-[9px] font-bold text-base-100 relative z-10 drop-shadow-sm">
              {tab1Progress}%
            </span>
          </div>
          <div className="text-[10px] text-center text-base-content/70 font-medium mt-1 truncate">
            Timeline
          </div>
        </div>

        {/* Tab 2: Development (60% weight) */}
        <div 
          className="flex-[6] group cursor-help"
          title="Development: 60% weight - Main work activities"
        >
          <div className={`h-6 rounded-lg transition-all border-2 border-base-content/10 ${getSegmentColor(tab2Progress)} flex items-center justify-center overflow-hidden relative group-hover:border-base-content/30`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            <span className="text-xs font-bold text-base-100 relative z-10 drop-shadow-sm">
              {tab2Progress}%
            </span>
          </div>
          <div className="text-[10px] text-center text-base-content/70 font-medium mt-1 truncate">
            Development
          </div>
        </div>

        {/* Tab 3: Proposed Publication (20% weight) */}
        <div 
          className="flex-[2] group cursor-help"
          title="Publication: 20% weight - Publication activities"
        >
          <div className={`h-6 rounded-lg transition-all border-2 border-base-content/10 ${getSegmentColor(tab3Progress)} flex items-center justify-center overflow-hidden relative group-hover:border-base-content/30`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            <span className="text-[10px] font-bold text-base-100 relative z-10 drop-shadow-sm">
              {tab3Progress}%
            </span>
          </div>
          <div className="text-[10px] text-center text-base-content/70 font-medium mt-1 truncate">
            Publication
          </div>
        </div>

        {/* Tab 4: Review & Publication (10% weight) */}
        <div 
          className="flex-[1] group cursor-help"
          title="Review: 10% weight - Review process"
        >
          <div className={`h-6 rounded-lg transition-all border-2 border-base-content/10 ${getSegmentColor(tab4Progress)} flex items-center justify-center overflow-hidden relative group-hover:border-base-content/30`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            <span className="text-[9px] font-bold text-base-100 relative z-10 drop-shadow-sm">
              {tab4Progress}%
            </span>
          </div>
          <div className="text-[10px] text-center text-base-content/70 font-medium mt-1 truncate">
            Review
          </div>
        </div>
      </div>
    </div>
  );
}
