import { FaTruck } from "react-icons/fa";
import "../../../styles/components/customerInterface/checkout/DeliveryEstimate.css";

// Total delivery = processing + transit time per method:
//   Ground Advantage    : 1–2 + 2–5 = 3–7 business days
//   Priority Mail       : 1–2 + 1–3 = 2–5 business days
//   Priority Mail Express: 1  + 1–2 = 2–3 calendar days

interface DeliveryEstimateProps {
  shippingMethodName: string;
  orderDate?: Date;
  className?: string;
}

interface ShippingConfig {
  processingDaysMin: number;
  processingDaysMax: number;
  transitDaysMin: number;
  transitDaysMax: number;
  label: string;
  useCalendarDaysForTransit: boolean;
}

// Per-method timing config — transit strategy varies (business vs calendar days)
const SHIPPING_CONFIGS: Record<string, ShippingConfig> = {
  "usps ground advantage": {
    processingDaysMin: 1,
    processingDaysMax: 2,
    transitDaysMin: 2,
    transitDaysMax: 5,
    label: "USPS Ground Advantage",
    useCalendarDaysForTransit: false,
  },
  "usps priority mail": {
    processingDaysMin: 1,
    processingDaysMax: 2,
    transitDaysMin: 1,
    transitDaysMax: 3,
    label: "USPS Priority Mail",
    useCalendarDaysForTransit: false,
  },
  "usps priority mail express": {
    processingDaysMin: 1,
    processingDaysMax: 1,
    transitDaysMin: 1,
    transitDaysMax: 2,
    label: "USPS Priority Mail Express",
    useCalendarDaysForTransit: true,
  },
};

// Maps DB snake_case keys to human-readable config keys
const DB_KEY_MAP: Record<string, string> = {
  usps_ground_advantage: "usps ground advantage",
  usps_priority: "usps priority mail",
  usps_priority_express: "usps priority mail express",
};

// ============================================================================
// HELPERS
// ============================================================================

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Advances a date by n business days, skipping Saturdays and Sundays
const addBusinessDays = (startDate: Date, n: number): Date => {
  const result = new Date(startDate);
  let added = 0;
  while (added < n) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) added++;
  }
  return result;
};

// Advances a date by n calendar days — used for Express since USPS delivers on weekends
const addCalendarDays = (startDate: Date, n: number): Date => {
  const result = new Date(startDate);
  result.setDate(result.getDate() + n);
  return result;
};

const FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", FORMAT_OPTIONS);

// Resolves a shipping method name to its config via DB key, exact match, or partial fallback
const resolveConfig = (methodName: string): ShippingConfig | null => {
  const normalized = methodName.toLowerCase().trim();

  const mappedKey =
    DB_KEY_MAP[normalized.replace(/ /g, "_")] ?? DB_KEY_MAP[normalized];
  if (mappedKey && SHIPPING_CONFIGS[mappedKey])
    return SHIPPING_CONFIGS[mappedKey];

  if (SHIPPING_CONFIGS[normalized]) return SHIPPING_CONFIGS[normalized];

  const key = Object.keys(SHIPPING_CONFIGS).find(
    (k) => normalized.includes(k) || k.includes(normalized),
  );
  return key ? SHIPPING_CONFIGS[key] : null;
};

// ============================================================================
// COMPONENT
// ============================================================================

const DeliveryEstimate = ({
  shippingMethodName,
  orderDate,
  className = "",
}: DeliveryEstimateProps) => {
  const config = resolveConfig(shippingMethodName);

  // Unrecognized shipping method — render nothing rather than showing bad data
  if (!config) return null;

  const base = orderDate ? new Date(orderDate) : new Date();
  const addTransitDays = config.useCalendarDaysForTransit
    ? addCalendarDays
    : addBusinessDays;

  // Earliest delivery: processing min + transit min
  const earliestShipDate = addBusinessDays(base, config.processingDaysMin);
  const earliestDelivery = addTransitDays(
    earliestShipDate,
    config.transitDaysMin,
  );

  // Latest delivery: processing max + transit max
  const latestShipDate = addBusinessDays(base, config.processingDaysMax);
  const latestDelivery = addTransitDays(latestShipDate, config.transitDaysMax);

  const isSameDay =
    earliestDelivery.toDateString() === latestDelivery.toDateString();

  const rangeText = isSameDay
    ? formatDate(earliestDelivery)
    : `${formatDate(earliestDelivery)} – ${formatDate(latestDelivery)}`;

  const totalDaysMin = config.processingDaysMin + config.transitDaysMin;
  const totalDaysMax = config.processingDaysMax + config.transitDaysMax;

  // Processing note varies by whether the method has a 1 or 1–2 day window
  const processingNote =
    config.processingDaysMax === 1
      ? "Includes 1 day processing"
      : "Includes 1–2 day processing";

  const dayLabel = config.useCalendarDaysForTransit ? "days" : "business days";

  return (
    <div className={`de-delivery-estimate ${className}`}>
      <div className="de-icon">
        <FaTruck />
      </div>
      <div className="de-body">
        <span className="de-label">Estimated Delivery</span>
        <span className="de-range">{rangeText}</span>
        <span className="de-sub">
          {totalDaysMin}–{totalDaysMax} {dayLabel}
        </span>
        <span className="de-sub">{processingNote}</span>
        <span className="de-disclaimer">
          Based on {config.label} service standards
        </span>
      </div>
    </div>
  );
};

export default DeliveryEstimate;
