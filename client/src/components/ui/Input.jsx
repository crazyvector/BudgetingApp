import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, className = "", id, ...props },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full px-3.5 py-2.5 rounded-xl
          bg-surface-700 border border-glass-border
          text-text-primary placeholder:text-text-muted
          outline-none
          transition-all duration-200
          focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger mt-0.5">{error}</p>
      )}
    </div>
  );
});

export default Input;
