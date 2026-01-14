export const InputField = ({
  label,
  name,
  value,
  error,
  onChange,
  required,
  type = "text",
  placeholder,
  compact = false,
  ...props
}) => {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text font-medium text-base-content/80 text-xs sm:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </span>
      </label>
      <input
        type={type}
        className={`input input-bordered w-full ${compact ? "input-sm" : ""} ${error ? "input-error" : ""
          }`}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        {...props}
      />
      {error && <span className="text-error text-xs mt-1">{error}</span>}
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
  compact = false,
  ...props
}) => {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text font-medium text-base-content/80 text-xs sm:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </span>
      </label>
      <select
        className={`select select-bordered w-full ${compact ? "select-sm" : ""} ${error ? "select-error" : ""
          }`}
        name={name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
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
      {error && <span className="text-error text-xs mt-1">{error}</span>}
    </div>
  );
};

export const DetailField = ({ label, value, compact = true }) => {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text font-medium text-base-content/70 text-xs uppercase tracking-wide">
          {label}
        </span>
      </label>
      <div
        className={`input input-bordered flex items-center bg-base-200/50 text-base-content w-full ${compact ? "input-sm text-sm" : ""}`}
      >
        {value || <span className="text-base-content/40 italic">N/A</span>}
      </div>
    </div>
  );
};
