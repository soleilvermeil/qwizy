"use client";

import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const variantStyles = {
  default: "bg-card-bg border border-border",
  elevated: "bg-card-bg shadow-md",
  outlined: "bg-transparent border-2 border-border",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      hover = false,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-xl
          transition-all duration-200
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hover ? "hover:shadow-lg hover:border-primary cursor-pointer" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mb-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-lg font-semibold text-foreground ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-sm text-muted mt-1 ${className}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = "CardDescription";

type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-4 pt-4 border-t border-border ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";
