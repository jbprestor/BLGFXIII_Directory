import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { InputField, SelectField } from "../../common/FormFields.jsx";
import { USER_FIELD_CONFIG } from "../../../utils/userConfig.jsx"; // ⬅️ imported config

export default function UserCreateModal({
  isOpen,
  onClose,
  onCreateUser,
  loading,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const emptyData = Object.keys(USER_FIELD_CONFIG).reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});
      emptyData.role = "Regional"; // default
      setFormData(emptyData);
      setErrors({});
    }
  }, [isOpen]);
  

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
  }, []);

  // Handle select change
  const handleSelectChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};

    Object.keys(USER_FIELD_CONFIG).forEach((field) => {
      const config = USER_FIELD_CONFIG[field];
      const value = formData[field];

      if (config.validation?.includes("required") && !value) {
        newErrors[field] = `${config.label} is required`;
      }

      if (field === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
        newErrors[field] = "Invalid email format";
      }

      if (field === "region" && formData.role !== "Admin" && !value) {
        newErrors[field] = "Region is required for this role";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error("Please fix the highlighted errors before submitting.");
        return;
      }

      try {
        await onCreateUser(formData);
        toast.success(
          `${formData.firstName} ${formData.lastName} created successfully`
        );
        onClose();
      } catch (err) {
        toast.error(err?.message || "Failed to create user. Please try again.");
      }
    },
    [formData, validateForm, onCreateUser, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-base-300 dark:border-gray-700 animate-fade-in">
        <ModalHeader onClose={onClose} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={USER_FIELD_CONFIG.firstName.label}
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={errors.firstName}
              required
            />
            <InputField
              label={USER_FIELD_CONFIG.lastName.label}
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={errors.lastName}
              required
            />
          </div>

          <InputField
            label={USER_FIELD_CONFIG.email.label}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />

          <InputField
            label={USER_FIELD_CONFIG.password.label}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label={USER_FIELD_CONFIG.role.label}
              name="role"
              options={USER_FIELD_CONFIG.role.options}
              value={formData.role}
              onChange={(val) => handleSelectChange("role", val)}
              error={errors.role}
              required
            />
       
          </div>

          <FormFooter loading={loading} onClose={onClose} />
        </form>
      </div>
    </div>
  );
}

/* ======= SUB COMPONENTS ======= */
function ModalHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between mb-6 border-b border-base-300 dark:border-gray-700 pb-4">
      <div>
        <h2 className="text-xl font-bold text-base-content">Create User</h2>
        <p className="text-base-content/70 text-sm">
          Fill in details to add a new user
        </p>
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

function FormFooter({ loading, onClose }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-base-300 dark:border-gray-700">
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
            Creating...
          </>
        ) : (
          "Create User"
        )}
      </button>
    </div>
  );
}
