import { useMemo } from "react";
import { DetailField } from "../../common/FormFields.jsx";
import {
  FIELD_CONFIG,
  FIELD_GROUPS,
  SECTION_CONFIG,
} from "../../../utils/fieldConfig.jsx";

export default function DetailsModal({
  isOpen,
  selectedPerson,
  onClose,
  onEdit,
  formatDate,
}) {
  // Don't render if modal is not open
  if (!isOpen || !selectedPerson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-base-300 dark:border-gray-700 p-6 animate-fade-in">
        {/* Header */}
        <ModalHeader selectedPerson={selectedPerson} onClose={onClose} />

        {/* Content */}
        <div className="space-y-6">
          {/* Personal Information */}
          <FormSection
            title={SECTION_CONFIG.personalInfo.title}
            color={SECTION_CONFIG.personalInfo.color}
            icon={SECTION_CONFIG.personalInfo.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.personalInfo.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={selectedPerson[fieldName]}
                />
              ))}
            </div>
          </FormSection>

          {/* Government Information */}
          <FormSection
            title={SECTION_CONFIG.governmentInfo.title}
            color={SECTION_CONFIG.governmentInfo.color}
            icon={SECTION_CONFIG.governmentInfo.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.governmentInfo.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={
                    fieldName.includes("date") && selectedPerson[fieldName]
                      ? formatDate(selectedPerson[fieldName])
                      : selectedPerson[fieldName]
                  }
                />
              ))}
            </div>
          </FormSection>

          {/* Important Dates */}
          <FormSection
            title={SECTION_CONFIG.importantDates.title}
            color={SECTION_CONFIG.importantDates.color}
            icon={SECTION_CONFIG.importantDates.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELD_GROUPS.importantDates.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={
                    selectedPerson[fieldName]
                      ? formatDate(selectedPerson[fieldName])
                      : "N/A"
                  }
                />
              ))}
            </div>
          </FormSection>

          {/* Educational Attainment */}
          <FormSection
            title={SECTION_CONFIG.education.title}
            color={SECTION_CONFIG.education.color}
            icon={SECTION_CONFIG.education.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.education.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={selectedPerson[fieldName]}
                />
              ))}
            </div>
          </FormSection>
        </div>

        {/* Footer */}
        <FormFooter
          selectedPerson={selectedPerson}
          formatDate={formatDate}
          onClose={onClose}
          onEdit={onEdit}
        /> 
      </div>
    </div>
  );
}

// Extracted components for better readability
function ModalHeader({ selectedPerson, onClose }) {
  return (
    <div className="flex items-center justify-between mb-6 border-b border-base-300 dark:border-gray-700 pb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg">
          {selectedPerson.name?.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-base-content">
            Personnel Details
          </h2>
          <p className="text-base-content/70 font-medium">
            {selectedPerson.name}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span
              className={`badge ${
                selectedPerson.lguType === "City"
                  ? "badge-primary"
                  : selectedPerson.lguType === "Municipality"
                  ? "badge-secondary"
                  : "badge-accent"
              }`}
            >
              {selectedPerson.lguType}
            </span>
            <span className="badge badge-outline">
              {selectedPerson.statusOfAppointment}
            </span>
          </div>
        </div>
      </div>
      <button
        className="btn btn-ghost btn-circle text-lg"
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </button>
    </div>
  );
}

function FormSection({ title, children, color = "primary", icon }) {
  const colorClasses = {
    primary: "bg-primary/10 dark:bg-primary/20 border-l-4 border-primary",
    secondary:
      "bg-secondary/10 dark:bg-secondary/20 border-l-4 border-secondary",
    accent: "bg-accent/10 dark:bg-accent/20 border-l-4 border-accent",
    info: "bg-info/10 dark:bg-info/20 border-l-4 border-info",
  };

  const textColorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    info: "text-info",
  };

  const iconBgClasses = {
    primary: "bg-primary/20 text-primary",
    secondary: "bg-secondary/20 text-secondary",
    accent: "bg-accent/20 text-accent",
    info: "bg-info/20 text-info",
  };

  return (
    <div className={`rounded-lg p-5 ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-lg mr-3 ${iconBgClasses[color]}`}>
          {icon}
        </div>
        <h3 className={`text-lg font-semibold ${textColorClasses[color]}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function FormFooter({ selectedPerson, formatDate, onClose, onEdit }) {
  return (
    <div className="flex justify-between items-center mt-8 pt-4 border-t border-base-300 dark:border-gray-700">
      <div className="flex space-x-4">
        <div className="text-sm text-base-content/70">
          <span className="font-medium">ID:</span> {selectedPerson._id}
        </div>
        <div className="text-sm text-base-content/70">
          <span className="font-medium">Last Updated:</span>{" "}
          {formatDate ? formatDate(selectedPerson.updatedAt) : "Never"}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            onClose();
            onEdit(selectedPerson);
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Edit
        </button>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
