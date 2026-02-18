import type { OrderDetails } from '../api/checkout';
import type { Location } from '../api/sellerLocation';

/**
 * Pirate Ship CSV row interface - customer shipping info and package details
 */
interface PirateShipRow {
  'Name': string;
  'Address': string;
  'City': string;
  'State': string;
  'Zip': string;
  'Weight (lbs)': string;
  'Length (in)': string;
  'Width (in)': string;
  'Height (in)': string;
  'Order Number': string;  
}

/**
 * Convert a single order to a Pirate Ship CSV row
 */
const orderToPirateShipRow = (order: OrderDetails): PirateShipRow => {
  const weightLbs = order.total_weight_oz
    ? (order.total_weight_oz / 16).toFixed(2)
    : '0.00';

  // Build full name from user's first/last name instead of address_name
  const fullName = [order.first_name, order.last_name]
    .filter(Boolean)
    .join(' ') || order.address_name || '';

  return {
    'Name': fullName,
    'Address': order.address_line1 || '',
    'City': order.city || '',
    'State': order.state || '',
    'Zip': order.zip || '',
    'Weight (lbs)': weightLbs,
    'Length (in)': order.box_length?.toString() || '0',
    'Width (in)': order.box_width?.toString() || '0',
    'Height (in)': order.box_height?.toString() || '0',
    'Order Number': order.order_number || '', 
  };
};

/**
 * Escape a field for CSV format
 * Wraps in quotes if the value contains a comma, quote, or newline
 */
const escapeCSVField = (value: string): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Convert array of orders to a Pirate Ship CSV string
 */
export const generatePirateShipCSV = (orders: OrderDetails[], sellerLocation: Location): string => {
  if (orders.length === 0) {
    throw new Error('No orders provided for CSV generation');
  }

  const rows = orders.map(orderToPirateShipRow);
  const headers = Object.keys(rows[0]) as Array<keyof PirateShipRow>;

  const csvLines: string[] = [];

  // Header row
  csvLines.push(headers.map(escapeCSVField).join(','));

  // Data rows
  for (const row of rows) {
    csvLines.push(headers.map(header => escapeCSVField(row[header])).join(','));
  }

  return csvLines.join('\n');
};

/**
 * Trigger a CSV file download in the browser
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Generate a timestamped filename for the export
 */
export const generatePirateShipFilename = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `pirateship-export-${dateStr}-${timeStr}.csv`;
};