import { formatName } from "../../../utils/nameFormatter";

interface TextInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  type?: "text" | "number";
  rows?: number;
  disabled?: boolean;
  autoFormat?: boolean;
}

// Renders a text input or textarea depending on whether rows is provided
export function TextInput({
  value,
  onChange,
  placeholder,
  error = false,
  type = "text",
  rows,
  disabled = false,
  autoFormat = false,
}: TextInputProps) {
  // Formats the value on blur when autoFormat is enabled
  const handleBlur = () => {
    if (autoFormat && type === "text" && typeof value === "string") {
      const formatted = formatName(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  };

  // Textarea variant — rendered when a row count is provided
  if (rows) {
    return (
      <textarea
        className={`form-control ${error ? "invalid" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
    );
  }

  // Default single-line input — step set to 0.01 for number fields
  return (
    <input
      type={type}
      className={`form-control ${error ? "invalid" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      step={type === "number" ? "0.01" : undefined}
      disabled={disabled}
    />
  );
}
