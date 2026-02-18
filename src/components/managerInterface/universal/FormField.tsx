import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  error,
  helperText,
  children,
}: FormFieldProps) {
  return (
    <div className="form-group">
      <label className={`form-label ${required ? "required" : ""}`}>
        {label}
      </label>
      {children}
      {error && <span className="warning-message">{error}</span>}
      {helperText && !error && <span className="form-text">{helperText}</span>}
    </div>
  );
}
