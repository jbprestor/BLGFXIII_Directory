import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { validateField } from "../../../utils/validationRules.js";
import {
  FIELD_CONFIG,
  FIELD_GROUPS,
  SECTION_CONFIG,
} from "../../../utils/fieldConfig.jsx";
import { InputField, SelectField } from "../../common/FormFields.jsx";
import useApi from "../../../services/axios.js";

export default function AddModal({ isOpen, onClose, refreshAssessors }) {
  const { api: _apiInstance, getAllLgusNoPagination, createAssessor } = useApi(); // ✅ FIX: also grab helper

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [allLgusFromDb, setAllLgusFromDb] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("Caraga");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedLgu, setSelectedLgu] = useState("");

  const regions = ["Caraga"];
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;

  // Fetch ALL LGUs (no pagination now)
  useEffect(() => {
    let _isMounted = true;
    const fetchLgus = async () => {
      try {
        const response = await getAllLgusNoPagination(); // ✅ FIX: no stray "/"
        const { lgus } = response.data;
        setAllLgusFromDb(Array.isArray(lgus) ? lgus : []);
      } catch (_err) {
        console.error("Failed to fetch LGUs:", _err);
        setAllLgusFromDb([]);
      }
    };
    fetchLgus();
    return () => {
      _isMounted = false; // cleanup to prevent race conditions
    };
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const emptyData = Object.keys(FIELD_CONFIG).reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});

      emptyData.region = "Caraga"; // ✅ ensure region field is prefilled

      setFormData(emptyData);
      setErrors({});
      setSelectedRegion("Caraga");
      setSelectedProvince("");
      setSelectedLgu("");
    }
  }, [isOpen]);

  // Provinces memo
  const provinces = useMemo(() => {
    return [...new Set(allLgusFromDb.map((lgu) => lgu.province))];
  }, [allLgusFromDb]);

  // LGUs memo based on selected province
  const lgus = useMemo(() => {
    if (!selectedProvince) return [];
    return allLgusFromDb
      .filter((lgu) => lgu.province === selectedProvince)
      .map((lgu) => lgu.name);
  }, [selectedProvince, allLgusFromDb]);

  // Input change handler
  // ✅ FIX: works for <input> and <SelectField>
  const handleInputChange = useCallback((eOrVal, maybeName) => {
    let name, value;

    if (eOrVal?.target) {
      // Normal input event
      name = eOrVal.target.name;
      value = eOrVal.target.value;
    } else {
      // Custom select sending raw value
      name = maybeName;
      value = eOrVal;
    }

    let sanitized = value;

    if (name === "contactNumber" || name === "mobileNumber") sanitized = value.replace(/\D/g, "");
    if (name === "officeEmail" || name === "personalEmail")
      sanitized = value.toLowerCase().trim();
    if (name === "stepIncrement") sanitized = value.replace(/[^0-9]/g, "");

    setErrors((prev) => ({ ...prev, [name]: validateField(name, sanitized) }));
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
  }, []);

  // Handle region change
  const handleRegionChange = (valOrEvent) => {
    const region = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setSelectedRegion(region);

    if (!region) {
      // ✅ Reset province + LGU when region is empty
      setSelectedProvince("");
      setSelectedLgu("");
      setFormData((prev) => ({
        ...prev,
        region: "",
        province: "",
        lguName: "",
        lguType: "",
        incomeClass: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, region }));
    }
  };

  // Handle province change
  const handleProvinceChange = (valOrEvent) => {
    const province = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setSelectedProvince(province);
    setSelectedLgu("");
    setFormData((prev) => ({
      ...prev,
      province,
      lguType: "",
      incomeClass: "",
    }));
  };

  // Handle LGU change (auto-populate type + income class)
  const handleLguChange = (valOrEvent) => {
    const lguName = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setSelectedLgu(lguName);

    const lguObj = allLgusFromDb.find((lgu) => lgu.name === lguName);

    setFormData((prev) => ({
      ...prev,
      lguName,
      lgu: lguObj?._id || "", // <-- add this
      lguType: lguObj?.classification || "",
      incomeClass: lguObj?.incomeClass || "",
    }));
  };

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    // Relaxed validation: Only ensure First/Last Name and LGU are present
    if (!formData.firstName?.trim()) newErrors.firstName = "First Name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.lguName) newErrors.lguName = "LGU is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return toast.error("Fix errors before submitting");
      }

      if (role !== "Admin" && role !== "superadmin") {
        return toast.error("No permission");
      }

      try {
        setSubmitting(true);

        // Find LGU object
        const selectedLguObj = allLgusFromDb.find(
          (lgu) => lgu.name === formData.lguName
        );

        if (!selectedLguObj) {
          toast.error("Selected LGU not found");
          return;
        }

        // Build payload with safe defaults
        const payload = {
          ...formData,
          officialDesignation: formData.officialDesignation || "", // use actual field, not plantillaPosition
          birthday: formData.birthday
            ? new Date(formData.birthday).toISOString()
            : null,
          dateOfAppointment: formData.dateOfAppointment
            ? new Date(formData.dateOfAppointment).toISOString()
            : null,
          prcLicenseExpiration: formData.prcLicenseExpiration
            ? new Date(formData.prcLicenseExpiration).toISOString()
            : null,
          dateOfMandatoryRetirement: formData.dateOfMandatoryRetirement
            ? new Date(formData.dateOfMandatoryRetirement).toISOString()
            : null,
          dateOfCompulsoryRetirement: formData.dateOfCompulsoryRetirement
            ? new Date(formData.dateOfCompulsoryRetirement).toISOString()
            : null,
          lgu: formData.lgu, // must be valid ObjectId
          stepIncrement: formData.stepIncrement
            ? Number(formData.stepIncrement)
            : 1,
          officeEmail: formData.officeEmail || "",
          personalEmail: formData.personalEmail || "",
          contactNumber: formData.contactNumber || "",
          mobileNumber: formData.mobileNumber || "",
          salaryGrade: formData.salaryGrade || "",
        };

        // Only log in development mode and redact sensitive data
        if (import.meta.env.MODE === "development") {
          console.log("Submitting Assessor Payload:", {
            ...payload,
            personalEmail: "[REDACTED]",
            officeEmail: "[REDACTED]",
            contactNumber: "[REDACTED]",
            mobileNumber: "[REDACTED]"
          });
        }

        const _res = await createAssessor(payload);

        toast.success(
          `${payload.firstName} ${payload.lastName} added successfully`
        );

        if (refreshAssessors) await refreshAssessors();
        onClose();
      } catch (_err) {
        console.error("Backend Error Response:", _err.response?.data || _err);
        toast.error(_err?.response?.data?.message || "Failed to add personnel");
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, formData, onClose, refreshAssessors, role, allLgusFromDb]
  );

  // Memoized field renderer
  // ✅ FIXED renderField
  const renderField = useCallback(
    (name) => {
      const config = FIELD_CONFIG[name];
      if (!config) return null;

      if (name === "region") {
        return (
          <SelectField
            label="Region"
            name="region"
            value={selectedRegion}
            options={regions}
            onChange={handleRegionChange}
          // required
          />
        );
      }

      if (name === "province") {
        return (
          <SelectField
            label="Province"
            name="province"
            value={selectedProvince}
            options={provinces}
            onChange={handleProvinceChange}
            required
            disabled={!selectedRegion}
          />
        );
      }

      if (name === "lguName") {
        return (
          <SelectField
            label="LGU Name"
            name="lguName"
            value={selectedLgu}
            options={lgus}
            onChange={handleLguChange}
            required
            disabled={!lgus.length}
          />
        );
      }

      if (name === "lguType" || name === "incomeClass") {
        return (
          <InputField
            label={config.label}
            name={name}
            value={formData[name] || ""}
            readOnly
          />
        );
      }

      // ✅ FIX sex, status, civilStatus
      // ✅ FIX sex
      if (name === "sex") {
        return (
          <SelectField
            label="Sex"
            name="sex"
            value={formData.sex || ""}
            options={["Male", "Female", "Other"]}
            // force (value, name) style, not event
            onChange={(value) => handleInputChange(value, "sex")}
          // required
          />
        );
      }

      // ✅ FIX statusOfAppointment
      if (name === "statusOfAppointment") {
        return (
          <SelectField
            label="Employment Status"
            name="statusOfAppointment"
            value={formData.statusOfAppointment || ""}
            options={["Permanent", "Temporary", "Contractual", "Casual", "Acting", "OIC", "Job Order", "Retired"]}
            onChange={(value) =>
              handleInputChange(value, "statusOfAppointment")
            }
          // required
          />
        );
      }

      // ✅ FIX civilStatus
      if (name === "civilStatus") {
        return (
          <SelectField
            label="Civil Status"
            name="civilStatus"
            value={formData.civilStatus || ""}
            options={[
              "Single",
              "Married",
              "Widowed",
              "Separated",
              "Divorced",
              "Others",
            ]}
            onChange={(value) => handleInputChange(value, "civilStatus")}
          // required
          />
        );
      }

      // Default render
      const props = {
        name,
        value: formData[name] || "",
        error: errors[name],
        onChange: handleInputChange,
        // Only require First and Last Name and LGU components
        required: ["firstName", "lastName", "lguName", "province", "region"].includes(name),
        ...config,
      };

      return config.type === "select" ? (
        <SelectField label={config.label} options={config.options} {...props} />
      ) : (
        <InputField label={config.label} type={config.type} {...props} />
      );
    },
    [
      formData,
      errors,
      handleInputChange,
      selectedRegion,
      selectedProvince,
      selectedLgu,
      regions,
      provinces,
      lgus,
    ]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-base-300 dark:border-gray-700 p-6 animate-fade-in">
        <ModalHeader onClose={onClose} />
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection {...SECTION_CONFIG.personalInfo}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.personalInfo.map((f) => (
                <div key={f}>{renderField(f)}</div>
              ))}
            </div>
          </FormSection>

          <FormSection {...SECTION_CONFIG.governmentInfo}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {["region", "province", "lguName", "lguType", "incomeClass"].map(
                (f) => (
                  <div key={f}>{renderField(f)}</div>
                )
              )}
              {FIELD_GROUPS.governmentInfo
                .filter(
                  (f) =>
                    ![
                      "region",
                      "province",
                      "lguName",
                      "lguType",
                      "incomeClass",
                    ].includes(f)
                )
                .map((f) => (
                  <div key={f}>{renderField(f)}</div>
                ))}
            </div>
          </FormSection>

          <FormSection {...SECTION_CONFIG.importantDates}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELD_GROUPS.importantDates.map((f) => (
                <div key={f}>{renderField(f)}</div>
              ))}
            </div>
          </FormSection>

          <FormSection {...SECTION_CONFIG.education}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_GROUPS.education.map((f) => (
                <div key={f}>{renderField(f)}</div>
              ))}
            </div>
          </FormSection>

          <FormFooter loading={submitting} onClose={onClose} />
        </form>
      </div>
    </div>
  );
}

/* ======= SUB COMPONENTS ======= */
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

function FormFooter({ loading, onClose }) {
  return (
    <div className="flex justify-between items-center mt-8 pt-4 border-t border-base-300 dark:border-gray-700">
      <div className="text-sm text-base-content/70">
        Fields marked with <span className="text-error">*</span> are required
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
