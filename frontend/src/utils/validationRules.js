// validationRules.js
export const VALIDATION_RULES = {
    required: {
        test: (value) => value?.toString().trim() !== "",
        message: (field) => `${field} is required`,
    },
    email: {
        test: (value) => !value || /^\S+@\S+\.\S+$/.test(value),
        message: "Invalid email format",
    },
    phone: {
        test: (value) => !value || /^[0-9]{10,15}$/.test(value.replace(/\D/g, "")),
        message: "Contact number must be 10-15 digits",
    },
    number: {
        test: (value) => !value || (!isNaN(value) && parseInt(value) >= 0),
        message: "Must be a non-negative number",
    },
    date: {
        test: (value) => !value || !isNaN(Date.parse(value)),
        message: "Invalid date format",
    },
    select: {
        test: (value, options) => !value || options.includes(value),
        message: "Invalid selection",
    },
};

export const FIELD_CONFIG = {
    name: { label: "Full Name", type: "text", validation: ["required"] },
    sex: {
        label: "Sex",
        type: "select",
        validation: ["required"],
        options: ["Male", "Female", "Other"]
    },
    civilStatus: {
        label: "Civil Status",
        type: "select",
        validation: ["required"],
        options: ["Single", "Married", "Widowed", "Separated", "Other"]
    },
    birthday: { label: "Birthday", type: "date", validation: ["required", "date"] },
    contactNumber: { label: "Contact Number", type: "text", validation: ["phone"] },
    emailAddress: { label: "Email Address", type: "email", validation: ["email"] },
    lguType: {
        label: "LGU Type",
        type: "select",
        validation: ["required"],
        options: ["City", "Municipality", "Province"]
    },
    lguName: { label: "LGU Name", type: "text", validation: ["required"] },
    incomeClass: { label: "Income Class", type: "text", validation: ["required"] },
    plantillaPosition: { label: "Plantilla Position", type: "text", validation: ["required"] },
    statusOfAppointment: {
        label: "Status of Appointment",
        type: "select",
        validation: ["required"],
        options: ["Permanent", "Temporary", "Casual", "Job Order", "Contractual"]
    },
    dateOfAppointment: { label: "Date of Appointment", type: "date", validation: ["required", "date"] },
    salaryGrade: { label: "Salary Grade", type: "text" },
    stepIncrement: { label: "Step Increment", type: "number", validation: ["number"] },
    prcLicenseNumber: { label: "PRC License Number", type: "text" },
    dateOfMandatoryRetirement: { label: "Date of Mandatory Retirement", type: "date", validation: ["date"] },
    dateOfCompulsoryRetirement: { label: "Date of Compulsory Retirement", type: "date", validation: ["date"] },
    bachelorDegree: { label: "Bachelor Degree", type: "text" },
    masteralDegree: { label: "Masteral Degree", type: "text" },
    doctoralDegree: { label: "Doctoral Degree", type: "text" },
    eligibility: { label: "Eligibility", type: "text" },
};

export const validateField = (name, value, config = FIELD_CONFIG) => {
    const fieldConfig = config[name];
    if (!fieldConfig || !fieldConfig.validation) return "";

    for (const rule of fieldConfig.validation) {
        if (VALIDATION_RULES[rule]) {
            let isValid;
            if (rule === "select") {
                isValid = VALIDATION_RULES[rule].test(value, fieldConfig.options);
            } else {
                isValid = VALIDATION_RULES[rule].test(value);
            }

            if (!isValid) {
                return typeof VALIDATION_RULES[rule].message === "function"
                    ? VALIDATION_RULES[rule].message(fieldConfig.label)
                    : VALIDATION_RULES[rule].message;
            }
        }
    }

    return "";
};