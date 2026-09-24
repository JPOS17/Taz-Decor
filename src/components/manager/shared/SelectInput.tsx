interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectInputProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

// Renders a styled <select> dropdown with an optional blank placeholder option
export function SelectInput({
  value,
  onChange,
  options,
  placeholder = "-- Select --",
  error = false,
}: SelectInputProps) {
  return (
    <select
      className={`form-control ${error ? "invalid" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {/* Empty-value placeholder */}
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
