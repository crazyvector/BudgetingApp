import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = "", id, ...props },
  ref
) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          w-full px-3.5 py-2.5 rounded-xl appearance-none
          bg-surface-700 border border-glass-border
          text-text-primary
          outline-none cursor-pointer
          transition-all duration-200
          focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]
          bg-no-repeat bg-[position:right_12px_center]
          pr-10
          ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-danger mt-0.5">{error}</p>
      )}
    </div>
  );
});

export default Select;
