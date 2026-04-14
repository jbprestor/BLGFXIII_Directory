import React from "react";
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
  if (!isOpen || !selectedPerson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
      <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-base-300 dark:border-gray-700 animate-fade-in">
        {/* Header */}
        <ModalHeader selectedPerson={selectedPerson} onClose={onClose} />

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Personal Information */}
          <FormSection {...SECTION_CONFIG.personalInfo}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.personalInfo.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={
                    fieldName === "birthday" && selectedPerson[fieldName]
                      ? formatDate(selectedPerson[fieldName])
                      : selectedPerson[fieldName]
                  }
                  compact={false}
                />
              ))}
            </div>
          </FormSection>

          {/* Government Information */}
          <FormSection {...SECTION_CONFIG.governmentInfo}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.governmentInfo.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={
                    (fieldName.includes("date") || fieldName.includes("Expiration")) && selectedPerson[fieldName]
                      ? formatDate(selectedPerson[fieldName])
                      : selectedPerson[fieldName]
                  }
                  compact={false}
                />
              ))}
            </div>
          </FormSection>

          {/* Important Dates */}
          <FormSection {...SECTION_CONFIG.importantDates}>
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
                  compact={false}
                />
              ))}
            </div>
          </FormSection>

          {/* Educational Attainment */}
          <FormSection {...SECTION_CONFIG.education}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.education.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={selectedPerson[fieldName]}
                  compact={false}
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

// Extracted components

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

function ModalHeader({ selectedPerson, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 dark:border-gray-700 bg-base-200/50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xl shadow-sm">
          {selectedPerson.fullName?.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-base-content leading-tight">
            {selectedPerson.fullName}
          </h2>
          <div className="flex items-center space-x-2 mt-0.5">
            <span
              className={`badge badge-sm ${selectedPerson.lguType === "City"
                ? "badge-primary"
                : selectedPerson.lguType === "Municipality"
                  ? "badge-secondary"
                  : "badge-accent"
                }`}
            >
              {selectedPerson.lguType}
            </span>
            <span className="text-xs text-base-content/60">
              • {selectedPerson.statusOfAppointment}
            </span>
          </div>
        </div>
      </div>
      <button
        className="btn btn-ghost btn-circle btn-sm"
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </button>
    </div>
  );
}

function FormFooter({ selectedPerson, formatDate, onClose, onEdit }) {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-t border-base-300 dark:border-gray-700 bg-base-100">
      <div className="text-xs text-base-content/50">
        Last Updated: {formatDate ? formatDate(selectedPerson.updatedAt) : "Never"}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            onClose();
            onEdit(selectedPerson);
          }}
        >
          Edit
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
