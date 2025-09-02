// utils/fieldConfig.js
export const FIELD_CONFIG = {
  name: { 
    label: "Full Name", 
    type: "text", 
    validation: ["required"],
    placeholder: "Enter full name"
  },
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
  birthday: { 
    label: "Birthday", 
    type: "date", 
    validation: ["required", "date"]
  },
  contactNumber: { 
    label: "Contact Number", 
    type: "text", 
    validation: ["phone"],
    placeholder: "10-15 digits only",
    maxLength: 15
  },
  emailAddress: { 
    label: "Email Address", 
    type: "email", 
    validation: ["email"],
    placeholder: "user@example.com"
  },
  lguType: { 
    label: "LGU Type", 
    type: "select", 
    validation: ["required"],
    options: ["City", "Municipality", "Province"]
  },
  lguName: { 
    label: "LGU Name", 
    type: "text", 
    validation: ["required"],
    placeholder: "Enter LGU name"
  },
  incomeClass: { 
    label: "Income Class", 
    type: "text", 
    validation: ["required"],
    placeholder: "Enter income class"
  },
  plantillaPosition: { 
    label: "Plantilla Position", 
    type: "text", 
    validation: ["required"],
    placeholder: "Enter position title"
  },
  statusOfAppointment: { 
    label: "Status of Appointment", 
    type: "select", 
    validation: ["required"],
    options: ["Permanent", "Temporary", "Casual", "Job Order", "Contractual"]
  },
  dateOfAppointment: { 
    label: "Date of Appointment", 
    type: "date", 
    validation: ["required", "date"]
  },
  salaryGrade: { 
    label: "Salary Grade", 
    type: "text",
    placeholder: "e.g., SG-15"
  },
  stepIncrement: { 
    label: "Step Increment", 
    type: "number",
    min: 0,
    max: 8
  },
  prcLicenseNumber: { 
    label: "PRC License Number", 
    type: "text",
    placeholder: "Enter PRC license number"
  },
  dateOfMandatoryRetirement: { 
    label: "Date of Mandatory Retirement", 
    type: "date", 
    validation: ["date"]
  },
  dateOfCompulsoryRetirement: { 
    label: "Date of Compulsory Retirement", 
    type: "date", 
    validation: ["date"]
  },
  bachelorDegree: { 
    label: "Bachelor Degree", 
    type: "text",
    placeholder: "Enter bachelor's degree"
  },
  masteralDegree: { 
    label: "Masteral Degree", 
    type: "text",
    placeholder: "Enter master's degree"
  },
  doctoralDegree: { 
    label: "Doctoral Degree", 
    type: "text",
    placeholder: "Enter doctoral degree"
  },
  eligibility: { 
    label: "Eligibility", 
    type: "text",
    placeholder: "Enter eligibility/s"
  }
};
 
// Field groups for different sections
export const FIELD_GROUPS = {
  personalInfo: ["name", "sex", "civilStatus", "birthday", "contactNumber", "emailAddress"],
  governmentInfo: ["lguType", "lguName", "incomeClass", "plantillaPosition", "statusOfAppointment", "dateOfAppointment", "salaryGrade", "stepIncrement", "prcLicenseNumber"],
  importantDates: ["dateOfMandatoryRetirement", "dateOfCompulsoryRetirement"],
  education: ["bachelorDegree", "masteralDegree", "doctoralDegree", "eligibility"]
};

// Section configuration with icons and colors
export const SECTION_CONFIG = {
  personalInfo: {
    title: "Personal Information",
    color: "primary",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  },
  governmentInfo: {
    title: "Government Information",
    color: "secondary",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    )
  },
  importantDates: {
    title: "Important Dates",
    color: "accent",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    )
  },
  education: {
    title: "Educational Attainment",
    color: "info",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    )
  }
};