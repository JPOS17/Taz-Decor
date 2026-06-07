import type { Location } from "../../../../api/sellerLocation";
import { FormField } from "../../universal/FormField";
import { SelectInput } from "../../universal/SelectInput";

interface WarehouseSelectorProps {
  value: string;
  onChange: (value: string) => void;
  locations: Location[];
  error?: string;
  required?: boolean;
}

// Thin wrapper around FormField + SelectInput for picking a warehouse shipping location
export function WarehouseSelector({
  value,
  onChange,
  locations,
  error,
  required = true,
}: WarehouseSelectorProps) {
  const options = locations.map((loc) => ({
    value: loc.location_id,
    label: `${loc.location_name} (${loc.state})`,
  }));

  return (
    <FormField
      label="Warehouse Location"
      required={required}
      error={error}
      helperText={!error ? "Where this product ships from" : undefined}
    >
      <SelectInput
        value={value}
        onChange={onChange}
        options={options}
        placeholder="-- Select Warehouse --"
        error={!!error}
      />
    </FormField>
  );
}
