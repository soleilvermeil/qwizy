"use client";

interface TokenFieldSelectOption {
  value: string;
  label: string;
}

interface TokenFieldSelectProps {
  label?: string;
  placeholder?: string;
  options: TokenFieldSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function TokenFieldSelect({
  label,
  placeholder = "Add...",
  options,
  value,
  onChange,
  disabled = false,
}: TokenFieldSelectProps) {
  const selectedSet = new Set(value);
  const availableOptions = options.filter((o) => !selectedSet.has(o.value));
  const getLabel = (val: string) =>
    options.find((o) => o.value === val)?.label || val;

  const handleAdd = (optionValue: string) => {
    if (optionValue && !selectedSet.has(optionValue)) {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div
        className={`
          w-full px-3 py-2 min-h-[44px]
          bg-input-bg text-foreground
          border-2 rounded-lg border-border
          transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed bg-secondary" : ""}
        `}
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {value.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium"
            >
              {getLabel(val)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  className="hover:text-error transition-colors"
                  aria-label={`Remove ${getLabel(val)}`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {availableOptions.length > 0 && !disabled && (
            <div className="relative inline-flex">
              <select
                value=""
                onChange={(e) => handleAdd(e.target.value)}
                className="pl-2 pr-6 py-0.5 text-xs bg-transparent border border-border rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring text-muted appearance-none"
              >
                <option value="" disabled>
                  {placeholder}
                </option>
                {availableOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                <svg
                  className="w-3 h-3 text-muted"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          )}

          {value.length === 0 && availableOptions.length === 0 && (
            <p className="text-sm text-muted">No fields available</p>
          )}
        </div>
      </div>
    </div>
  );
}
