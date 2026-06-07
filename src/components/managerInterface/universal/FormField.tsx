import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

// Wraps any input child with a label, optional error message, and helper text
export function FormField({
  label,
  required = false,
  error,
  helperText,
  children,
}: FormFieldProps) {
  return (
    <div className="form-group">
      {/* Label — appends "required" class when field is mandatory */}
      <label className={`form-label ${required ? "required" : ""}`}>
        {label}
      </label>
      {children}

      {/* Error takes priority over helper text */}
      {error && <span className="warning-message">{error}</span>}
      {helperText && !error && <span className="form-text">{helperText}</span>}
    </div>
  );
}
