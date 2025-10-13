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
        onChange={(e) => onChange(e.target.value)} // ✅ ensure value only
        required={required}
        {...props}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((option, idx) =>
          typeof option === "string" ? (
            <option key={idx} value={option}>
              {option}
            </option>
          ) : (
            <option key={idx} value={option.value}>
              {option.label}
            </option>
          )
        )}
      </select>
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export const DetailField = ({ label, value }) => {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text font-medium text-base-content text-sm">
          {label}
        </span>
      </label>
      <div className="p-3 bg-base-100/80 rounded-lg border border-base-300 text-base-content font-normal backdrop-blur-sm">
        {value || <span className="text-base-content/50">N/A</span>}
      </div>
    </div>
  );
};
