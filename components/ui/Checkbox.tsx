interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

export function Checkbox({ checked, onChange, children }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary w-4 h-4 min-h-0 cursor-pointer"
      />
      <span className="text-sm text-muted">{children}</span>
    </label>
  );
}
