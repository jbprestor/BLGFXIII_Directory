import { useState, useEffect, useCallback, useMemo } from "react";
import { validateField } from "../../utils/validationRules.js";
import {
  FIELD_CONFIG,
  FIELD_GROUPS,
  SECTION_CONFIG,
} from "../../utils/fieldConfig.jsx";

export default function EditModal({
  isOpen,
  editingPerson,
  updateLoading,
  onInputChange,
  onUpdate,
  onClose,
  formatDate,
}) {
  const [localData, setLocalData] = useState({});
  const [errors, setErrors] = useState({});

  // Format dates for input fields
  const formatDateForInput = useCallback((dateString) => {
    return dateString ? new Date(dateString).toISOString().split("T")[0] : "";
  }, []);

  // Initialize form data when editingPerson changes
  useEffect(() => {
    if (editingPerson) {
      const formattedData = {
        ...editingPerson,
        birthday: formatDateForInput(editingPerson.birthday),
        dateOfMandatoryRetirement: formatDateForInput(
          editingPerson.dateOfMandatoryRetirement
        ),
        dateOfCompulsoryRetirement: formatDateForInput(
          editingPerson.dateOfCompulsoryRetirement
        ),
        dateOfAppointment: formatDateForInput(editingPerson.dateOfAppointment),
      };
      setLocalData(formattedData);
      setErrors({});
    }
  }, [editingPerson, formatDateForInput]);

  // Handle input changes with validation
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      let sanitizedValue = value;

      // Apply specific sanitization
      if (name === "contactNumber") {
        sanitizedValue = value.replace(/\D/g, "");
      } else if (name === "emailAddress") {
        sanitizedValue = value.toLowerCase().trim();
      } else if (name === "stepIncrement") {
        sanitizedValue = value.replace(/[^0-9]/g, "");
      }

      // Validate field
      const fieldError = validateField(name, sanitizedValue);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
      setLocalData((prev) => ({ ...prev, [name]: sanitizedValue }));

      // Notify parent component
      if (onInputChange) {
        onInputChange({ target: { name, value: sanitizedValue } });
      }
    },
    [onInputChange]
  );

  // Validate entire form
  const validateForm = useCallback(() => {
    const newErrors = {};

    Object.keys(FIELD_CONFIG).forEach((fieldName) => {
      const error = validateField(fieldName, localData[fieldName]);
      if (error) newErrors[fieldName] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [localData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        alert("Please fix all errors before submitting.");
        return;
      }

      if (onUpdate) {
        await onUpdate(e);
      }
    },
    [validateForm, onUpdate]
  );

  // Function to render input fields based on type
  const renderField = useCallback(
    (fieldName) => {
      const config = FIELD_CONFIG[fieldName];
      if (!config) return null;

      const commonProps = {
        name: fieldName,
        value: localData[fieldName] || "",
        error: errors[fieldName],
        onChange: handleInputChange,
        required: config.validation && config.validation.includes("required"),
        ...config, // Spread all config properties
      };

      switch (config.type) {
        case "select":
          return (
            <SelectField
              label={config.label}
              options={config.options}
              {...commonProps}
            />
          );
        case "date":
        case "email":
        case "number":
        case "text":
        default:
          return (
            <InputField
              label={config.label}
              type={config.type}
              {...commonProps}
            />
          );
      }
    },
    [localData, errors, handleInputChange]
  );

  // Don't render if modal is not open
  if (!isOpen || !editingPerson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-gray-300 p-6 animate-fade-in">
        {/* Header */}
        <ModalHeader editingPerson={editingPerson} onClose={onClose} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <FormSection
            title={SECTION_CONFIG.personalInfo.title}
            color={SECTION_CONFIG.personalInfo.color}
            icon={SECTION_CONFIG.personalInfo.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.personalInfo.map(renderField)}
            </div>
          </FormSection>

          {/* Government Information */}
          <FormSection
            title={SECTION_CONFIG.governmentInfo.title}
            color={SECTION_CONFIG.governmentInfo.color}
            icon={SECTION_CONFIG.governmentInfo.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.governmentInfo.map(renderField)}
            </div>
          </FormSection>

          {/* Important Dates */}
          <FormSection
            title={SECTION_CONFIG.importantDates.title}
            color={SECTION_CONFIG.importantDates.color}
            icon={SECTION_CONFIG.importantDates.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELD_GROUPS.importantDates.map(renderField)}
            </div>
          </FormSection>

          {/* Educational Attainment */}
          <FormSection
            title={SECTION_CONFIG.education.title}
            color={SECTION_CONFIG.education.color}
            icon={SECTION_CONFIG.education.icon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.education.map(renderField)}
            </div>
          </FormSection>

          {/* Footer */}
          <FormFooter
            localData={localData}
            formatDate={formatDate}
            updateLoading={updateLoading}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
}

// ... rest of the component code remains the same
// Extracted components for better readability
function ModalHeader({ editingPerson, onClose }) {
  return (
    <div className="flex items-center justify-between mb-6 border-b pb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
          {editingPerson.name?.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">Edit Personnel</h2>
          <p className="text-gray-500">{editingPerson.name}</p>
        </div>
      </div>
      <button
        className="text-gray-500 hover:text-gray-700 text-2xl"
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </button>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  error,
  onChange,
  required,
  type = "text",
  ...props
}) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      <input
        type={type}
        className={`input input-bordered w-full ${
          error ? "border-red-500" : ""
        }`}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        {...props}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  error,
  onChange,
  required,
  options,
  ...props
}) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      <select
        className={`select select-bordered w-full ${
          error ? "border-red-500" : ""
        }`}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        {...props}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
}

function FormFooter({ localData, formatDate, updateLoading, onClose }) {
  return (
    <div className="flex justify-between items-center mt-8 pt-4 border-t">
      <div className="text-sm text-gray-400">
        Last updated: {formatDate ? formatDate(localData.updatedAt) : "Never"}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-outline px-6"
          onClick={onClose}
          disabled={updateLoading === localData._id}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary px-6"
          disabled={updateLoading === localData._id}
        >
          {updateLoading === localData._id ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              Updating...
            </>
          ) : (
            "Update Personnel"
          )}
        </button>
      </div>
    </div>
  );
}
