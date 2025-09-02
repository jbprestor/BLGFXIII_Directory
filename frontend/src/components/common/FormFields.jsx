// components/common/FormFields.jsx
export const InputField = ({
  label,
  name,
  value,
  error,
  onChange,
  required,
  type = "text",
  placeholder,
  ...props
}) => {
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
        placeholder={placeholder}
        {...props}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export const SelectField = ({
  label,
  name,
  value,
  error,
  onChange,
  required,
  options,
  placeholder,
  ...props
}) => {
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
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export const DetailField = ({ label, value }) => {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text font-medium text-gray-700 dark:text-gray-300 text-sm">{label}</span>
      </label>
      <div className="p-3 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-normal backdrop-blur-sm">
        {value || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
      </div>
    </div>
  );
};