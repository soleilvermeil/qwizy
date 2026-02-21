"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, type, showPassword: controlledShow, onTogglePassword, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const [internalShow, setInternalShow] = useState(false);

    const isPassword = type === "password";
    const isControlled = controlledShow !== undefined;
    const passwordVisible = isControlled ? controlledShow : internalShow;

    const handleToggle = () => {
      if (onTogglePassword) {
        onTogglePassword();
      } else {
        setInternalShow((v) => !v);
      }
    };

    return (
      <div className="w-full">
        {(label || isPassword) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <label
                htmlFor={inputId}
                className="text-sm font-medium text-foreground"
              >
                {label}
              </label>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={handleToggle}
                className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer ml-auto min-h-0"
                tabIndex={-1}
              >
                {passwordVisible ? "Hide password" : "Show password"}
              </button>
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && passwordVisible ? "text" : type}
          className={`
            w-full px-4 py-2.5 min-h-[44px]
            bg-input-bg text-foreground
            border-2 rounded-lg
            transition-all duration-200
            placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary
            ${error ? "border-error focus:ring-error" : "border-border"}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
