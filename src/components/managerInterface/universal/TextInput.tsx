import { formatName } from "../../../utils/nameFormatter";

interface TextInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  type?: "text" | "number";
  rows?: number;
  disabled?: boolean;
  autoFormat?: boolean; // NEW
}

export function TextInput({
  value,
  onChange,
  placeholder,
  error = false,
  type = "text",
  rows,
  disabled = false,
  autoFormat = false, // NEW
}: TextInputProps) {
  const handleBlur = () => {
    if (autoFormat && type === "text" && typeof value === "string") {
      const formatted = formatName(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  };

  if (rows) {
    return (
      <textarea
        className={`form-control ${error ? "invalid" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur} // ADD THIS
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
    );
  }

  return (
    <input
      type={type}
      className={`form-control ${error ? "invalid" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur} // ADD THIS
      placeholder={placeholder}
      step={type === "number" ? "0.01" : undefined}
      disabled={disabled}
    />
  );
}
