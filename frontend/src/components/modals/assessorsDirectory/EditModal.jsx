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

export default function EditModal({
  isOpen,
  editingPerson,
  onUpdate,
  updateLoading,
  onClose,
  formatDate,
}) {
  const { api: apiInstance, getAllLgusNoPagination } = useApi();
  const apiRef = useMemo(() => apiInstance, [apiInstance]);

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [allLgusFromDb, setAllLgusFromDb] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("Caraga");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedLgu, setSelectedLgu] = useState("");

  // Fetch LGUs
  useEffect(() => {
    async function fetchLGUs() {
      try {
        const response = await getAllLgusNoPagination();
        const { lgus } = response.data;
        setAllLgusFromDb(Array.isArray(lgus) ? lgus : []);
      } catch (err) {
        console.error("Failed to fetch LGUs:", err);
        setAllLgusFromDb([]);
      }
    }
    fetchLGUs();
  }, []);

  // Initialize form when editingPerson changes or LGUs loaded
  useEffect(() => {
    if (editingPerson && allLgusFromDb.length) {
      const formatDateForInput = (dateString) =>
        dateString ? new Date(dateString).toISOString().split("T")[0] : "";

      // Match LGU in DB
      const matchedLgu = allLgusFromDb.find(
        (l) =>
          l._id === editingPerson.lgu ||
          l.name?.toLowerCase() === (editingPerson.lguName || "").toLowerCase()
      );

      const matchedProvince = matchedLgu?.province || editingPerson.province || "";
      const matchedRegion = matchedLgu?.region || editingPerson.region || "Caraga";
      const matchedLguName = matchedLgu?.name || editingPerson.lguName || "";

      setFormData({
        ...editingPerson,
        birthday: formatDateForInput(editingPerson.birthday),
        dateOfAppointment: formatDateForInput(editingPerson.dateOfAppointment),
        dateOfMandatoryRetirement: formatDateForInput(editingPerson.dateOfMandatoryRetirement),
        dateOfCompulsoryRetirement: formatDateForInput(editingPerson.dateOfCompulsoryRetirement),
        officialDesignation: editingPerson.officialDesignation || editingPerson.plantillaPosition,
        region: matchedRegion,
        province: matchedProvince,
        lguName: matchedLguName,
        lguType: matchedLgu?.classification || "",
        incomeClass: matchedLgu?.incomeClass || "",
        lgu: matchedLgu?._id || "",
      });

      setSelectedRegion(matchedRegion);
      setSelectedProvince(matchedProvince);
      setSelectedLgu(matchedLguName);
      setErrors({});
    }
  }, [editingPerson, allLgusFromDb]);

  // Derived provinces and LGUs
  const provinces = useMemo(
    () => [...new Set(allLgusFromDb.map((lgu) => lgu.province))],
    [allLgusFromDb]
  );
  const lgus = useMemo(() => {
    if (!selectedProvince) return [];
    return allLgusFromDb
      .filter((lgu) => lgu.province === selectedProvince)
      .map((lgu) => lgu.name);
  }, [selectedProvince, allLgusFromDb]);

  // Input change
  const handleInputChange = useCallback((eOrVal, maybeName) => {
    let name, value;
    if (eOrVal?.target) {
      name = eOrVal.target.name;
      value = eOrVal.target.value;
    } else {
      name = maybeName;
      value = eOrVal;
    }

    let sanitized = value;
    if (name === "contactNumber") sanitized = value.replace(/\D/g, "");
    if (name === "officeEmail" || name === "personalEmail")
      sanitized = value.toLowerCase().trim();
    if (name === "stepIncrement") sanitized = value.replace(/[^0-9]/g, "");

    setErrors((prev) => ({ ...prev, [name]: validateField(name, sanitized) }));
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
  }, []);

  const handleRegionChange = (valOrEvent) => {
    const region = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setSelectedRegion(region);
    setSelectedProvince("");
    setSelectedLgu("");
    setFormData((prev) => ({
      ...prev,
      region,
      province: "",
      lguName: "",
      lguType: "",
      incomeClass: "",
      lgu: "",
    }));
  };

  const handleProvinceChange = (valOrEvent) => {
    const province = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setSelectedProvince(province);
    setSelectedLgu("");
    setFormData((prev) => ({
      ...prev,
      province,
      lguName: "",
      lguType: "",
      incomeClass: "",
      lgu: "",
    }));
  };

  const handleLguChange = (valOrEvent) => {
    const lguName = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setSelectedLgu(lguName);

    const lguObj = allLgusFromDb.find((l) => l.name === lguName);
    setFormData((prev) => ({
      ...prev,
      lguName,
      lgu: lguObj?._id || "",
      lguType: lguObj?.classification || "",
      incomeClass: lguObj?.incomeClass || "",
    }));
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(FIELD_CONFIG).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    if (!formData.lgu) newErrors.lgu = "Please select an LGU";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return toast.error("Fix errors before submitting");

      try {
        const payload = {
          ...formData,
          stepIncrement: formData.stepIncrement
            ? Number(formData.stepIncrement)
            : 1,
          birthday: formData.birthday
            ? new Date(formData.birthday).toISOString()
            : null,
          dateOfAppointment: formData.dateOfAppointment
            ? new Date(formData.dateOfAppointment).toISOString()
            : null,
          officialDesignation:
            formData.officialDesignation || formData.plantillaPosition,
        };
        await onUpdate(payload);
        toast.success(
          `${payload.firstName} ${payload.lastName} updated successfully`
        );
        onClose();
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Update failed");
      }
    },
    [formData, validateForm, onUpdate, onClose]
  );

  const renderField = useCallback(
    (name) => {
      const config = FIELD_CONFIG[name];
      if (!config) return null;

      if (name === "region")
        return (
          <SelectField
            label="Region"
            name="region"
            value={selectedRegion}
            options={["Caraga"]}
            onChange={handleRegionChange}
            required
          />
        );
      if (name === "province")
        return (
          <SelectField
            label="Province"
            name="province"
            value={selectedProvince}
            options={provinces}
            onChange={handleProvinceChange}
            required
          />
        );
      if (name === "lguName")
        return (
          <SelectField
            label="LGU"
            name="lguName"
            value={selectedLgu}
            options={lgus}
            onChange={handleLguChange}
            required
          />
        );
      if (["lguType", "incomeClass"].includes(name))
        return (
          <InputField
            label={config.label}
            name={name}
            value={formData[name] || ""}
            readOnly
          />
        );

      if (["sex", "statusOfAppointment", "civilStatus"].includes(name)) {
        const options =
          name === "sex"
            ? ["Male", "Female", "Other"]
            : name === "statusOfAppointment"
            ? ["Permanent", "Temporary", "Contractual", "Casual"]
            : [
                "Single",
                "Married",
                "Widowed",
                "Separated",
                "Divorced",
                "Others",
              ];
        return (
          <SelectField
            label={config.label}
            name={name}
            value={formData[name] || ""}
            options={options}
            onChange={(v) => handleInputChange(v, name)}
            required
          />
        );
      }

      return config.type === "select" ? (
        <SelectField
          label={config.label}
          name={name}
          value={formData[name] || ""}
          options={config.options}
          onChange={handleInputChange}
          required
        />
      ) : (
        <InputField
          label={config.label}
          name={name}
          value={formData[name] || ""}
          onChange={handleInputChange}
          type={config.type}
          error={errors[name]}
          required={config.validation?.includes("required")}
        />
      );
    },
    [
      formData,
      errors,
      selectedRegion,
      selectedProvince,
      selectedLgu,
      provinces,
      lgus,
      handleInputChange,
    ]
  );

  if (!isOpen || !editingPerson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-base-300 dark:border-gray-700 p-6 animate-fade-in">
        <ModalHeader editingPerson={editingPerson} onClose={onClose} />
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
              {FIELD_GROUPS.governmentInfo.map((f) => (
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

          <FormFooter
            localData={formData}
            formatDate={formatDate}
            updateLoading={updateLoading}
            onClose={onClose}
          />
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
            Edit Personnel
          </h2>
          <p className="text-base-content/70 font-medium">
            Update BLGF personnel record
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
