"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-4 py-2.5 min-h-[100px]
            bg-input-bg text-foreground
            border-2 rounded-lg
            transition-all duration-200
            placeholder:text-muted
            resize-y
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary
            ${error ? "border-error focus:ring-error" : "border-border"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
