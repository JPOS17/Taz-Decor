import { FaTruck } from "react-icons/fa";
import "../../../styles/components/customerInterface/checkout/DeliveryEstimate.css";

// ============================================================================
// What the customer experiences = processing + transit combined.
//   Ground Advantage : 1–2 + 2–5 = 3–7 business days total
//   Priority Mail    : 1–2 + 1–3 = 2–5 business days total
//   Priority Express : 1   + 1–2 = 2–3 business days total
// ============================================================================

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

const DB_KEY_MAP: Record<string, string> = {
  usps_ground_advantage: "usps ground advantage",
  usps_priority: "usps priority mail",
  usps_priority_express: "usps priority mail express",
  ups_ground_saver: "usps ground advantage",
  ups_ground: "usps priority mail",
};

// ============================================================================
// HELPERS
// ============================================================================

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Adds n BUSINESS days (Mon–Fri) — weekends are skipped entirely
const addBusinessDays = (startDate: Date, n: number): Date => {
  const result = new Date(startDate);
  let added = 0;
  while (added < n) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) added++;
  }
  return result;
};

// Adds n CALENDAR days — used for Express transit since USPS delivers weekends
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

const resolveConfig = (methodName: string): ShippingConfig | null => {
  const normalized = methodName.toLowerCase().trim();

  // 1. DB key match
  const mappedKey =
    DB_KEY_MAP[normalized.replace(/ /g, "_")] ?? DB_KEY_MAP[normalized];
  if (mappedKey && SHIPPING_CONFIGS[mappedKey])
    return SHIPPING_CONFIGS[mappedKey];

  // 2. Exact human-readable match
  if (SHIPPING_CONFIGS[normalized]) return SHIPPING_CONFIGS[normalized];

  // 3. Partial match fallback
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

  // If we don't recognise the method, render nothing — fail silently
  if (!config) return null;

  const base = orderDate ? new Date(orderDate) : new Date();
  const addTransitDays = config.useCalendarDaysForTransit
    ? addCalendarDays
    : addBusinessDays;

  // Earliest possible delivery: processing min + transit min
  const earliestShipDate = addBusinessDays(base, config.processingDaysMin);
  const earliestDelivery = addTransitDays(
    earliestShipDate,
    config.transitDaysMin,
  );

  // Latest possible delivery: processing max + transit max
  const latestShipDate = addBusinessDays(base, config.processingDaysMax);
  const latestDelivery = addTransitDays(latestShipDate, config.transitDaysMax);

  const isSameDay =
    earliestDelivery.toDateString() === latestDelivery.toDateString();

  const rangeText = isSameDay
    ? formatDate(earliestDelivery)
    : `${formatDate(earliestDelivery)} – ${formatDate(latestDelivery)}`;

  // Total days shown in the subtext
  const totalDaysMin = config.processingDaysMin + config.transitDaysMin;
  const totalDaysMax = config.processingDaysMax + config.transitDaysMax;

  // Processing note varies by method
  const processingNote =
    config.processingDaysMax === 1
      ? "Includes 1 day processing"
      : "Includes 1–2 day processing";

  const dayLabel = config.useCalendarDaysForTransit ? "days" : "business days";

  return (
    <div className={`delivery-estimate ${className}`}>
      <div className="delivery-estimate__icon">
        <FaTruck />
      </div>
      <div className="delivery-estimate__body">
        <span className="delivery-estimate__label">Estimated Delivery</span>
        <span className="delivery-estimate__range">{rangeText}</span>
        <span className="delivery-estimate__sub">
          {totalDaysMin}–{totalDaysMax} {dayLabel}
        </span>
        <span className="delivery-estimate__sub">{processingNote}</span>
        <span className="delivery-estimate__disclaimer">
          Based on {config.label} service standards
        </span>
      </div>
    </div>
  );
};

export default DeliveryEstimate;
