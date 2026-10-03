import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  // Spans the full width when the field sits inside a two-column .product-form-grid
  wide?: boolean;
  children: React.ReactNode;
}

// Wraps any input child with a label, optional error message, and helper text
export function FormField({
  label,
  required = false,
  error,
  helperText,
  wide = false,
  children,
}: FormFieldProps) {
  return (
    <div className={`form-group${wide ? " form-group--wide" : ""}`}>
      {/* Label */}
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
