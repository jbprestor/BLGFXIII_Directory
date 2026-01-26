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
          <Section title={SECTION_CONFIG.personalInfo.title}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
              {FIELD_GROUPS.personalInfo.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={selectedPerson[fieldName]}
                />
              ))}
            </div>
          </Section>

          {/* Government Information */}
          <Section title={SECTION_CONFIG.governmentInfo.title}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
              {FIELD_GROUPS.governmentInfo.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={
                    (fieldName.includes("date") || fieldName.includes("Expiration")) && selectedPerson[fieldName]
                      ? formatDate(selectedPerson[fieldName])
                      : selectedPerson[fieldName]
                  }
                />
              ))}
            </div>
          </Section>

          {/* Important Dates */}
          <Section title={SECTION_CONFIG.importantDates.title}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
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
          </Section>

          {/* Educational Attainment */}
          <Section title={SECTION_CONFIG.education.title}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
              {FIELD_GROUPS.education.map((fieldName) => (
                <DetailField
                  key={fieldName}
                  label={FIELD_CONFIG[fieldName].label}
                  value={selectedPerson[fieldName]}
                />
              ))}
            </div>
          </Section>
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

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-base-content/50 mb-3 border-b border-base-200 pb-1 tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ModalHeader({ selectedPerson, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 dark:border-gray-700 bg-base-200/50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg shadow-sm">
          {selectedPerson.fullName?.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-base-content leading-tight">
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
