"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
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
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
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
              ${isPassword ? "pr-11" : ""}
              ${error ? "border-error focus:ring-error" : "border-border"}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <button
                type="button"
                onClick={handleToggle}
                className="pointer-events-auto text-muted hover:text-foreground transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          )}
        </div>
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
