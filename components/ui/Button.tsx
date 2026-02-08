"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "success" | "warning" | "error";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover focus:ring-primary",
  secondary:
    "bg-secondary text-foreground hover:bg-accent active:bg-accent focus:ring-secondary",
  outline:
    "border-2 border-border bg-transparent text-foreground hover:bg-secondary active:bg-accent focus:ring-border",
  ghost:
    "bg-transparent text-foreground hover:bg-secondary active:bg-accent focus:ring-transparent",
  success:
    "bg-success text-white hover:bg-success-hover active:bg-success-hover focus:ring-success",
  warning:
    "bg-warning text-white hover:bg-warning-hover active:bg-warning-hover focus:ring-warning",
  error:
    "bg-error text-white hover:bg-error-hover active:bg-error-hover focus:ring-error",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm min-h-[36px]",
  md: "px-4 py-2.5 text-base min-h-[44px]",
  lg: "px-6 py-3 text-lg min-h-[52px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
