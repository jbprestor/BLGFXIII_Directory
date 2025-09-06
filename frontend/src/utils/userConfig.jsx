// utils/userConfig.jsx
export const USER_FIELD_CONFIG = {
  firstName: {
    label: "First Name",
    type: "text",
    validation: ["required"],
    placeholder: "Enter first name",
  },
  lastName: {
    label: "Last Name",
    type: "text",
    validation: ["required"],
    placeholder: "Enter last name",
  },
  email: {
    label: "Email",
    type: "email",
    validation: ["required", "email"],
    placeholder: "user@example.com",
  },
  password: {
    label: "Password",
    type: "password",
    validation: ["required", "minLength:8"],
    placeholder: "Enter strong password",
  },
  role: {
    label: "Role",
    type: "select",
    validation: ["required"],
    options: ["Admin", "Regional", "Provincial", "Municipal"],
  },

  isActive: {
    label: "Active Status",
    type: "checkbox",
    default: true,
  },
};

export const USER_FIELD_GROUPS = {
  account: ["username", "password", "email"],
  permissions: ["role", "isActive"],
};

export const USER_SECTION_CONFIG = {
  account: {
    title: "Account Information",
    color: "primary",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
      </svg>
    ),
  },
  permissions: {
    title: "User Permissions",
    color: "secondary",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 10a7 7 0 1114 0 7 7 0 01-14 0zm7-4a1 1 0 00-1 1v2a1 1 0 00.293.707l1.414 1.414a1 1 0 001.414-1.414L11 8.586V7a1 1 0 00-1-1z" />
      </svg>
    ),
  },
};
