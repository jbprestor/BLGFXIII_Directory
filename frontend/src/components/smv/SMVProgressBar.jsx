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
    <div className="flex flex-col gap-1 w-full">
      {/* Main Progress Bar */}
      <div className="flex items-center gap-2">
        <progress 
          className={`progress ${getProgressColor(overallProgress)} w-full h-2`}
          value={overallProgress} 
          max="100"
        ></progress>
        <span className="text-sm font-bold text-base-content min-w-[3rem] text-right">
          {overallProgress}%
        </span>
      </div>

      {/* 4 Mini Segments (Tab Progress Indicators) */}
      <div 
        className="flex gap-0.5 w-full"
        title={`Timeline: ${tab1Progress}% | Dev: ${tab2Progress}% | Proposed: ${tab3Progress}% | Review: ${tab4Progress}%`}
      >
        {/* Tab 1: Timeline */}
        <div 
          className={`h-1 flex-[1] rounded-full transition-all ${getSegmentColor(tab1Progress)}`}
          title={`Timeline: ${tab1Progress}%`}
        />
        
        {/* Tab 2: Development */}
        <div 
          className={`h-1 flex-[6] rounded-full transition-all ${getSegmentColor(tab2Progress)}`}
          title={`Development: ${tab2Progress}%`}
        />
        
        {/* Tab 3: Proposed Publication */}
        <div 
          className={`h-1 flex-[2] rounded-full transition-all ${getSegmentColor(tab3Progress)}`}
          title={`Proposed Publication: ${tab3Progress}%`}
        />
        
        {/* Tab 4: Review & Publication */}
        <div 
          className={`h-1 flex-[1] rounded-full transition-all ${getSegmentColor(tab4Progress)}`}
          title={`Review & Publication: ${tab4Progress}%`}
        />
      </div>

      {/* Hover Details Tooltip (optional, visible on hover) */}
      <div className="text-[9px] text-base-content/50 hidden group-hover:block">
        T:{tab1Progress}% | D:{tab2Progress}% | P:{tab3Progress}% | R:{tab4Progress}%
      </div>
    </div>
  );
}
