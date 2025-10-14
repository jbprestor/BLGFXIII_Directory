import { useState, useEffect, useMemo, useRef } from "react";
import useEscapeKey from "../../../hooks/useEscapeKey.js";
import useBodyScrollLock from "../../../hooks/useBodyScrollLock.js";
import toast from "react-hot-toast";

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
const DateInput = ({ name, value, onChange, className, min, placeholder = "Select date..." }) => {
  const dateInputRef = useRef(null);

  const handleClick = () => {
    // Try to use showPicker if available (modern browsers)
    if (dateInputRef.current?.showPicker) {
      try {
        dateInputRef.current.showPicker();
      } catch (error) {
        // Fallback: focus the input to show native date picker
        dateInputRef.current?.focus();
        dateInputRef.current?.click();
      }
    } else {
      // Fallback for older browsers
      dateInputRef.current?.focus();
      dateInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={dateInputRef}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        style={{ pointerEvents: 'auto' }}
      />
      <button
        type="button"
        onClick={handleClick}
        className={`${className} text-left flex items-center justify-between gap-2 w-full relative z-0`}
        tabIndex={-1}
      >
        <span className={value ? "text-base-content" : "text-base-content/40"}>
          {value ? formatDateLong(value) : placeholder}
        </span>
        <svg className="w-4 h-4 text-base-content/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
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
      
      // Auto-calculate RO Review deadline (45 days after RO Submission)
      let roReview = "";
      let blgfCOReview = "";
      let sofReview = "";
      
      if (roSubmission) {
        const roDate = new Date(roSubmission);
        roDate.setDate(roDate.getDate() + 45);
        roReview = roDate.toISOString().split('T')[0];
        
        // Auto-calculate BLGF CO Review (RO Review + 30 days)
        const coDate = new Date(roDate);
        coDate.setDate(coDate.getDate() + 30);
        blgfCOReview = coDate.toISOString().split('T')[0];
        
        // Auto-calculate SOF Review (BLGF CO + 30 days)
        const sofDate = new Date(coDate);
        sofDate.setDate(sofDate.getDate() + 30);
        sofReview = sofDate.toISOString().split('T')[0];
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

  // Auto-calculate all review deadlines when RO Submission date changes
  useEffect(() => {
    if (formData.regionalOfficeSubmissionDeadline) {
      const roDate = new Date(formData.regionalOfficeSubmissionDeadline + 'T00:00:00');
      roDate.setDate(roDate.getDate() + 45); // Add 45 days per RPVARA IRR Section 29
      const newRoReview = roDate.toISOString().split('T')[0];
      
      // Calculate BLGF CO Review (RO Review + 30 days)
      const coDate = new Date(roDate);
      coDate.setDate(coDate.getDate() + 30);
      const newCOReview = coDate.toISOString().split('T')[0];
      
      // Calculate SOF Review (BLGF CO + 30 days)
      const sofDate = new Date(coDate);
      sofDate.setDate(sofDate.getDate() + 30);
      const newSOFReview = sofDate.toISOString().split('T')[0];
      
      // Only update if different to prevent infinite loop
      if (newRoReview !== formData.roReviewDeadline || 
          newCOReview !== formData.blgfCentralOfficeReviewDeadline ||
          newSOFReview !== formData.secretaryOfFinanceReviewDeadline) {
        setFormData(prev => ({
          ...prev,
          roReviewDeadline: newRoReview,
          blgfCentralOfficeReviewDeadline: newCOReview,
          secretaryOfFinanceReviewDeadline: newSOFReview
        }));
      }
    } else {
      // Clear all review deadlines if RO Submission is cleared
      if (formData.roReviewDeadline || formData.blgfCentralOfficeReviewDeadline || formData.secretaryOfFinanceReviewDeadline) {
        setFormData(prev => ({
          ...prev,
          roReviewDeadline: "",
          blgfCentralOfficeReviewDeadline: "",
          secretaryOfFinanceReviewDeadline: ""
        }));
      }
    }
  }, [formData.regionalOfficeSubmissionDeadline]);

  // Note: Cascading auto-calculation removed - now handled by Auto-Calculate button with 4 separate fields

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors for this field
    setErrors(prev => ({ ...prev, [name]: "" }));
    
    // VALIDATION 1: 1st Public Consultation must be at least 2 weeks after 1st Publication AND not before 2nd Publication
    if (name === 'firstPublicConsultationDate' && value) {
      const firstConsDate = new Date(value);
      
      // Check 1: Must be at least 2 weeks after 1st Publication
      if (formData.firstPublicationDate) {
        const firstPubDate = new Date(formData.firstPublicationDate);
        const diffTime = firstConsDate - firstPubDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 14) {
          setErrors(prev => ({
            ...prev,
            firstPublicConsultationDate: `Must be at least 2 weeks (14 days) after 1st Publication (${formatDateLong(formData.firstPublicationDate)})`
          }));
          return;
        }
      }
      
      // Check 2: Must not be before 2nd Publication
      if (formData.secondPublicationDate) {
        const secondPubDate = new Date(formData.secondPublicationDate);
        if (firstConsDate < secondPubDate) {
          setErrors(prev => ({
            ...prev,
            firstPublicConsultationDate: `Must not be before 2nd Publication (${formatDateLong(formData.secondPublicationDate)})`
          }));
          return;
        }
      }
    }
    
    // VALIDATION 2: Public Consultations must be within 60 days BEFORE RO Submission (RPVARA IRR Section 27)
    // The 60-day period starts from the 1st Public Consultation
    if (name === 'regionalOfficeSubmissionDeadline' && value && formData.firstPublicConsultationDate) {
      const firstConsDate = new Date(formData.firstPublicConsultationDate);
      const roSubmissionDate = new Date(value);
      
      const diffTime = roSubmissionDate - firstConsDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // RO Submission must be WITHIN 60 days after 1st consultation (consultations within 60 days prior to submission)
      if (diffDays > 60) {
        setErrors(prev => ({
          ...prev,
          regionalOfficeSubmissionDeadline: `Consultations must be within 60 days before submission. Currently ${diffDays} days from 1st consultation (Max: 60 days)`
        }));
        return;
      }
      
      // Also ensure RO Submission is AFTER 1st consultation (consultation must happen first)
      if (diffDays < 0) {
        setErrors(prev => ({
          ...prev,
          regionalOfficeSubmissionDeadline: `Must be after 1st Public Consultation (${formatDateLong(formData.firstPublicConsultationDate)})`
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header - Sticky at top */}
        <div className="flex-shrink-0 bg-gradient-to-r from-primary to-secondary p-4 rounded-t-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                SMV Monitoring Details
              </h2>
              <p className="text-sm text-primary/80 mt-1">
                {lguData?.lguName} - {lguData?.region || "Caraga Region"}
              </p>
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

          {/* Tab Navigation - 4 tabs with locking logic */}
          <div className="flex gap-2">
            {/* Tab 1: Timeline - Always accessible */}
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "timeline"
                ? "bg-base-100 text-base-content shadow-lg"
                : "text-primary/70 hover:text-primary hover:bg-white/10"
                }`}
              onClick={() => setActiveTab("timeline")}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Timeline
              </div>
            </button>

            {/* Tab 2: Development - Locked until BLGF Notice Date is set */}
            <div className="flex-1 relative group">
              <button
                type="button"
                disabled={!formData.blgfNoticeDate}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${!formData.blgfNoticeDate
                  ? "opacity-50 cursor-not-allowed bg-base-300 text-base-content/40"
                  : activeTab === "development"
                    ? "bg-base-100 text-base-content shadow-lg"
                    : "text-primary/70 hover:text-primary hover:bg-white/10"
                  }`}
                onClick={() => formData.blgfNoticeDate && setActiveTab("development")}
              >
                <div className="flex items-center justify-center gap-2">
                  {!formData.blgfNoticeDate && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Development
                </div>
              </button>
              {!formData.blgfNoticeDate && (
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-base-100 text-base-content text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Please set BLGF Notice Date in Timeline tab first
                  </div>
                </div>
              )}
            </div>

            {/* Tab 3: Proposed Publication - Locked until BLGF Notice Date is set */}
            <div className="flex-1 relative group">
              <button
                type="button"
                disabled={!formData.blgfNoticeDate}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${!formData.blgfNoticeDate
                  ? "opacity-50 cursor-not-allowed bg-base-300 text-base-content/40"
                  : activeTab === "proposed-publication"
                    ? "bg-base-100 text-base-content shadow-lg"
                    : "text-primary/70 hover:text-primary hover:bg-white/10"
                  }`}
                onClick={() => formData.blgfNoticeDate && setActiveTab("proposed-publication")}
              >
                <div className="flex items-center justify-center gap-2">
                  {!formData.blgfNoticeDate && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Proposed Pub.
                </div>
              </button>
              {!formData.blgfNoticeDate && (
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-base-100 text-base-content text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Please set BLGF Notice Date in Timeline tab first
                  </div>
                </div>
              )}
            </div>

            {/* Tab 4: Review & Publication - Locked until BLGF Notice Date is set */}
            <div className="flex-1 relative group">
              <button
                type="button"
                disabled={!formData.blgfNoticeDate}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${!formData.blgfNoticeDate
                  ? "opacity-50 cursor-not-allowed bg-base-300 text-base-content/40"
                  : activeTab === "review-publication"
                    ? "bg-base-100 text-base-content shadow-lg"
                    : "text-primary/70 hover:text-primary hover:bg-white/10"
                  }`}
                onClick={() => formData.blgfNoticeDate && setActiveTab("review-publication")}
              >
                <div className="flex items-center justify-center gap-2">
                  {!formData.blgfNoticeDate && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Review & Pub.
                </div>
              </button>
              {!formData.blgfNoticeDate && (
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-base-100 text-base-content text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Please set BLGF Notice Date in Timeline tab first
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-y-auto ${activeTab === "review-publication" ? "" : "p-6"}`}>
          {/* Timeline Tab Content */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
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

              {/* Other Timeline Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Publication */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      � 1st Publication Deadline
                    </span>
                  </label>
                  <DateInput
                    name="firstPublicationDate"
                    value={formData.firstPublicationDate}
                    onChange={handleChange}
                    className="input input-bordered input-sm"
                    placeholder="Select 1st publication date..."
                  />
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/50">
                      First publication of proposed SMV
                    </span>
                  </label>
                </div>

                {/* 2nd Publication - automatically named */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      📰 2nd Publication Date
                    </span>
                  </label>
                  <DateInput
                    name="secondPublicationDate"
                    value={formData.secondPublicationDate}
                    onChange={handleChange}
                    className="input input-bordered input-sm"
                    min={formData.firstPublicationDate}
                    placeholder="Select 2nd publication date..."
                  />
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/50">
                      {formData.firstPublicationDate ? (
                        <>
                          Second publication (can be same day as 1st)
                          <span className="block text-info font-medium mt-1">
                            Same day or after: {formatDateLong(formData.firstPublicationDate)}
                          </span>
                        </>
                      ) : (
                        "Second publication (can be same day as 1st)"
                      )}
                    </span>
                  </label>
                </div>

                {/* 1st Public Consultation */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      👥 1st Public Consultation and Hearing
                    </span>
                  </label>
                  <DateInput
                    name="firstPublicConsultationDate"
                    value={formData.firstPublicConsultationDate}
                    onChange={handleChange}
                    className={`input input-bordered input-sm ${errors.firstPublicConsultationDate ? 'input-error' : ''}`}
                    min={(() => {
                      // Calculate minimum: whichever is LATER between (1st pub + 14 days) OR (2nd pub)
                      const dates = [];
                      if (formData.firstPublicationDate) {
                        const firstPubPlus14 = new Date(new Date(formData.firstPublicationDate).getTime() + 14 * 24 * 60 * 60 * 1000);
                        dates.push(firstPubPlus14);
                      }
                      if (formData.secondPublicationDate) {
                        dates.push(new Date(formData.secondPublicationDate));
                      }
                      return dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split('T')[0] : undefined;
                    })()}
                    placeholder="Select 1st consultation date..."
                  />
                  <label className="label">
                    {errors.firstPublicConsultationDate ? (
                      <span className="label-text-alt text-xs text-error">
                        ⚠️ {errors.firstPublicConsultationDate}
                      </span>
                    ) : (
                      <span className="label-text-alt text-xs text-base-content/50">
                        {formData.firstPublicationDate && formData.secondPublicationDate ? (
                          <>
                            At least 2 weeks after 1st Publication AND not before 2nd Publication
                            <span className="block text-warning font-medium mt-1">
                              ⚠️ Minimum date: {formatDateLong((() => {
                                const firstPubPlus14 = new Date(new Date(formData.firstPublicationDate).getTime() + 14 * 24 * 60 * 60 * 1000);
                                const secondPubDate = new Date(formData.secondPublicationDate);
                                return new Date(Math.max(firstPubPlus14, secondPubDate)).toISOString().split('T')[0];
                              })())}
                            </span>
                          </>
                        ) : (
                          <span className="text-warning">
                            ⚠️ Please set both Publication Dates first
                          </span>
                        )}
                      </span>
                    )}
                  </label>
                </div>

                {/* 2nd Public Consultation */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      � 2nd Public Consultation and Hearing
                    </span>
                  </label>
                  <DateInput
                    name="secondPublicConsultationDate"
                    value={formData.secondPublicConsultationDate}
                    onChange={handleChange}
                    className={`input input-bordered input-sm ${errors.secondPublicConsultationDate ? 'input-error' : ''}`}
                    min={formData.firstPublicConsultationDate}
                    placeholder="Select 2nd consultation date..."
                  />
                  <label className="label">
                    {errors.secondPublicConsultationDate ? (
                      <span className="label-text-alt text-xs text-error">
                        ⚠️ {errors.secondPublicConsultationDate}
                      </span>
                    ) : (
                      <span className="label-text-alt text-xs text-base-content/50">
                        {formData.firstPublicConsultationDate ? (
                          <>
                            Same day or after 1st Consultation (can be done together)
                            <span className="block text-info font-medium mt-1">
                              Same day or after: {formatDateLong(formData.firstPublicConsultationDate)}
                            </span>
                          </>
                        ) : (
                          "Same day or after 1st Consultation (can be done together)"
                        )}
                      </span>
                    )}
                  </label>
                </div>

                {/* Submission to BLGF Regional Office */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      � Submission of Proposed SMV to BLGF Regional Office
                    </span>
                  </label>
                  <DateInput
                    name="regionalOfficeSubmissionDeadline"
                    value={formData.regionalOfficeSubmissionDeadline}
                    onChange={handleChange}
                    className={`input input-bordered input-sm ${errors.regionalOfficeSubmissionDeadline ? 'input-error' : ''}`}
                    min={formData.firstPublicConsultationDate}
                    placeholder="Select RO submission date..."
                  />
                  <label className="label">
                    {errors.regionalOfficeSubmissionDeadline ? (
                      <span className="label-text-alt text-xs text-error">
                        ⚠️ {errors.regionalOfficeSubmissionDeadline}
                      </span>
                    ) : (
                      <span className="label-text-alt text-xs text-base-content/50">
                        {formData.firstPublicConsultationDate ? (
                          <>
                            Within 60 days from 1st Public Consultation (RPVARA Section 27)
                            <span className="block text-info font-medium mt-1">
                              Valid submission range: {formatDateLong(formData.firstPublicConsultationDate)} to {formatDateLong(new Date(new Date(formData.firstPublicConsultationDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                            </span>
                          </>
                        ) : (
                          "Within 60 days from 1st Public Consultation (RPVARA Section 27)"
                        )}
                      </span>
                    )}
                  </label>
                </div>

                {/* BLGF RO Review and Endorsement - Editable */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      📋 BLGF Regional Office Review and Endorsement
                      {formData.roReviewDeadline && calculateCountdown(formData.roReviewDeadline) && (
                        <span className={`badge badge-sm ${calculateCountdown(formData.roReviewDeadline).color}`}>
                          {calculateCountdown(formData.roReviewDeadline).icon} {calculateCountdown(formData.roReviewDeadline).text}
                        </span>
                      )}
                    </span>
                  </label>
                  <DateInput
                    name="roReviewDeadline"
                    value={formData.roReviewDeadline}
                    onChange={handleChange}
                    className="input input-bordered input-sm"
                    placeholder="Select RO review deadline..."
                    max={formData.regionalOfficeSubmissionDeadline ? (() => {
                      const maxDate = new Date(formData.regionalOfficeSubmissionDeadline + 'T00:00:00');
                      maxDate.setDate(maxDate.getDate() + 45);
                      return maxDate.toISOString().split('T')[0];
                    })() : undefined}
                    min={formData.regionalOfficeSubmissionDeadline}
                  />
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/50">
                      Auto-calculated: RO Submission + 45 days (RPVARA IRR Section 29)
                      {formData.regionalOfficeSubmissionDeadline && (
                        <span className="block text-info font-medium mt-1">
                          Review Deadline: {formatDateLong((() => {
                            const d = new Date(formData.regionalOfficeSubmissionDeadline + 'T00:00:00');
                            d.setDate(d.getDate() + 45);
                            return d.toISOString().split('T')[0];
                          })())}
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                {/* BLGF Central Office Review - Editable */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      📋 BLGF Central Office Review and Endorsement
                      {formData.blgfCentralOfficeReviewDeadline && calculateCountdown(formData.blgfCentralOfficeReviewDeadline) && (
                        <span className={`badge badge-sm ${calculateCountdown(formData.blgfCentralOfficeReviewDeadline).color}`}>
                          {calculateCountdown(formData.blgfCentralOfficeReviewDeadline).icon} {calculateCountdown(formData.blgfCentralOfficeReviewDeadline).text}
                        </span>
                      )}
                    </span>
                  </label>
                  <DateInput
                    name="blgfCentralOfficeReviewDeadline"
                    value={formData.blgfCentralOfficeReviewDeadline}
                    onChange={handleChange}
                    className="input input-bordered input-sm"
                    placeholder="Select BLGF CO review deadline..."
                    max={formData.roReviewDeadline ? (() => {
                      const maxDate = new Date(formData.roReviewDeadline + 'T00:00:00');
                      maxDate.setDate(maxDate.getDate() + 30);
                      return maxDate.toISOString().split('T')[0];
                    })() : undefined}
                    min={formData.roReviewDeadline}
                  />
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/50">
                      Auto-calculated: RO Review + 30 days (RPVARA IRR)
                      {formData.roReviewDeadline && (
                        <span className="block text-info font-medium mt-1">
                          Review Deadline: {formatDateLong((() => {
                            const d = new Date(formData.roReviewDeadline + 'T00:00:00');
                            d.setDate(d.getDate() + 30);
                            return d.toISOString().split('T')[0];
                          })())}
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                {/* Secretary of Finance Review - Editable */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      📋 Secretary of Finance Review and Approval
                      {formData.secretaryOfFinanceReviewDeadline && calculateCountdown(formData.secretaryOfFinanceReviewDeadline) && (
                        <span className={`badge badge-sm ${calculateCountdown(formData.secretaryOfFinanceReviewDeadline).color}`}>
                          {calculateCountdown(formData.secretaryOfFinanceReviewDeadline).icon} {calculateCountdown(formData.secretaryOfFinanceReviewDeadline).text}
                        </span>
                      )}
                    </span>
                  </label>
                  <DateInput
                    name="secretaryOfFinanceReviewDeadline"
                    value={formData.secretaryOfFinanceReviewDeadline}
                    onChange={handleChange}
                    className="input input-bordered input-sm"
                    placeholder="Select SOF review deadline..."
                    max={formData.blgfCentralOfficeReviewDeadline ? (() => {
                      const maxDate = new Date(formData.blgfCentralOfficeReviewDeadline + 'T00:00:00');
                      maxDate.setDate(maxDate.getDate() + 30);
                      return maxDate.toISOString().split('T')[0];
                    })() : undefined}
                    min={formData.blgfCentralOfficeReviewDeadline}
                  />
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/50">
                      Auto-calculated: BLGF CO Review + 30 days (RPVARA IRR)
                      {formData.secretaryOfFinanceReviewDeadline && (
                        <span className="block text-info font-medium mt-1">
                          Review Deadline: {formatDateLong(formData.secretaryOfFinanceReviewDeadline)}
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Auto-Calculate Button at Bottom */}
              {/* <div className="mt-6 pt-4 border-t border-base-300">
                <button
                  type="button"
                  onClick={handleAutoCalculate}
                  className="btn btn-secondary btn-sm w-full"
                  disabled={!formData.blgfNoticeDate}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Auto-Calculate All Deadlines from BLGF Notice
                </button>
                {!formData.blgfNoticeDate && (
                  <p className="text-xs text-warning text-center mt-2">
                    ⚠️ Set BLGF Notice Date first to use auto-calculation
                  </p>
                )}
              </div> */}
            </div>
          )}

          {/* Development of Proposed SMV Tab Content - EDITABLE */}
          {activeTab === "development" && (
            <div className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs text-base-content">Total Activities</div>
                  <div className="stat-value text-lg text-base-content">{Object.values(activities).flat().length}</div>
                </div>
                <div className="stat bg-success/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-base-content">Completed</div>
                  <div className="stat-value text-lg text-success">
                    {Object.values(activities).flat().filter(a => a.status === "Completed").length}
                  </div>
                </div>
                <div className="stat bg-primary/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-base-content">Progress</div>
                  <div className="stat-value text-lg text-primary">
                    {Math.round((Object.values(activities).flat().filter(a => a.status === "Completed").length / Object.values(activities).flat().length) * 100)}%
                  </div>
                </div>
              </div>

              {/* Activity Details by Stage - EDITABLE */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {Object.entries(activities).map(([stageName, stageActivities]) => (
                  <div key={stageName} className="border border-base-300 rounded-lg overflow-hidden">
                    {/* Stage Header */}
                    <div className="bg-primary/10 p-3 border-b border-base-300">
                      <h4 className="font-bold text-sm text-base-content flex items-center justify-between">
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
                    <div className="overflow-x-auto">
                      <table className="table table-xs w-full">
                        <thead className="bg-base-200">
                          <tr>
                            <th className="w-12 text-base-content">#</th>
                            <th className="text-base-content">Activity</th>
                            <th className="text-center w-40 text-base-content">Status</th>
                            <th className="text-center w-48 text-base-content">Date Completed</th>
                            <th className="w-64 text-base-content">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stageActivities.map((activity, idx) => (
                            <tr key={activity._id || idx} className="hover:bg-base-200/50">
                              <td className="font-mono text-xs text-base-content">{String.fromCharCode(97 + idx)}.</td>
                              <td className="text-xs text-base-content">{activity.name}</td>
                              <td className="text-center">
                                <select
                                  value={activity.status}
                                  onChange={(e) => handleActivityChange(stageName, idx, 'status', e.target.value)}
                                  className="select select-xs select-bordered w-full text-base-content"
                                >
                                  <option value="Not Started">Not Started</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </td>
                              <td className="text-center text-xs">
                                <DateInput
                                  name={`activity-${stageName}-${idx}`}
                                  value={activity.dateCompleted || ''}
                                  onChange={(e) => handleActivityChange(stageName, idx, 'dateCompleted', e.target.value)}
                                  className="input input-xs input-bordered w-full text-base-content text-xs"
                                  placeholder="Select date..."
                                />
                              </td>
                              <td className="text-xs">
                                <input
                                  type="text"
                                  value={activity.remarks || ''}
                                  onChange={(e) => handleActivityChange(stageName, idx, 'remarks', e.target.value)}
                                  placeholder="Add remarks..."
                                  className="input input-xs input-bordered w-full text-base-content"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          )}

          {/* Tab 3: Publication of Proposed SMV (Pre-submission) */}
          {activeTab === "proposed-publication" && (
            <div className="p-6">
              {/* Info Banner */}
              <div className="alert alert-info text-sm mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-base-content">
                  <p className="font-semibold">Publication of Proposed SMV Requirements (RPVARA IRR Section 27)</p>
                  <p className="text-xs">LGU must publish the proposed SMV for 2 weeks prior to public consultation. Public consultation and hearing must be conducted within sixty (60) days before submission to Regional Office (0-60 days gap allowed).</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs text-base-content">Total Activities</div>
                  <div className="stat-value text-lg text-base-content">{proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote).length}</div>
                </div>
                <div className="stat bg-success/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-base-content">Completed</div>
                  <div className="stat-value text-lg text-success">
                    {proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote && a.status === "Completed").length}
                  </div>
                </div>
                <div className="stat bg-primary/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-base-content">Progress</div>
                  <div className="stat-value text-lg text-primary">
                    {Math.round((proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote && a.status === "Completed").length / proposedPublicationActivities.filter(a => !a.isHeader && !a.isNote).length) * 100)}%
                  </div>
                </div>
              </div>

              {/* Publication Activities Table */}
              <div className="border border-base-300 rounded-lg overflow-hidden">
                <div className="bg-primary/10 p-3 border-b border-base-300">
                  <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Publication of Proposed SMV & Public Consultation
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead className="bg-base-200">
                      <tr>
                        <th className="text-base-content">Activity</th>
                        <th className="text-center w-48 text-base-content">Status (Completed / Not Completed)</th>
                        <th className="text-center w-48 text-base-content">Date Completed</th>
                        <th className="w-64 text-base-content">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposedPublicationActivities.map((activity, idx) => {
                        // Header rows
                        if (activity.isHeader) {
                          return (
                            <tr key={idx} className="bg-base-200">
                              <td colSpan="4" className="font-bold text-sm text-base-content">{activity.name}</td>
                            </tr>
                          );
                        }
                        // Note rows
                        if (activity.isNote) {
                          return (
                            <tr key={idx} className="bg-warning/10">
                              <td colSpan="4" className="text-sm italic text-base-content">{activity.name}</td>
                            </tr>
                          );
                        }
                        // Regular activity rows
                        return (
                          <tr key={idx} className="hover:bg-base-200/50">
                            <td className="text-sm text-base-content">{activity.name}</td>
                            <td className="text-center">
                              <select
                                value={activity.status}
                                onChange={(e) => handleProposedPublicationChange(idx, 'status', e.target.value)}
                                className="select select-sm select-bordered w-full text-base-content"
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className="text-center">
                              <input
                                type="text"
                                value={activity.dateCompleted || ''}
                                onChange={(e) => handleProposedPublicationChange(idx, 'dateCompleted', e.target.value)}
                                placeholder="Date or date range"
                                className="input input-sm input-bordered w-full text-base-content"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={activity.remarks || ''}
                                onChange={(e) => handleProposedPublicationChange(idx, 'remarks', e.target.value)}
                                placeholder="Add remarks..."
                                className="input input-sm input-bordered w-full text-base-content"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Tab 4: Review & Publication (Post-submission) */}
          {activeTab === "review-publication" && (
            <div>
              {/* Sticky Header Section */}
              <div className="sticky top-0 z-10 bg-base-100 p-6 pb-4 border-b border-base-300">
                {/* Info Banner */}
                <div className="alert alert-info text-sm mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-base-content">
                    <p className="font-semibold">Review & Publication Process</p>
                    <p className="text-xs">Track the submission, review, certification, and final publication of the certified SMV through Regional Office, Central Office, and Secretary of Finance approval stages.</p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="stat bg-base-200 rounded-lg p-3">
                    <div className="stat-title text-xs text-base-content">Total Activities</div>
                    <div className="stat-value text-lg text-base-content">{reviewPublicationActivities.length}</div>
                  </div>
                  <div className="stat bg-success/10 rounded-lg p-3">
                    <div className="stat-title text-xs text-base-content">Completed</div>
                    <div className="stat-value text-lg text-success">
                      {reviewPublicationActivities.filter(a => a.status === "Completed").length}
                    </div>
                  </div>
                  <div className="stat bg-primary/10 rounded-lg p-3">
                    <div className="stat-title text-xs text-base-content">Progress</div>
                    <div className="stat-value text-lg text-primary">
                      {Math.round((reviewPublicationActivities.filter(a => a.status === "Completed").length / reviewPublicationActivities.length) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Table Content */}
              <div className="p-6 pt-4">
                {/* Review & Publication Activities Table */}
                <div className="border border-base-300 rounded-lg overflow-hidden">
                  <div className="bg-primary/10 p-3 border-b border-base-300">
                    <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Review, Certification & Publication of Certified SMV
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead className="bg-base-200">
                        <tr>
                          <th className="text-base-content">Activity</th>
                          <th className="text-center w-48 text-base-content">Status (Completed / Not Completed)</th>
                          <th className="text-center w-48 text-base-content">Date Completed</th>
                          <th className="w-64 text-base-content">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewPublicationActivities.map((activity, idx) => (
                          <tr key={idx} className="hover:bg-base-200/50">
                            <td className="text-sm text-base-content">{activity.name}</td>
                            <td className="text-center">
                              <select
                                value={activity.status}
                                onChange={(e) => handleReviewPublicationChange(idx, 'status', e.target.value)}
                                className="select select-sm select-bordered w-full text-base-content"
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className="text-center">
                              <DateInput
                                name={`review-publication-${idx}`}
                                value={activity.dateCompleted || ''}
                                onChange={(e) => handleReviewPublicationChange(idx, 'dateCompleted', e.target.value)}
                                className="input input-sm input-bordered w-full text-base-content"
                                placeholder="Select date..."
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={activity.remarks || ''}
                                onChange={(e) => handleReviewPublicationChange(idx, 'remarks', e.target.value)}
                                placeholder="Add remarks..."
                                className="input input-sm input-bordered w-full text-base-content"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer - Only show when changes made */}
        {hasChanges && (
          <div className="flex-shrink-0 border-t border-base-300 bg-base-100 p-4 rounded-b-xl shadow-lg">
            <div className="flex items-center justify-between gap-4">
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
