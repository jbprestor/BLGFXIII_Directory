import { useState, useEffect } from "react";

export default function EditModal({
  isOpen,
  editingPerson,
  updateLoading,
  onInputChange,
  onUpdate,
  onClose,
  formatDate,
}) {
  const [localData, setLocalData] = useState(editingPerson || {});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingPerson) {
      // Format dates for input fields (convert from ISO to YYYY-MM-DD)
      const formattedData = {
        ...editingPerson,
        birthday: editingPerson.birthday
          ? new Date(editingPerson.birthday).toISOString().split("T")[0]
          : "",
        dateOfMandatoryRetirement: editingPerson.dateOfMandatoryRetirement
          ? new Date(editingPerson.dateOfMandatoryRetirement)
              .toISOString()
              .split("T")[0]
          : "",
        dateOfCompulsoryRetirement: editingPerson.dateOfCompulsoryRetirement
          ? new Date(editingPerson.dateOfCompulsoryRetirement)
              .toISOString()
              .split("T")[0]
          : "",
        dateOfAppointment: editingPerson.dateOfAppointment
          ? new Date(editingPerson.dateOfAppointment)
              .toISOString()
              .split("T")[0]
          : "",
      };
      setLocalData(formattedData);
    }
  }, [editingPerson]);

  if (!isOpen || !editingPerson) return null;

  // Validation rules based on your MongoDB schema
  const validateField = (name, value) => {
    let error = "";

    // Check required fields
    const requiredFields = [
      "name",
      "sex",
      "civilStatus",
      "lguType",
      "lguName",
      "incomeClass",
      "plantillaPosition",
      "statusOfAppointment",
      "birthday",
      "dateOfAppointment",
    ];
    if (requiredFields.includes(name) && !value.trim()) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
      return error;
    }

    switch (name) {
      case "sex":
        if (!["Male", "Female", "Other"].includes(value)) {
          error = "Invalid sex selection";
        }
        break;
      case "civilStatus":
        if (
          !["Single", "Married", "Widowed", "Separated", "Other"].includes(
            value
          )
        ) {
          error = "Invalid civil status selection";
        }
        break;
      case "lguType":
        if (!["City", "Municipality", "Province"].includes(value)) {
          error = "Invalid LGU type selection";
        }
        break;
      case "statusOfAppointment":
        if (
          ![
            "Permanent",
            "Temporary",
            "Casual",
            "Job Order",
            "Contractual",
          ].includes(value)
        ) {
          error = "Invalid appointment status selection";
        }
        break;
      case "contactNumber":
        if (value && !/^[0-9]{10,15}$/.test(value.replace(/\D/g, ""))) {
          error = "Contact number must be 10-15 digits";
        }
        break;
      case "emailAddress":
        if (value && !/^\S+@\S+\.\S+$/.test(value)) {
          error = "Invalid email format";
        }
        break;
      case "stepIncrement":
        if (value && (isNaN(value) || parseInt(value) < 0)) {
          error = "Step increment must be a non-negative number";
        }
        break;
      case "birthday":
      case "dateOfMandatoryRetirement":
      case "dateOfCompulsoryRetirement":
      case "dateOfAppointment":
        if (value && isNaN(Date.parse(value))) {
          error = "Invalid date format";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
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

    const fieldError = validateField(name, sanitizedValue);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
    setLocalData((prev) => ({ ...prev, [name]: sanitizedValue }));

    if (onInputChange) {
      onInputChange({ target: { name, value: sanitizedValue } });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "name",
      "sex",
      "civilStatus",
      "lguType",
      "lguName",
      "incomeClass",
      "plantillaPosition",
      "statusOfAppointment",
      "birthday",
      "dateOfAppointment",
    ];

    // Validate all fields
    Object.keys(localData).forEach((key) => {
      const error = validateField(key, localData[key]);
      if (error) newErrors[key] = error;
    });

    // Check required fields
    requiredFields.forEach((field) => {
      if (!localData[field] || localData[field].toString().trim() === "") {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        } is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix all errors before submitting.");
      return;
    }

    if (onUpdate) {
      // Pass the localData directly instead of creating submissionData
      await onUpdate(e); // This matches the parent component's expectation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-gray-300 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
              {editingPerson.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">
                Edit Personnel
              </h2>
              <p className="text-gray-500">{editingPerson.name}</p>
            </div>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 text-2xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Full Name - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  name="name"
                  value={localData.name || ""}
                  onChange={handleInputChange}
                  required
                />
                {errors.name && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Sex - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Sex <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  className={`select select-bordered w-full ${
                    errors.sex ? "border-red-500" : ""
                  }`}
                  name="sex"
                  value={localData.sex || ""}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.sex && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.sex}
                  </span>
                )}
              </div>

              {/* Civil Status - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Civil Status <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  className={`select select-bordered w-full ${
                    errors.civilStatus ? "border-red-500" : ""
                  }`}
                  name="civilStatus"
                  value={localData.civilStatus || ""}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Other">Other</option>
                </select>
                {errors.civilStatus && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.civilStatus}
                  </span>
                )}
              </div>

              {/* Birthday - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Birthday <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  className={`input input-bordered w-full ${
                    errors.birthday ? "border-red-500" : ""
                  }`}
                  name="birthday"
                  value={localData.birthday || ""}
                  onChange={handleInputChange}
                  required
                />
                {errors.birthday && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.birthday}
                  </span>
                )}
              </div>

              {/* Contact Information */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Contact Number</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.contactNumber ? "border-red-500" : ""
                  }`}
                  name="contactNumber"
                  value={localData.contactNumber || ""}
                  onChange={handleInputChange}
                  placeholder="10-15 digits only"
                  maxLength="15"
                />
                {errors.contactNumber && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.contactNumber}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>
                <input
                  type="email"
                  className={`input input-bordered w-full ${
                    errors.emailAddress ? "border-red-500" : ""
                  }`}
                  name="emailAddress"
                  value={localData.emailAddress || ""}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                />
                {errors.emailAddress && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.emailAddress}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Government Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Government Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* LGU Type - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    LGU Type <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  className={`select select-bordered w-full ${
                    errors.lguType ? "border-red-500" : ""
                  }`}
                  name="lguType"
                  value={localData.lguType || ""}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select LGU Type</option>
                  <option value="City">City</option>
                  <option value="Municipality">Municipality</option>
                  <option value="Province">Province</option>
                </select>
                {errors.lguType && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.lguType}
                  </span>
                )}
              </div>

              {/* LGU Name - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    LGU Name <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.lguName ? "border-red-500" : ""
                  }`}
                  name="lguName"
                  value={localData.lguName || ""}
                  onChange={handleInputChange}
                  required
                />
                {errors.lguName && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.lguName}
                  </span>
                )}
              </div>

              {/* Income Class - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Income Class <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.incomeClass ? "border-red-500" : ""
                  }`}
                  name="incomeClass"
                  value={localData.incomeClass || ""}
                  onChange={handleInputChange}
                  required
                />
                {errors.incomeClass && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.incomeClass}
                  </span>
                )}
              </div>

              {/* Plantilla Position - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Plantilla Position <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.plantillaPosition ? "border-red-500" : ""
                  }`}
                  name="plantillaPosition"
                  value={localData.plantillaPosition || ""}
                  onChange={handleInputChange}
                  required
                />
                {errors.plantillaPosition && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.plantillaPosition}
                  </span>
                )}
              </div>

              {/* Status of Appointment - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Status of Appointment{" "}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  className={`select select-bordered w-full ${
                    errors.statusOfAppointment ? "border-red-500" : ""
                  }`}
                  name="statusOfAppointment"
                  value={localData.statusOfAppointment || ""}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Casual">Casual</option>
                  <option value="Job Order">Job Order</option>
                  <option value="Contractual">Contractual</option>
                </select>
                {errors.statusOfAppointment && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.statusOfAppointment}
                  </span>
                )}
              </div>

              {/* Date of Appointment - Required */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Date of Appointment <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  className={`input input-bordered w-full ${
                    errors.dateOfAppointment ? "border-red-500" : ""
                  }`}
                  name="dateOfAppointment"
                  value={localData.dateOfAppointment || ""}
                  onChange={handleInputChange}
                  required
                />
                {errors.dateOfAppointment && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.dateOfAppointment}
                  </span>
                )}
              </div>

              {/* Salary Grade */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Salary Grade</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.salaryGrade ? "border-red-500" : ""
                  }`}
                  name="salaryGrade"
                  value={localData.salaryGrade || ""}
                  onChange={handleInputChange}
                />
                {errors.salaryGrade && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.salaryGrade}
                  </span>
                )}
              </div>

              {/* Step Increment */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Step Increment</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`input input-bordered w-full ${
                    errors.stepIncrement ? "border-red-500" : ""
                  }`}
                  name="stepIncrement"
                  value={localData.stepIncrement || ""}
                  onChange={handleInputChange}
                />
                {errors.stepIncrement && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.stepIncrement}
                  </span>
                )}
              </div>

              {/* PRC License Number */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    PRC License Number
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.prcLicenseNumber ? "border-red-500" : ""
                  }`}
                  name="prcLicenseNumber"
                  value={localData.prcLicenseNumber || ""}
                  onChange={handleInputChange}
                />
                {errors.prcLicenseNumber && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.prcLicenseNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Important Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Date of Mandatory Retirement
                  </span>
                </label>
                <input
                  type="date"
                  className={`input input-bordered w-full ${
                    errors.dateOfMandatoryRetirement ? "border-red-500" : ""
                  }`}
                  name="dateOfMandatoryRetirement"
                  value={localData.dateOfMandatoryRetirement || ""}
                  onChange={handleInputChange}
                />
                {errors.dateOfMandatoryRetirement && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.dateOfMandatoryRetirement}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Date of Compulsory Retirement
                  </span>
                </label>
                <input
                  type="date"
                  className={`input input-bordered w-full ${
                    errors.dateOfCompulsoryRetirement ? "border-red-500" : ""
                  }`}
                  name="dateOfCompulsoryRetirement"
                  value={localData.dateOfCompulsoryRetirement || ""}
                  onChange={handleInputChange}
                />
                {errors.dateOfCompulsoryRetirement && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.dateOfCompulsoryRetirement}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Educational Attainment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Educational Attainment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Bachelor Degree
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.bachelorDegree ? "border-red-500" : ""
                  }`}
                  name="bachelorDegree"
                  value={localData.bachelorDegree || ""}
                  onChange={handleInputChange}
                />
                {errors.bachelorDegree && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.bachelorDegree}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Masteral Degree
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.masteralDegree ? "border-red-500" : ""
                  }`}
                  name="masteralDegree"
                  value={localData.masteralDegree || ""}
                  onChange={handleInputChange}
                />
                {errors.masteralDegree && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.masteralDegree}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Doctoral Degree
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.doctoralDegree ? "border-red-500" : ""
                  }`}
                  name="doctoralDegree"
                  value={localData.doctoralDegree || ""}
                  onChange={handleInputChange}
                />
                {errors.doctoralDegree && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.doctoralDegree}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Eligibility</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    errors.eligibility ? "border-red-500" : ""
                  }`}
                  name="eligibility"
                  value={localData.eligibility || ""}
                  onChange={handleInputChange}
                />
                {errors.eligibility && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.eligibility}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t">
            <div className="text-sm text-gray-400">
              Last updated:{" "}
              {formatDate ? formatDate(localData.updatedAt) : "Never"}
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
        </form>
      </div>
    </div>
  );
}
