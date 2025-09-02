import { useState, useEffect, useCallback } from "react";
import { validateField } from "../../utils/validationRules.js";
import {
  FIELD_CONFIG,
  FIELD_GROUPS,
  SECTION_CONFIG,
} from "../../utils/fieldConfig.jsx";
import { InputField, SelectField } from "../common/FormFields";

export default function AddModal({ isOpen, onClose, onAddPersonnel, loading }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize empty form data when modal opens
  useEffect(() => {
    if (isOpen) {
      const emptyFormData = Object.keys(FIELD_CONFIG).reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});
      setFormData(emptyFormData);
      setErrors({});
    }
  }, [isOpen]);

  // Handle input changes with validation
  const handleInputChange = useCallback((e) => {
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
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  }, []);

  // Validate entire form
  const validateForm = useCallback(() => {
    const newErrors = {};

    Object.keys(FIELD_CONFIG).forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) newErrors[fieldName] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        alert("Please fix all errors before submitting.");
        return;
      }

      try {
        await onAddPersonnel(formData);
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    },
    [validateForm, onAddPersonnel, formData]
  );

  // Function to render input fields based on type
  const renderField = useCallback(
    (fieldName) => {
      const config = FIELD_CONFIG[fieldName];
      if (!config) return null;

      const commonProps = {
        name: fieldName,
        value: formData[fieldName] || "",
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
    [formData, errors, handleInputChange]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-base-300 dark:border-gray-700 p-6 animate-fade-in">
        {/* Header */}
        <ModalHeader onClose={onClose} />

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
          <FormFooter loading={loading} onClose={onClose} />
        </form>
      </div>
    </div>
  );
}

// Modal Header for AddModal
function ModalHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between mb-6 border-b border-base-300 dark:border-gray-700 pb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg">
          +
        </div>
        <div>
          <h2 className="text-2xl font-bold text-base-content">
            Add New Personnel
          </h2>
          <p className="text-base-content/70 font-medium">
            Create a new BLGF personnel record
          </p>
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

// Form Section Component (reusable)
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

// Form Footer for AddModal
function FormFooter({ loading, onClose }) {
  return (
    <div className="flex justify-between items-center mt-8 pt-4 border-t border-base-300 dark:border-gray-700">
      <div className="text-sm text-base-content/70">
        All fields marked with <span className="text-error">*</span> are
        required
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              Adding...
            </>
          ) : (
            "Add Personnel"
          )}
        </button>
      </div>
    </div>
  );
}
