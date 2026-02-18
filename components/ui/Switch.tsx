"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  leftLabel,
  rightLabel,
  disabled = false,
  id,
}: SwitchProps) {
  const inputId = id || `${leftLabel}-${rightLabel}`.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={inputId}
      className={`relative inline-flex items-center gap-2 text-xs select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span className={`font-medium transition-colors ${!checked ? "text-foreground" : "text-muted"}`}>
        {leftLabel}
      </span>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`
          w-9 h-5 flex items-center shrink-0 rounded-full p-0.5
          transition-colors duration-200
          bg-secondary peer-checked:bg-primary/20
          after:w-4 after:h-4 after:rounded-full after:shadow-sm
          after:transition-transform after:duration-200
          after:bg-primary peer-checked:after:bg-primary
          peer-checked:after:translate-x-4
        `}
      />
      <span className={`font-medium transition-colors ${checked ? "text-foreground" : "text-muted"}`}>
        {rightLabel}
      </span>
    </label>
  );
}
