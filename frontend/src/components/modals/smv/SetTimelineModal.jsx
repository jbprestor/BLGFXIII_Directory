import { useState, useEffect, useMemo, useRef } from "react";
import useEscapeKey from "../../../hooks/useEscapeKey.js";
import useBodyScrollLock from "../../../hooks/useBodyScrollLock.js";
import toast from "react-hot-toast";
import { useLGUImages } from "../../../assets/LguImages.js";

// Helper function to format date as "January 21, 2025"
const formatDateLong = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Helper function to calculate countdown for deadlines
// If a date is recorded (in the past), it means they have already complied → show Completed.
// If a date is set in the future → show countdown reminder.
const calculateCountdown = (deadlineDate) => {
  if (!deadlineDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day comparison
  
  const deadline = new Date(deadlineDate + 'T00:00:00');
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return { 
      text: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`, 
      color: diffDays > 14 ? 'badge-success' : diffDays > 7 ? 'badge-warning' : 'badge-error',
      icon: '⏳'
    };
  } else if (diffDays === 0) {
    return { 
      text: 'Due today!', 
      color: 'badge-warning',
      icon: '⚠️'
    };
  } else {
    // Date is in the past → they have already complied with this requirement
    return { 
      text: 'Completed', 
      color: 'badge-success',
      icon: '✅'
    };
  }
};

// Warning countdown for UNFILLED fields — shows overdue/remaining based on a recommended deadline
const calculateDeadlineWarning = (recommendedDate) => {
  if (!recommendedDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadline = new Date(recommendedDate);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return { 
      text: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`, 
      color: diffDays > 14 ? 'badge-warning' : 'badge-error',
      icon: '⏳'
    };
  } else if (diffDays === 0) {
    return { 
      text: 'Due today!', 
      color: 'badge-error',
      icon: '⚠️'
    };
  } else {
    return { 
      text: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`, 
      color: 'badge-error',
      icon: '🔴'
    };
  }
};

// Custom DateInput component with formatted display
const DateInput = ({ name, value, onChange, className, min, max, placeholder = "Select date..." }) => {
  const dateInputRef = useRef(null);

  const handleClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation(); // Don't open the picker
    onChange({ target: { name, value: "" } });
  };

  return (
    <div className="relative">
      {/* Hidden native date input — sr-only so it never blocks clicks */}
      <input
        ref={dateInputRef}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Visible button — sole click target */}
      <button
        type="button"
        onClick={handleClick}
        className={`${className} text-left flex items-center justify-between gap-2 w-full cursor-pointer`}
      >
        <span className={value ? "text-base-content" : "text-base-content/40"}>
          {value ? formatDateLong(value) : placeholder}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-error/20 text-base-content/40 hover:text-error transition-colors"
              title="Clear date"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default function SetTimelineModal({
  isOpen,
  onClose,
  lguData,
  onSave
}) {
  useEscapeKey(onClose);
  useBodyScrollLock(isOpen);
  
  // Get LGU images mapping
  const lguImages = useLGUImages();

  const [activeTab, setActiveTab] = useState("timeline"); // timeline, activities, or publication

  const [formData, setFormData] = useState({
    blgfNoticeDate: "",
    regionalOfficeSubmissionDeadline: "",
    firstPublicationDate: "", // 1st Publication (Week 1)
    secondPublicationDate: "", // 2nd Publication (Week 2)
    firstPublicConsultationDate: "", // 1st Consultation - 2 weeks after 2nd publication
    secondPublicConsultationDate: "", // 2nd Consultation - within 60 days before RO submission
    roReviewDeadline: "", // Auto-calculated: RO Submission + 45 days
    blgfCentralOfficeReviewDeadline: "", // Auto-calculated: RO Review + 30 days
    secretaryOfFinanceReviewDeadline: "", // Auto-calculated: BLGF CO Review + 30 days
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({
    firstPublicConsultationDate: "",
    secondPublicConsultationDate: "",
    regionalOfficeSubmissionDeadline: ""
  });

  // Default activity structure if not in lguData - using useMemo to prevent recreation
  const defaultActivities = useMemo(() => ({
    "Preparatory": [
      { name: "Set the date of valuation", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Prepare work plan", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Prepare budget proposal", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Create and organize SMV teams / TWG", status: "Not Started", dateCompleted: "", remarks: "" },
    ],
    "Data Collection": [
      { name: "Identify market areas", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Establish a database/inventory", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Examine transaction database/inventory", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Review sales prior to inspection", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Investigate the property", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Collect, validate, and filter data", status: "Not Started", dateCompleted: "", remarks: "" },
    ],
    "Data Analysis": [
      { name: "Review/Amend existing sub-market areas", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Analyze transaction data", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Process analyzed data", status: "Not Started", dateCompleted: "", remarks: "" },
    ],
    "Preparation of Proposed SMV": [
      { name: "Set interval or value ranges", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Craft the working land value map", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Testing the developed SMV", status: "Not Started", dateCompleted: "", remarks: "" },
      { name: "Check values of adjoining LGUs", status: "Not Started", dateCompleted: "", remarks: "" },
    ],
    "Valuation Testing": [
      { name: "Valuation Testing", status: "Not Started", dateCompleted: "", remarks: "" },
    ],
    "Finalization of Proposed SMV": [
      { name: "Finalization of Proposed SMV", status: "Not Started", dateCompleted: "", remarks: "" },
    ],
  }), []);

  // Tab 3: Publication of Proposed SMV (Pre-submission activities - what LGU does before submitting to RO)
  const defaultProposedPublicationActivities = useMemo(() => [
    { name: "Publication of the Proposed SMV for 2 weeks prior to Public Consultation:", status: "Not Started", dateCompleted: "", remarks: "", isHeader: true },
    { name: "Official website of the province/city", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Two (2) conspicuous public places or principal office", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Conduct of at least two (2) Public Consultation", status: "Not Started", dateCompleted: "", remarks: "", isHeader: true },
    { name: "Note: Date: within sixty (60) days before the submission to RO", status: "Not Started", dateCompleted: "", remarks: "", isNote: true },
    { name: "1st public consultation- Online (Zoom live in FB)", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "2nd public consultation (face to face)", status: "Not Started", dateCompleted: "", remarks: "" }
  ], []);

  // Tab 4: Review and Publication (Post-submission - RO/CO review and final publication)
  const defaultReviewPublicationActivities = useMemo(() => [
    { name: "Submission to Regional Office (Within 12 months upon receipt of the Notice)", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Regional Office Review (45 days) - BLGF RO", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Central Office Review (30 days) - BLGF CO", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Indorsement / Certification to SOF (30 days) - BLGF CO", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Publication of Certified SMV (30 days) - SOF/LGUs", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "a. Official Gazette or in Department of Finance Official Website", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "b. Official website of the province/city", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "c. Two (2) conspicuous public places or principal office", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Transmittal of Certified SMV to LCE & Sanggunian (15 days after publication)", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Preparation and Submission of Real Property Tax Revenue Compliance and Impact Study to the Local Sanggunian", status: "Not Started", dateCompleted: "", remarks: "" },
    { name: "Enactment of Ordinance Adjusting the Assessment Levels or Tax Rates by the Local Sanggunian (within 5 months after RPTCIS)", status: "Not Started", dateCompleted: "", remarks: "" }
  ], []);

  // Initialize with defaultActivities, will be overridden in useEffect if lguData exists
  const [activities, setActivities] = useState(defaultActivities);
  const [proposedPublicationActivities, setProposedPublicationActivities] = useState(defaultProposedPublicationActivities);
  const [reviewPublicationActivities, setReviewPublicationActivities] = useState(defaultReviewPublicationActivities);

  // Populate existing data
  useEffect(() => {
    if (!lguData) return;

    console.log('🔄 SetTimelineModal: Loading LGU data', {
      lguName: lguData.lguName,
      hasTimeline: !!lguData.timeline,
      timelineData: lguData.timeline,
      rawFirstPub: lguData.timeline?.firstPublicationDate,
      rawSecondPub: lguData.timeline?.secondPublicationDate,
      rawFirstConsult: lguData.timeline?.firstPublicConsultationDate,
      rawSecondConsult: lguData.timeline?.secondPublicConsultationDate
    });

    // Populate timeline data
    if (lguData.timeline) {
      const roSubmission = lguData.timeline.regionalOfficeSubmissionDeadline
        ? new Date(lguData.timeline.regionalOfficeSubmissionDeadline).toISOString().split('T')[0]
        : "";
      
      // Use saved values from DB if they exist; only auto-calculate for brand-new records
      let roReview = "";
      let blgfCOReview = "";
      let sofReview = "";
      
      // Check if these fields exist in saved data (even if null/undefined means cleared)
      const hasReviewData = 'roReviewDeadline' in (lguData.timeline || {}) 
        || 'blgfCentralOfficeReviewDeadline' in (lguData.timeline || {})
        || 'secretaryOfFinanceReviewDeadline' in (lguData.timeline || {});
      
      if (hasReviewData) {
        // Use whatever is saved (including empty string for cleared dates)
        roReview = lguData.timeline.roReviewDeadline
          ? new Date(lguData.timeline.roReviewDeadline).toISOString().split('T')[0]
          : "";
        blgfCOReview = lguData.timeline.blgfCentralOfficeReviewDeadline
          ? new Date(lguData.timeline.blgfCentralOfficeReviewDeadline).toISOString().split('T')[0]
          : "";
        sofReview = lguData.timeline.secretaryOfFinanceReviewDeadline
          ? new Date(lguData.timeline.secretaryOfFinanceReviewDeadline).toISOString().split('T')[0]
          : "";
      }

      const loadedFormData = {
        blgfNoticeDate: lguData.timeline.blgfNoticeDate
          ? new Date(lguData.timeline.blgfNoticeDate).toISOString().split('T')[0]
          : "",
        regionalOfficeSubmissionDeadline: roSubmission,
        // Handle both old single fields and new separate fields
        firstPublicationDate: lguData.timeline.firstPublicationDate
          ? new Date(lguData.timeline.firstPublicationDate).toISOString().split('T')[0]
          : (lguData.timeline.publicationDeadline 
              ? new Date(lguData.timeline.publicationDeadline).toISOString().split('T')[0]
              : ""),
        secondPublicationDate: lguData.timeline.secondPublicationDate
          ? new Date(lguData.timeline.secondPublicationDate).toISOString().split('T')[0]
          : "",
        firstPublicConsultationDate: lguData.timeline.firstPublicConsultationDate
          ? new Date(lguData.timeline.firstPublicConsultationDate).toISOString().split('T')[0]
          : (lguData.timeline.publicConsultationDeadline 
              ? new Date(lguData.timeline.publicConsultationDeadline).toISOString().split('T')[0]
              : ""),
        secondPublicConsultationDate: lguData.timeline.secondPublicConsultationDate
          ? new Date(lguData.timeline.secondPublicConsultationDate).toISOString().split('T')[0]
          : "",
        roReviewDeadline: roReview,
        blgfCentralOfficeReviewDeadline: blgfCOReview,
        secretaryOfFinanceReviewDeadline: sofReview,
      };

      console.log('✅ SetTimelineModal: Setting form data', loadedFormData);
      setFormData(loadedFormData);
    }

    // Handle activities - check if stageMap exists and has valid detailed data
    let hasValidStageMap = false;
    let processedStageMap = null;

    if (lguData.stageMap) {
      // Check if it's a Map object
      if (lguData.stageMap instanceof Map) {
        const mapObject = Object.fromEntries(lguData.stageMap);
        if (Object.keys(mapObject).length > 0) {
          processedStageMap = mapObject;
        }
      }
      // Check if it's a plain object with data
      else if (typeof lguData.stageMap === 'object' && Object.keys(lguData.stageMap).length > 0) {
        processedStageMap = lguData.stageMap;
      }

      // Validate if it has real detailed activities (not generic placeholder names)
      if (processedStageMap) {
        const hasDetailedActivities = Object.values(processedStageMap).some(arr =>
          Array.isArray(arr) &&
          arr.length > 0 &&
          arr[0].name &&
          // Check if it's NOT a generic placeholder name
          !arr[0].name.match(/^(Preparatory|Data Collection|Data Analysis|Preparation of Proposed SMV|Valuation Testing|Finalization) Activity$/i) &&
          !arr[0].placeholder
        );

        if (hasDetailedActivities) {
          hasValidStageMap = true;
        }
      }
    }

    // Use defaults if no valid detailed data (always use defaults for better UX)
    // This ensures all LGUs see the detailed 19 activity names
    if (!hasValidStageMap || !processedStageMap) {
      setActivities(defaultActivities);
    } else {
      // Merge saved data with defaults to ensure all detailed names are present
      const mergedActivities = {};
      Object.keys(defaultActivities).forEach(stage => {
        if (processedStageMap[stage] && processedStageMap[stage].length > 0) {
          // Use saved data if it exists and has detailed activities
          mergedActivities[stage] = processedStageMap[stage];
        } else {
          // Use default detailed activities
          mergedActivities[stage] = defaultActivities[stage];
        }
      });
      setActivities(mergedActivities);
    }

    // Handle proposed publication activities (Tab 3)
    if (lguData.proposedPublicationActivities && Array.isArray(lguData.proposedPublicationActivities) && lguData.proposedPublicationActivities.length > 0) {
      setProposedPublicationActivities(lguData.proposedPublicationActivities);
    } else {
      setProposedPublicationActivities(defaultProposedPublicationActivities);
    }

    // Handle review publication activities (Tab 4)
    if (lguData.reviewPublicationActivities && Array.isArray(lguData.reviewPublicationActivities) && lguData.reviewPublicationActivities.length > 0) {
      setReviewPublicationActivities(lguData.reviewPublicationActivities);
    } else {
      setReviewPublicationActivities(defaultReviewPublicationActivities);
    }
  }, [lguData, defaultActivities, defaultProposedPublicationActivities, defaultReviewPublicationActivities]);

  // Note: Review deadlines (RO Review, CO Review, SoF) are no longer auto-calculated.
  // Users can manually set/clear them. The "Recommended Date" hint below each field
  // shows them what the calculated value would be.

  // Note: Cascading auto-calculation removed - now handled by Auto-Calculate button with 4 separate fields

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors for this field locally; useEffect will re-evaluate globally
    setErrors(prev => ({ ...prev, [name]: "" }));
    
    // AUTO-UPDATE TAB 3 & TAB 4: Update activity dates when timeline changes
    if (value) {
      // Update Tab 3 (Proposed Publication Activities) based on timeline dates
      if (name === 'firstPublicationDate' || name === 'secondPublicationDate') {
        setProposedPublicationActivities(prev => prev.map(activity => {
          if (name === 'firstPublicationDate' && activity.name === "Official website of the province/city") {
            return { ...activity, dateCompleted: value };
          }
          if (name === 'secondPublicationDate' && activity.name === "Two (2) conspicuous public places or principal office") {
            return { ...activity, dateCompleted: value };
          }
          return activity;
        }));
      }
      
      if (name === 'firstPublicConsultationDate') {
        setProposedPublicationActivities(prev => prev.map(activity => {
          if (activity.name === "1st public consultation- Online (Zoom live in FB)") {
            return { ...activity, dateCompleted: value };
          }
          return activity;
        }));
      }
      
      if (name === 'secondPublicConsultationDate') {
        setProposedPublicationActivities(prev => prev.map(activity => {
          if (activity.name === "2nd public consultation (face to face)") {
            return { ...activity, dateCompleted: value };
          }
          return activity;
        }));
      }
      
      // Update Tab 4 (Review & Publication Activities) based on timeline dates
      if (name === 'regionalOfficeSubmissionDeadline') {
        // Update RO Submission activity
        setReviewPublicationActivities(prev => prev.map(activity => {
          if (activity.name === "Submission to Regional Office (Within 12 months upon receipt of the Notice)") {
            return { ...activity, dateCompleted: value };
          }
          return activity;
        }));
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  // Cross-field Validation side-effect
  useEffect(() => {
    const newErrors = {
      firstPublicConsultationDate: "",
      secondPublicConsultationDate: "",
      regionalOfficeSubmissionDeadline: ""
    };

    // 1st Public Consultation Validation
    if (formData.firstPublicConsultationDate) {
      const firstConsDate = new Date(formData.firstPublicConsultationDate);
      
      if (formData.firstPublicationDate) {
        const firstPubDate = new Date(formData.firstPublicationDate);
        const diffDays = Math.ceil((firstConsDate - firstPubDate) / (1000 * 60 * 60 * 24));
        if (diffDays < 14) {
          newErrors.firstPublicConsultationDate = `Must be at least 2 weeks (14 days) after 1st Publication (${formatDateLong(formData.firstPublicationDate)})`;
        }
      }
      
      if (!newErrors.firstPublicConsultationDate && formData.secondPublicationDate) {
        const secondPubDate = new Date(formData.secondPublicationDate);
        if (firstConsDate < secondPubDate) {
          newErrors.firstPublicConsultationDate = `Must not be before 2nd Publication (${formatDateLong(formData.secondPublicationDate)})`;
        }
      }
    }

    // 2nd Public Consultation Validation
    if (formData.secondPublicConsultationDate && formData.firstPublicConsultationDate) {
      const secondConsDate = new Date(formData.secondPublicConsultationDate);
      const firstConsDate = new Date(formData.firstPublicConsultationDate);
      if (secondConsDate < firstConsDate) {
        newErrors.secondPublicConsultationDate = `Must not be before 1st Public Consultation (${formatDateLong(formData.firstPublicConsultationDate)})`;
      }
    }

    // RO Submission Validation
    if (formData.regionalOfficeSubmissionDeadline && formData.secondPublicConsultationDate) {
      const roSubDate = new Date(formData.regionalOfficeSubmissionDeadline);
      const secondConsDate = new Date(formData.secondPublicConsultationDate);
      const diffDays = Math.ceil((roSubDate - secondConsDate) / (1000 * 60 * 60 * 24));

      if (diffDays > 60) {
        newErrors.regionalOfficeSubmissionDeadline = `Must be within 60 days after 2nd consultation. Currently ${diffDays} days from 2nd consultation (Max: 60 days)`;
      } else if (diffDays < 0) {
        newErrors.regionalOfficeSubmissionDeadline = `Must be after 2nd Public Consultation (${formatDateLong(formData.secondPublicConsultationDate)})`;
      }
    }

    setErrors(newErrors);
  }, [
    formData.firstPublicationDate,
    formData.secondPublicationDate,
    formData.firstPublicConsultationDate,
    formData.secondPublicConsultationDate,
    formData.regionalOfficeSubmissionDeadline
  ]);

  // Handle activity field changes
  const handleActivityChange = (stageName, activityIndex, field, value) => {
    setActivities(prev => ({
      ...prev,
      [stageName]: prev[stageName].map((activity, idx) =>
        idx === activityIndex
          ? { ...activity, [field]: value }
          : activity
      )
    }));
    setHasChanges(true);
  };

  // Handle proposed publication activity changes (Tab 3)
  const handleProposedPublicationChange = (activityIndex, field, value) => {
    setProposedPublicationActivities(prev => prev.map((activity, idx) =>
      idx === activityIndex
        ? { ...activity, [field]: value }
        : activity
    ));
    setHasChanges(true);
  };

  // Handle review publication activity changes (Tab 4)
  const handleReviewPublicationChange = (activityIndex, field, value) => {
    setReviewPublicationActivities(prev => prev.map((activity, idx) =>
      idx === activityIndex
        ? { ...activity, [field]: value }
        : activity
    ));
    setHasChanges(true);
  };

  // Save all changes (timeline + activities + proposed publication + review publication)
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Save all data including the new 4-tab structure
      await onSave({
        timeline: formData,
        stageMap: activities,
        proposedPublicationActivities: proposedPublicationActivities,
        reviewPublicationActivities: reviewPublicationActivities
      });
      // Reset changes flag after successful save
      setHasChanges(false);
      toast.success("Changes saved successfully! Modal remains open for further edits.");
      // Modal stays open - parent no longer closes it
    } catch (error) {
      // Parent handles all error toasts
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset all data to defaults
  const handleResetAll = () => {
    // Show confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-bold">Reset All Data?</p>
        <p className="text-sm">This will clear all timeline dates and reset all activities to their default state.</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              // Reset timeline
              setFormData({
                blgfNoticeDate: "",
                regionalOfficeSubmissionDeadline: "",
                firstPublicationDate: "",
                secondPublicationDate: "",
                firstPublicConsultationDate: "",
                secondPublicConsultationDate: "",
                roReviewDeadline: "",
                blgfCentralOfficeReviewDeadline: "",
                secretaryOfFinanceReviewDeadline: "",
              });

              // Reset all activities
              setActivities(defaultActivities);
              setProposedPublicationActivities(defaultProposedPublicationActivities);
              setReviewPublicationActivities(defaultReviewPublicationActivities);

              // Clear changes flag
              setHasChanges(false);

              toast.dismiss(t.id);
              toast.success("All data has been reset to defaults!");
            }}
            className="btn btn-error btn-sm"
          >
            Yes, Reset All
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      style: {
        minWidth: '350px',
      },
    });
  };

  const handleAutoCalculate = () => {
    if (!formData.blgfNoticeDate) {
      toast.error("Please set BLGF Notice Date first");
      return;
    }

    const noticeDate = new Date(formData.blgfNoticeDate);

    // Auto-calculate deadlines based on RA 12001 / RPVARA IRR requirements
    // Work backwards from RO Submission (12 months from notice)
    const roSubmission = new Date(noticeDate);
    roSubmission.setMonth(roSubmission.getMonth() + 12); // 12 months from notice

    // 2nd Public Consultation: must be within 60 days prior to RO submission (Section 27)
    const secondConsultation = new Date(roSubmission);
    secondConsultation.setDate(secondConsultation.getDate() - 60);

    // 1st Public Consultation: suggested 7 days before 2nd consultation
    // Must be at least 2 weeks after 1st publication AND not before 2nd publication
    const firstConsultation = new Date(secondConsultation);
    firstConsultation.setDate(firstConsultation.getDate() - 7);

    // 2nd Publication: work backwards - should be same day or before 1st consultation
    // But 1st consultation must be 2 weeks after 1st publication
    const secondPublication = new Date(firstConsultation);
    // 2nd publication same day as 1st consultation is fine

    // 1st Publication: 1st consultation must be at least 14 days after this
    const firstPublication = new Date(firstConsultation);
    firstPublication.setDate(firstPublication.getDate() - 14);

    const roReview = new Date(roSubmission);
    roReview.setDate(roReview.getDate() + 45); // 45 days after RO submission

    const blgfCOReview = new Date(roReview);
    blgfCOReview.setDate(blgfCOReview.getDate() + 30); // 30 days after RO Review

    const sofReview = new Date(blgfCOReview);
    sofReview.setDate(sofReview.getDate() + 30); // 30 days after BLGF CO Review

    setFormData(prev => ({
      ...prev,
      regionalOfficeSubmissionDeadline: roSubmission.toISOString().split('T')[0],
      firstPublicationDate: firstPublication.toISOString().split('T')[0],
      secondPublicationDate: secondPublication.toISOString().split('T')[0],
      firstPublicConsultationDate: firstConsultation.toISOString().split('T')[0],
      secondPublicConsultationDate: secondConsultation.toISOString().split('T')[0],
      roReviewDeadline: roReview.toISOString().split('T')[0],
      blgfCentralOfficeReviewDeadline: blgfCOReview.toISOString().split('T')[0],
      secretaryOfFinanceReviewDeadline: sofReview.toISOString().split('T')[0],
    }));

    setHasChanges(true);
    toast.success("Deadlines auto-calculated based on RPVARA IRR requirements");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Drawer Panel */}
      <div className="relative bg-base-100 shadow-2xl w-full max-w-5xl h-full flex flex-col animate-[slideLeft_0.3s_ease-out]">
        {/* Header - Sticky at top */}
        <div className="flex-shrink-0 bg-gradient-to-r from-primary to-secondary p-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* LGU Logo */}
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border-2 border-white/50 shadow-xl overflow-hidden">
                {lguImages[lguData?.lguName] ? (
                  <img 
                    src={lguImages[lguData?.lguName]} 
                    alt={`${lguData?.lguName} logo`}
                    className="w-full h-full object-contain p-1.5"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <svg 
                  className="w-7 h-7 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ display: lguImages[lguData?.lguName] ? 'none' : 'block' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <div>
                <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5">
                  SMV Monitoring Details
                </div>
                <h2 className="text-2xl font-black text-base-content tracking-tight leading-none mb-1">
                  {lguData?.lguName}
                </h2>
                <p className="text-[12px] text-base-content/60 flex items-center gap-1.5 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {lguData?.region || "Caraga Region"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetAll}
                className="btn btn-ghost btn-sm text-primary hover:bg-white/20 flex items-center gap-2"
                title="Reset all data to defaults"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset All
              </button>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle text-primary hover:bg-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

          {/* Main Content Area - Split Layout (Sidebar + Form) */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-base-200/30 border-b md:border-b-0 md:border-r border-base-300 flex flex-row md:flex-col flex-shrink-0 p-2 md:p-4 gap-2 md:gap-0 md:space-y-2 overflow-x-auto md:overflow-y-auto">
              {/* Tab 1: Timeline */}
              <button
                type="button"
                className={`min-w-fit flex-1 md:flex-none md:w-full text-left p-2.5 md:p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${activeTab === "timeline"
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-base-content/70 hover:bg-base-200"
                  }`}
                onClick={() => setActiveTab("timeline")}
              >
                <span className="text-xl md:text-2xl drop-shadow-sm">🗓️</span>
                <span className="font-medium whitespace-nowrap text-[13px] md:text-sm tracking-wide">Timeline Dates</span>
              </button>

            {/* Tab 2: Development - Locked until BLGF Notice Date is set */}
            <div className="relative group">
              <button
                type="button"
                disabled={!formData.blgfNoticeDate}
                className={`min-w-fit flex-1 md:flex-none md:w-full text-left p-2.5 md:p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${!formData.blgfNoticeDate
                  ? "opacity-40 cursor-not-allowed grayscale"
                  : activeTab === "development"
                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                    : "text-base-content/70 hover:bg-base-200"
                  }`}
                onClick={() => formData.blgfNoticeDate && setActiveTab("development")}
              >
                <span className="text-xl md:text-2xl drop-shadow-sm">🏗️</span>
                <span className="font-medium whitespace-nowrap text-[13px] md:text-sm tracking-wide">Development</span>
              </button>
              {!formData.blgfNoticeDate && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-base-100 text-base-content text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-base-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔒</span>
                    Set BLGF Notice Date First
                  </div>
                </div>
              )}
            </div>

            {/* Tab 3: Proposed Publication */}
            <div className="relative group">
              <button
                type="button"
                disabled={!formData.blgfNoticeDate}
                className={`min-w-fit flex-1 md:flex-none md:w-full text-left p-2.5 md:p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${!formData.blgfNoticeDate
                  ? "opacity-40 cursor-not-allowed grayscale"
                  : activeTab === "proposed-publication"
                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                    : "text-base-content/70 hover:bg-base-200"
                  }`}
                onClick={() => formData.blgfNoticeDate && setActiveTab("proposed-publication")}
              >
                <span className="text-xl md:text-2xl drop-shadow-sm">📰</span>
                <span className="font-medium whitespace-nowrap text-[13px] md:text-sm tracking-wide">Publication</span>
              </button>
            </div>

            {/* Tab 4: Review & Publication */}
            <div className="relative group">
              <button
                type="button"
                disabled={!formData.blgfNoticeDate}
                className={`min-w-fit flex-1 md:flex-none md:w-full text-left p-2.5 md:p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${!formData.blgfNoticeDate
                  ? "opacity-40 cursor-not-allowed grayscale"
                  : activeTab === "review-publication"
                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                    : "text-base-content/70 hover:bg-base-200"
                  }`}
                onClick={() => formData.blgfNoticeDate && setActiveTab("review-publication")}
              >
                <span className="text-xl md:text-2xl drop-shadow-sm">✅</span>
                <span className="font-medium whitespace-nowrap text-[13px] md:text-sm tracking-wide">Review Phase</span>
              </button>
            </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-base-100 p-6 md:p-10 relative">
              {/* Timeline Tab Content */}
          {activeTab === "timeline" && (
            <div className="space-y-3">
              {/* Info Banner */}
              <div className="alert alert-info text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">💡 Quick Tip</p>
                  <p>Set the BLGF Notice Date (Day 0), then click "Auto-Calculate" to generate all other deadlines based on RA 12001 requirements.</p>
                </div>
              </div>

              {/* Day 0 - BLGF Notice Date */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-primary">
                    🔔 BLGF Notice Date (Day 1) *
                  </span>
                </label>
                <DateInput
                  name="blgfNoticeDate"
                  value={formData.blgfNoticeDate}
                  onChange={handleChange}
                  className="input input-bordered input-primary"
                  placeholder="Select BLGF notice date..."
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    When BLGF Central Office issued the notice to prepare SMV
                  </span>
                </label>
              </div>

              {/* Other Timeline Fields - Vertical Clean Flow */}
              <div className="flex flex-col gap-4 mt-2">
                {/* 1st Publication */}
                <div className="form-control bg-base-100 p-4 rounded-xl border border-base-200 hover:border-base-300 transition-colors shadow-sm relative">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">📰</span> 1st Publication Deadline
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info" data-tip="First publication of the proposed Schedule of Market Values (SMV)">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                  </div>
                  <DateInput
                    name="firstPublicationDate"
                    value={formData.firstPublicationDate}
                    onChange={handleChange}
                    className="input input-bordered input-sm md:input-md w-full md:max-w-md"
                    placeholder="Select 1st publication date..."
                  />
                </div>

                {/* 2nd Publication */}
                <div className="form-control bg-base-100 p-4 rounded-xl border border-base-200 hover:border-base-300 transition-colors shadow-sm relative">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">📰</span> 2nd Publication Date
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info" data-tip="Second publication can occur on the exact same day as the 1st publication, or later.">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                  </div>
                  <DateInput
                    name="secondPublicationDate"
                    value={formData.secondPublicationDate}
                    onChange={handleChange}
                    className="input input-bordered input-sm md:input-md w-full md:max-w-md"
                    min={formData.firstPublicationDate}
                    placeholder="Select 2nd publication date..."
                  />
                  {formData.firstPublicationDate && (
                    <span className="text-xs text-info font-medium mt-2 ml-1">
                      Same day or after: {formatDateLong(formData.firstPublicationDate)}
                    </span>
                  )}
                </div>

                {/* 1st Public Consultation */}
                <div className={`form-control bg-base-100 p-4 rounded-xl border ${errors.firstPublicConsultationDate ? 'border-error shadow-error/10' : 'border-base-200 hover:border-base-300'} transition-colors shadow-sm relative`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">👥</span> 1st Public Consultation
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info z-50 text-left" data-tip="Must occur at least 2 weeks after the 2nd Publication.">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                  </div>
                  <DateInput
                    name="firstPublicConsultationDate"
                    value={formData.firstPublicConsultationDate}
                    onChange={handleChange}
                    className={`input input-bordered input-sm md:input-md w-full md:max-w-md ${errors.firstPublicConsultationDate ? 'input-error' : ''}`}
                    min={(() => {
                      if (formData.secondPublicationDate) {
                        return new Date(new Date(formData.secondPublicationDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      }
                      return undefined;
                    })()}
                    placeholder="Select 1st consultation date..."
                  />
                  {errors.firstPublicConsultationDate ? (
                    <span className="label-text-alt text-xs text-error mt-2 font-medium">⚠️ {errors.firstPublicConsultationDate}</span>
                  ) : (
                    formData.secondPublicationDate ? (
                      <span className="text-xs text-warning font-medium mt-2 ml-1">
                        Minimum Date: {formatDateLong((() => {
                          const secondPubDate = new Date(formData.secondPublicationDate);
                          return new Date(secondPubDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        })())}
                      </span>
                    ) : (
                      <span className="text-xs text-warning mt-2 ml-1 opacity-70">
                        ⚠️ Please set the 2nd Publication Date first
                      </span>
                    )
                  )}
                </div>

                {/* 2nd Public Consultation */}
                <div className={`form-control bg-base-100 p-4 rounded-xl border ${errors.secondPublicConsultationDate ? 'border-error shadow-error/10' : 'border-base-200 hover:border-base-300'} transition-colors shadow-sm relative`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">👥</span> 2nd Public Consultation
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info z-50 text-left" data-tip="Can be conducted on the same day as the 1st Consultation, or afterwards.">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                  </div>
                  <DateInput
                    name="secondPublicConsultationDate"
                    value={formData.secondPublicConsultationDate}
                    onChange={handleChange}
                    className={`input input-bordered input-sm md:input-md w-full md:max-w-md ${errors.secondPublicConsultationDate ? 'input-error' : ''}`}
                    min={formData.firstPublicConsultationDate}
                    placeholder="Select 2nd consultation date..."
                  />
                  {errors.secondPublicConsultationDate ? (
                    <span className="label-text-alt text-xs text-error mt-2 font-medium">⚠️ {errors.secondPublicConsultationDate}</span>
                  ) : formData.firstPublicConsultationDate && (
                    <span className="text-xs text-info font-medium mt-2 ml-1">
                      Same day or after: {formatDateLong(formData.firstPublicConsultationDate)}
                    </span>
                  )}
                </div>

                {/* Submission to BLGF Regional Office */}
                <div className={`form-control bg-base-100 p-4 rounded-xl border ${errors.regionalOfficeSubmissionDeadline ? 'border-error shadow-error/10' : 'border-base-200 hover:border-base-300'} transition-colors shadow-sm relative`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">📤</span> RO Submission
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info z-50 text-left" data-tip="Submission of Proposed SMV to BLGF Regional Office. Must occur within 60 days of the 2nd Public Consultation.">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                  </div>
                  <DateInput
                    name="regionalOfficeSubmissionDeadline"
                    value={formData.regionalOfficeSubmissionDeadline}
                    onChange={handleChange}
                    className={`input input-bordered input-sm md:input-md w-full md:max-w-md ${errors.regionalOfficeSubmissionDeadline ? 'input-error' : ''}`}
                    min={formData.secondPublicConsultationDate}
                    placeholder="Select submission date..."
                  />
                  {errors.regionalOfficeSubmissionDeadline ? (
                    <span className="label-text-alt text-xs text-error mt-2 font-medium">⚠️ {errors.regionalOfficeSubmissionDeadline}</span>
                  ) : formData.secondPublicConsultationDate && (
                    <span className="text-xs text-info font-medium mt-2 ml-1">
                      Valid Range: {formatDateLong(formData.secondPublicConsultationDate)} to {formatDateLong(new Date(new Date(formData.secondPublicConsultationDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                    </span>
                  )}
                </div>

                {/* BLGF RO Review and Endorsement */}
                <div className="form-control bg-base-100 p-4 rounded-xl border border-base-200 hover:border-base-300 transition-colors shadow-sm relative">
                  <div className="flex justify-between items-start mb-2 pr-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">📋</span> RO Review & Endorsement
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info z-50 text-left" data-tip="BLGF Regional Office Review and Endorsement. Expected within 45 days of RO Submission (RPVARA IRR Section 29).">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                    {(() => {
                      if (formData.roReviewDeadline) {
                        const cd = calculateCountdown(formData.roReviewDeadline);
                        return cd && <span className={`badge badge-sm flex-shrink-0 whitespace-nowrap ml-4 ${cd.color}`}>{cd.icon} {cd.text}</span>;
                      } else if (formData.regionalOfficeSubmissionDeadline) {
                        const recDate = new Date(formData.regionalOfficeSubmissionDeadline);
                        recDate.setDate(recDate.getDate() + 45);
                        const warn = calculateDeadlineWarning(recDate.toISOString().split('T')[0]);
                        return warn && <span className={`badge badge-sm flex-shrink-0 whitespace-nowrap ml-4 ${warn.color}`}>{warn.icon} {warn.text}</span>;
                      }
                      return null;
                    })()}
                  </div>
                  <DateInput
                    name="roReviewDeadline"
                    value={formData.roReviewDeadline}
                    onChange={handleChange}
                    className="input input-bordered input-sm md:input-md w-full md:max-w-md"
                    placeholder="Select review deadline..."
                    max={formData.regionalOfficeSubmissionDeadline ? (() => {
                      const maxDate = new Date(formData.regionalOfficeSubmissionDeadline);
                      maxDate.setDate(maxDate.getDate() + 45);
                      return maxDate.toISOString().split('T')[0];
                    })() : undefined}
                    min={formData.regionalOfficeSubmissionDeadline}
                  />
                  {formData.regionalOfficeSubmissionDeadline && (
                    <span className="text-xs text-base-content/50 font-medium mt-2 ml-1">
                      Recommended Date: {formatDateLong((() => {
                        const d = new Date(formData.regionalOfficeSubmissionDeadline);
                        d.setDate(d.getDate() + 45);
                        return d.toISOString().split('T')[0];
                      })())}
                    </span>
                  )}
                </div>

                {/* BLGF Central Office Review */}
                <div className="form-control bg-base-100 p-4 rounded-xl border border-base-200 hover:border-base-300 transition-colors shadow-sm relative">
                  <div className="flex justify-between items-start mb-2 pr-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">🏢</span> CO Review & Endorsement
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info z-50 text-left" data-tip="BLGF Central Office Review and Endorsement. Expected within 30 days of RO Endorsement (RPVARA IRR).">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                    {(() => {
                      if (formData.blgfCentralOfficeReviewDeadline) {
                        const cd = calculateCountdown(formData.blgfCentralOfficeReviewDeadline);
                        return cd && <span className={`badge badge-sm flex-shrink-0 whitespace-nowrap ml-4 ${cd.color}`}>{cd.icon} {cd.text}</span>;
                      } else if (formData.roReviewDeadline) {
                        const recDate = new Date(formData.roReviewDeadline);
                        recDate.setDate(recDate.getDate() + 30);
                        const warn = calculateDeadlineWarning(recDate.toISOString().split('T')[0]);
                        return warn && <span className={`badge badge-sm flex-shrink-0 whitespace-nowrap ml-4 ${warn.color}`}>{warn.icon} {warn.text}</span>;
                      }
                      return null;
                    })()}
                  </div>
                  <DateInput
                    name="blgfCentralOfficeReviewDeadline"
                    value={formData.blgfCentralOfficeReviewDeadline}
                    onChange={handleChange}
                    className="input input-bordered input-sm md:input-md w-full md:max-w-md"
                    placeholder="Select CO review deadline..."
                    max={formData.roReviewDeadline ? (() => {
                      const maxDate = new Date(formData.roReviewDeadline);
                      maxDate.setDate(maxDate.getDate() + 30);
                      return maxDate.toISOString().split('T')[0];
                    })() : undefined}
                    min={formData.roReviewDeadline}
                  />
                  {formData.roReviewDeadline && (
                    <span className="text-xs text-base-content/50 font-medium mt-2 ml-1">
                      Recommended Date: {formatDateLong((() => {
                        const d = new Date(formData.roReviewDeadline);
                        d.setDate(d.getDate() + 30);
                        return d.toISOString().split('T')[0];
                      })())}
                    </span>
                  )}
                </div>

                {/* Secretary of Finance Review */}
                <div className="form-control bg-base-100 p-4 rounded-xl border border-base-200 hover:border-base-300 transition-colors shadow-sm relative">
                  <div className="flex justify-between items-start mb-2 pr-2">
                    <label className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <span className="text-lg">⚖️</span> SoF Approval
                      <div className="tooltip tooltip-right cursor-help text-base-content/40 hover:text-info z-50 text-left" data-tip="Secretary of Finance Review and Approval. Expected within 30 days of CO Endorsement (RPVARA IRR).">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </label>
                    {(() => {
                      if (formData.secretaryOfFinanceReviewDeadline) {
                        const cd = calculateCountdown(formData.secretaryOfFinanceReviewDeadline);
                        return cd && <span className={`badge badge-sm flex-shrink-0 whitespace-nowrap ml-4 ${cd.color}`}>{cd.icon} {cd.text}</span>;
                      } else if (formData.blgfCentralOfficeReviewDeadline) {
                        const recDate = new Date(formData.blgfCentralOfficeReviewDeadline);
                        recDate.setDate(recDate.getDate() + 30);
                        const warn = calculateDeadlineWarning(recDate.toISOString().split('T')[0]);
                        return warn && <span className={`badge badge-sm flex-shrink-0 whitespace-nowrap ml-4 ${warn.color}`}>{warn.icon} {warn.text}</span>;
                      }
                      return null;
                    })()}
                  </div>
                  <DateInput
                    name="secretaryOfFinanceReviewDeadline"
                    value={formData.secretaryOfFinanceReviewDeadline}
                    onChange={handleChange}
                    className="input input-bordered input-sm md:input-md w-full md:max-w-md"
                    placeholder="Select SoF approval deadline..."
                    max={formData.blgfCentralOfficeReviewDeadline ? (() => {
                      const maxDate = new Date(formData.blgfCentralOfficeReviewDeadline);
                      maxDate.setDate(maxDate.getDate() + 30);
                      return maxDate.toISOString().split('T')[0];
                    })() : undefined}
                    min={formData.blgfCentralOfficeReviewDeadline}
                  />
                  {formData.blgfCentralOfficeReviewDeadline && (
                    <span className="text-xs text-base-content/50 font-medium mt-2 ml-1">
                      Recommended Date: {formatDateLong((() => {
                        const d = new Date(formData.blgfCentralOfficeReviewDeadline);
                        d.setDate(d.getDate() + 30);
                        return d.toISOString().split('T')[0];
                      })())}
                    </span>
                  )}
                </div>
              </div>


            </div>
          )}

          {/* Development of Proposed SMV Tab Content - EDITABLE */}
          {activeTab === "development" && (
            <div className="p-5">
              {/* Summary Stats - Compact Design */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-gradient-to-br from-base-200 to-base-300/50 rounded-lg p-2 border border-base-300/50 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Total</div>
                  <div className="text-xl font-bold text-base-content">{Object.values(activities).flat().length}</div>
                </div>
                <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-2 border border-success/20 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Completed</div>
                  <div className="text-xl font-bold text-success">
                    {Object.values(activities).flat().filter(a => a.status === "Completed").length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-2 border border-primary/20 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Progress</div>
                  <div className="text-xl font-bold text-primary">
                    {Math.round((Object.values(activities).flat().filter(a => a.status === "Completed").length / Object.values(activities).flat().length) * 100)}%
                  </div>
                </div>
              </div>

              {/* Activity Details by Stage - EDITABLE with Collapsible Sections */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto smooth-scroll">
                {Object.entries(activities).map(([stageName, stageActivities]) => (
                  <div key={stageName} className="collapse collapse-arrow border border-base-300 rounded-xl bg-base-100 hover:shadow-md transition-all">
                    <input type="checkbox" defaultChecked />
                    
                    {/* Stage Header */}
                    <div className="collapse-title bg-primary/10 p-2.5 border-b border-base-300 min-h-0 py-2.5">
                      <h4 className="font-bold text-sm text-base-content flex items-center justify-between pr-8">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {stageName}
                        </span>
                        <span className="badge badge-sm badge-primary">
                          {stageActivities.filter(a => a.status === "Completed").length} / {stageActivities.length}
                        </span>
                      </h4>
                    </div>

                    {/* Activity Table - EDITABLE */}
                    <div className="collapse-content p-0">
                      <div className="overflow-x-auto">
                      <div className="flex flex-col bg-base-100 divide-y divide-base-200 rounded-b-xl">
                        {stageActivities.map((activity, idx) => (
                          <div key={activity._id || idx} className="flex flex-col lg:flex-row lg:items-center py-2.5 px-4 hover:bg-base-200/30 transition-colors gap-3 group">
                            {/* Left Side: Status & Name */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <select
                                value={activity.status}
                                onChange={(e) => handleActivityChange(stageName, idx, 'status', e.target.value)}
                                className={`select select-sm border focus:ring-2 focus:ring-offset-1 rounded-full px-4 h-8 min-h-0 text-[11px] font-bold transition-all shadow-sm ${
                                  activity.status === 'Completed' ? 'bg-success/10 text-success border-success/30 hover:border-success focus:ring-success/30' :
                                  activity.status === 'In Progress' ? 'bg-warning/10 text-warning-content border-warning/50 hover:border-warning focus:ring-warning/30' :
                                  'bg-base-200 text-base-content/60 border-transparent hover:border-base-300 focus:ring-base-content/20'
                                }`}
                              >
                                <option value="Not Started" className="font-medium">Pending</option>
                                <option value="In Progress" className="font-medium text-warning">Working</option>
                                <option value="Completed" className="font-medium text-success">Done</option>
                              </select>
                              <span className={`text-sm font-medium transition-colors line-clamp-2 ${activity.status === 'Completed' ? 'text-base-content/40 line-through decoration-base-content/20' : 'text-base-content'}`}>
                                {activity.name}
                              </span>
                            </div>

                            {/* Right Side: Inputs */}
                            <div className="flex items-center gap-3 lg:justify-end lg:w-[400px] flex-shrink-0 ml-10 lg:ml-0 lg:opacity-50 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <div className="w-[110px] flex-shrink-0">
                                <DateInput
                                  name={`activity-${stageName}-${idx}`}
                                  value={activity.dateCompleted || ''}
                                  onChange={(e) => handleActivityChange(stageName, idx, 'dateCompleted', e.target.value)}
                                  className="w-full text-[11px] bg-transparent border-b border-transparent hover:border-base-300 focus:border-primary hover:bg-base-200/50 px-1 py-1 transition-all text-base-content cursor-pointer"
                                  placeholder="Set Date"
                                />
                              </div>
                              <input
                                type="text"
                                value={activity.remarks || ''}
                                onChange={(e) => handleActivityChange(stageName, idx, 'remarks', e.target.value)}
                                placeholder="Add remarks..."
                                className="flex-1 min-w-[140px] text-xs bg-transparent border-b border-base-200 hover:border-base-300 focus:border-primary focus:bg-base-200/30 hover:bg-base-200/50 focus:outline-none px-2 py-1 transition-all text-base-content"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          )}

          {/* Tab 3: Publication of Proposed SMV (Pre-submission) */}
          {activeTab === "proposed-publication" && (
            <div className="p-5">
              {/* Info Banner */}
              <div className="alert alert-info text-sm mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-base-content">
                  <p className="font-semibold">Publication of Proposed SMV Requirements (RPVARA IRR Section 27)</p>
                  <p className="text-xs">LGU must publish the proposed SMV for 2 weeks prior to public consultation. Public consultation and hearing must be conducted within sixty (60) days before submission to Regional Office (0-60 days gap allowed).</p>
                </div>
              </div>

              {/* Summary Stats - Compact Design */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-gradient-to-br from-base-200 to-base-300/50 rounded-lg p-2 border border-base-300/50 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Total</div>
                  <div className="text-xl font-bold text-base-content">{proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote).length}</div>
                </div>
                <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-2 border border-success/20 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Completed</div>
                  <div className="text-xl font-bold text-success">
                    {proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote && a.status === "Completed").length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-2 border border-primary/20 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Progress</div>
                  <div className="text-xl font-bold text-primary">
                    {Math.round((proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote && a.status === "Completed").length / proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote).length) * 100)}%
                  </div>
                </div>
              </div>

              {/* Publication Activities - Collapsible Sections */}
              <div className="space-y-2">
                {(() => {
                  // Group activities by headers
                  const groups = [];
                  let currentGroup = null;

                  proposedPublicationActivities.forEach((activity, idx) => {
                    if (activity.isHeader) {
                      // Start new group
                      if (currentGroup) groups.push(currentGroup);
                      currentGroup = { header: activity, activities: [], startIdx: idx };
                    } else if (currentGroup) {
                      // Add to current group
                      currentGroup.activities.push({ ...activity, originalIdx: idx });
                    }
                  });
                  if (currentGroup) groups.push(currentGroup);

                  return groups.map((group, groupIdx) => {
                    const completedCount = group.activities.filter(a => !a.isNote && a.status === "Completed").length;
                    const totalCount = group.activities.filter(a => !a.isNote).length;

                    return (
                      <div key={groupIdx} className="collapse collapse-arrow border border-base-300 rounded-lg bg-base-100">
                        <input type="checkbox" defaultChecked />
                        
                        {/* Group Header */}
                        <div className="collapse-title bg-primary/10 p-2.5 border-b border-base-300 min-h-0 py-2.5">
                          <h4 className="font-bold text-sm text-base-content flex items-center justify-between pr-8">
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {group.header.name.replace(':', '')}
                            </span>
                            <span className="badge badge-sm badge-primary flex-shrink-0 whitespace-nowrap">
                              {completedCount} / {totalCount}
                            </span>
                          </h4>
                        </div>

                        {/* Activities Table */}
                        <div className="collapse-content p-0">
                          <div className="overflow-x-auto">
                              <div className="flex flex-col bg-base-100 divide-y divide-base-200 rounded-b-xl">
                                {group.activities.map((activity) => {
                                  // Note rows
                                  if (activity.isNote) {
                                    return (
                                      <div key={activity.originalIdx} className="py-2.5 px-4 bg-warning/10 text-sm italic text-base-content/70">
                                        {activity.name}
                                      </div>
                                    );
                                  }
                                  // Regular activity rows
                                  return (
                                    <div key={activity.originalIdx} className="flex flex-col lg:flex-row lg:items-center py-2.5 px-4 hover:bg-base-200/30 transition-colors gap-3 group">
                                      {/* Left Side: Status & Name */}
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <select
                                          value={activity.status}
                                          onChange={(e) => handleProposedPublicationChange(activity.originalIdx, 'status', e.target.value)}
                                          className={`select select-sm border focus:ring-2 focus:ring-offset-1 rounded-full px-2 w-[110px] flex-shrink-0 h-8 min-h-0 text-[11px] font-bold transition-all shadow-sm ${
                                            activity.status === 'Completed' ? 'bg-success/10 text-success border-success/30 hover:border-success focus:ring-success/30' :
                                            activity.status === 'In Progress' ? 'bg-warning/10 text-warning-content border-warning/50 hover:border-warning focus:ring-warning/30' :
                                            'bg-base-200 text-base-content/60 border-transparent hover:border-base-300 focus:ring-base-content/20'
                                          }`}
                                        >
                                          <option value="Not Started" className="font-medium">Pending</option>
                                          <option value="In Progress" className="font-medium text-warning">Working</option>
                                          <option value="Completed" className="font-medium text-success">Done</option>
                                        </select>
                                        <span className={`text-sm font-medium transition-colors line-clamp-2 ${activity.status === 'Completed' ? 'text-base-content/40 line-through decoration-base-content/20' : 'text-base-content'}`}>
                                          {activity.name}
                                        </span>
                                      </div>

                                      {/* Right Side: Inputs */}
                                      <div className="flex items-center gap-3 lg:justify-end lg:w-[300px] flex-shrink-0 ml-10 lg:ml-0 lg:opacity-50 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                        <div className="w-[110px] flex-shrink-0">
                                          <input
                                            type="text"
                                            value={activity.dateCompleted || ''}
                                            onChange={(e) => handleProposedPublicationChange(activity.originalIdx, 'dateCompleted', e.target.value)}
                                            placeholder="Date or range"
                                            className="w-full text-[11px] bg-transparent border-b border-base-200 hover:border-base-300 focus:border-primary focus:bg-base-200/30 hover:bg-base-200/50 focus:outline-none px-1 py-1 transition-all text-base-content"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          value={activity.remarks || ''}
                                          onChange={(e) => handleProposedPublicationChange(activity.originalIdx, 'remarks', e.target.value)}
                                          placeholder="Add remarks..."
                                          className="flex-1 min-w-[140px] text-xs bg-transparent border-b border-base-200 hover:border-base-300 focus:border-primary focus:bg-base-200/30 hover:bg-base-200/50 focus:outline-none px-2 py-1 transition-all text-base-content"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
              </div>

            </div>
          )}

          {/* Tab 4: Review & Publication (Post-submission) */}
          {activeTab === "review-publication" && (
            <div>
              {/* Sticky Header Section */}
              <div className="sticky top-0 z-10 bg-base-100 p-5 pb-3 border-b border-base-300">
                {/* Info Banner */}
                <div className="alert alert-info text-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-base-content">
                    <p className="font-semibold">Review & Publication Process</p>
                    <p className="text-xs">Track the submission, review, certification, and final publication of the certified SMV through Regional Office, Central Office, and Secretary of Finance approval stages.</p>
                  </div>
                </div>

                {/* Summary Stats - Compact Design */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-base-200 to-base-300/50 rounded-lg p-2 border border-base-300/50 shadow-sm">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Total</div>
                    <div className="text-xl font-bold text-base-content">{reviewPublicationActivities.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-2 border border-success/20 shadow-sm">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Completed</div>
                    <div className="text-xl font-bold text-success">
                      {reviewPublicationActivities.filter(a => a.status === "Completed").length}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-2 border border-primary/20 shadow-sm">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5">Progress</div>
                    <div className="text-xl font-bold text-primary">
                      {Math.round((reviewPublicationActivities.filter(a => a.status === "Completed").length / reviewPublicationActivities.length) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Table Content */}
              <div className="p-5 pt-3">
                {/* Review & Publication Activities - Collapsible Sections */}
                <div className="space-y-2">
                  {(() => {
                    // Define logical groups for Tab 4 activities
                    const groups = [
                      { 
                        title: "Submission to Regional Office",
                        startIdx: 0,
                        endIdx: 1
                      },
                      {
                        title: "BLGF Review Process",
                        startIdx: 1,
                        endIdx: 4
                      },
                      {
                        title: "Publication of Certified SMV",
                        startIdx: 4,
                        endIdx: 8
                      },
                      {
                        title: "Post-Publication Activities",
                        startIdx: 8,
                        endIdx: reviewPublicationActivities.length
                      }
                    ];

                    return groups.map((group, groupIdx) => {
                      const groupActivities = reviewPublicationActivities.slice(group.startIdx, group.endIdx);
                      const completedCount = groupActivities.filter(a => a.status === "Completed").length;
                      const totalCount = groupActivities.length;

                      return (
                        <div key={groupIdx} className="collapse collapse-arrow border border-base-300 rounded-lg bg-base-100">
                          <input type="checkbox" defaultChecked />
                          
                          {/* Group Header */}
                          <div className="collapse-title bg-primary/10 p-2.5 border-b border-base-300 min-h-0 py-2.5">
                            <h4 className="font-bold text-sm text-base-content flex items-center justify-between pr-8">
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {group.title}
                              </span>
                              <span className="badge badge-sm badge-primary">
                                {completedCount} / {totalCount}
                              </span>
                            </h4>
                          </div>

                          {/* Activities Table */}
                          <div className="collapse-content p-0">
                            <div className="overflow-x-auto">
                              <div className="flex flex-col bg-base-100 divide-y divide-base-200 rounded-b-xl">
                                {groupActivities.map((activity, relIdx) => {
                                  const idx = group.startIdx + relIdx;
                                  return (
                                    <div key={idx} className="flex flex-col lg:flex-row lg:items-center py-2.5 px-4 hover:bg-base-200/30 transition-colors gap-3 group">
                                      {/* Left Side: Status & Name */}
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <select
                                          value={activity.status}
                                          onChange={(e) => handleReviewPublicationChange(idx, 'status', e.target.value)}
                                          className={`select select-sm border focus:ring-2 focus:ring-offset-1 rounded-full px-2 w-[110px] flex-shrink-0 h-8 min-h-0 text-[11px] font-bold transition-all shadow-sm ${
                                            activity.status === 'Completed' ? 'bg-success/10 text-success border-success/30 hover:border-success focus:ring-success/30' :
                                            activity.status === 'In Progress' ? 'bg-warning/10 text-warning-content border-warning/50 hover:border-warning focus:ring-warning/30' :
                                            'bg-base-200 text-base-content/60 border-transparent hover:border-base-300 focus:ring-base-content/20'
                                          }`}
                                        >
                                          <option value="Not Started" className="font-medium">Pending</option>
                                          <option value="In Progress" className="font-medium text-warning">Working</option>
                                          <option value="Completed" className="font-medium text-success">Done</option>
                                        </select>
                                        <span className={`text-sm font-medium transition-colors line-clamp-2 ${activity.status === 'Completed' ? 'text-base-content/40 line-through decoration-base-content/20' : 'text-base-content'}`}>
                                          {activity.name}
                                        </span>
                                      </div>

                                      {/* Right Side: Inputs */}
                                      <div className="flex items-center gap-3 lg:justify-end lg:w-[300px] flex-shrink-0 ml-10 lg:ml-0 lg:opacity-50 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                        <div className="w-[110px] flex-shrink-0">
                                          <input
                                            type="text"
                                            value={activity.dateCompleted || ''}
                                            onChange={(e) => handleReviewPublicationChange(idx, 'dateCompleted', e.target.value)}
                                            placeholder="Date or range"
                                            className="w-full text-[11px] bg-transparent border-b border-base-200 hover:border-base-300 focus:border-primary focus:bg-base-200/30 hover:bg-base-200/50 focus:outline-none px-1 py-1 transition-all text-base-content"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          value={activity.remarks || ''}
                                          onChange={(e) => handleReviewPublicationChange(idx, 'remarks', e.target.value)}
                                          placeholder="Add remarks..."
                                          className="flex-1 min-w-[140px] text-xs bg-transparent border-b border-base-200 hover:border-base-300 focus:border-primary focus:bg-base-200/30 hover:bg-base-200/50 focus:outline-none px-2 py-1 transition-all text-base-content"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Sticky Footer - Only show when changes made */}
        {hasChanges && (
          <div className="flex-shrink-0 border-t border-base-300 bg-base-100 p-3 rounded-b-xl shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-warning">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium">You have unsaved changes</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost text-base-content"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
