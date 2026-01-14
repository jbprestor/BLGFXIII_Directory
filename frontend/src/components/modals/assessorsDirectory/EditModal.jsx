import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
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
  const { getAllLgusNoPagination } = useApi();

  const [formData, setFormData] = useState({});
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
      } catch (_err) {
        console.error("Failed to fetch LGUs:", _err);
        setAllLgusFromDb([]);
      }
    }
    fetchLGUs();
  }, []);

  // Initialize form
  useEffect(() => {
    if (editingPerson && allLgusFromDb.length) {
      const formatDateForInput = (dateString) =>
        dateString ? new Date(dateString).toISOString().split("T")[0] : "";

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
        plantillaPosition: editingPerson.plantillaPosition || "",
        officialDesignation: editingPerson.officialDesignation || "",
        birthday: formatDateForInput(editingPerson.birthday),
        dateOfAppointment: formatDateForInput(editingPerson.dateOfAppointment),
        prcLicenseExpiration: formatDateForInput(editingPerson.prcLicenseExpiration),
        dateOfMandatoryRetirement: formatDateForInput(editingPerson.dateOfMandatoryRetirement),
        dateOfCompulsoryRetirement: formatDateForInput(editingPerson.dateOfCompulsoryRetirement),
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
    if (name === "contactNumber" || name === "mobileNumber") sanitized = value.replace(/\D/g, "");
    if (name === "officeEmail" || name === "personalEmail")
      sanitized = value.toLowerCase().trim();
    if (name === "stepIncrement") sanitized = value.replace(/[^0-9]/g, "");

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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      try {
        const payload = {
          ...formData,
          stepIncrement: formData.stepIncrement ? Number(formData.stepIncrement) : 1,
          birthday: formData.birthday ? new Date(formData.birthday).toISOString() : null,
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
        };

        await onUpdate(payload);
        toast.success(
          `${payload.firstName || ""} ${payload.lastName || ""} updated successfully`
        );
        onClose();
      } catch (_err) {
        console.error(_err);
        toast.error(_err?.response?.data?.message || "Update failed");
      }
    },
    [formData, onUpdate, onClose]
  );

  const renderField = useCallback(
    (name) => {
      const config = FIELD_CONFIG[name];

      if (name === "region")
        return (
          <SelectField
            label="Region"
            name="region"
            value={selectedRegion}
            options={["Caraga"]}
            onChange={handleRegionChange}
            compact
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
            compact
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
            compact
          />
        );

      if (["lguType", "incomeClass"].includes(name))
        return (
          <InputField
            label={config?.label || name}
            name={name}
            value={formData[name] || ""}
            readOnly
            compact
          />
        );

      if (["sex", "statusOfAppointment", "civilStatus"].includes(name)) {
        const options =
          name === "sex"
            ? ["Male", "Female", "Other"]
            : name === "statusOfAppointment"
              ? ["Permanent", "Temporary", "Contractual", "Casual", "Acting", "OIC", "Job Order", "Retired"]
              : ["Single", "Married", "Widowed", "Separated", "Divorced", "Others"];
        return (
          <SelectField
            label={config?.label || name}
            name={name}
            value={formData[name] || ""}
            options={options}
            onChange={(v) => handleInputChange(v, name)}
            compact
          />
        );
      }

      if (name === "officialDesignation") {
        return (
          <InputField
            label={FIELD_CONFIG[name]?.label || "Official Designation"}
            name="officialDesignation"
            value={formData.officialDesignation || ""}
            onChange={handleInputChange}
            type="text"
            compact
          />
        );
      }

      if (config) {
        return config.type === "select" ? (
          <SelectField
            label={config.label}
            name={name}
            value={formData[name] || ""}
            options={config.options}
            onChange={handleInputChange}
            compact
          />
        ) : (
          <InputField
            label={config.label}
            name={name}
            value={formData[name] || ""}
            onChange={handleInputChange}
            type={config.type}
            compact
          />
        );
      }

      return null;
    },
    [formData, selectedRegion, selectedProvince, selectedLgu, provinces, lgus, handleInputChange]
  );

  if (!isOpen || !editingPerson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
      <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-base-300 dark:border-gray-700 animate-fade-in">
        <ModalHeader onClose={onClose} />

        <form id="edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <Section title={SECTION_CONFIG.personalInfo.title}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FIELD_GROUPS.personalInfo.map((f) => (
                <div key={f}>{renderField(f)}</div>
              ))}
            </div>
          </Section>

          <Section title={SECTION_CONFIG.governmentInfo.title}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FIELD_GROUPS.governmentInfo.map((f) => (
                <div key={f}>{renderField(f)}</div>
              ))}
            </div>
          </Section>

          <Section title={SECTION_CONFIG.importantDates.title}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FIELD_GROUPS.importantDates.map((f) => (
                <div key={f}>{renderField(f)}</div>
              ))}
            </div>
          </Section>

          <Section title={SECTION_CONFIG.education.title}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FIELD_GROUPS.education.map((f) => (
                <div key={f}>{renderField(f)}</div>
              ))}
            </div>
          </Section>
        </form>

        <FormFooter
          loading={updateLoading}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

/* ======= SUB COMPONENTS ======= */
function ModalHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 dark:border-gray-700 bg-base-200/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
          ✏️
        </div>
        <div>
          <h2 className="text-xl font-bold text-base-content leading-tight">
            Edit Personnel
          </h2>
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

function FormFooter({ loading, onClose }) {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-t border-base-300 dark:border-gray-700 bg-base-100">
      <div className="text-xs text-base-content/50 hidden sm:block">
        Fields marked with <span className="text-error">*</span> are required
      </div>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" form="edit-form" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs mr-2"></span>
              Updating...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
