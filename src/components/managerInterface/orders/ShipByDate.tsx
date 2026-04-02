import { Clock, AlertTriangle } from "lucide-react";
import "../../../styles/components/managerInterface/ShipByDate.css";

interface ShipByDateProps {
  orderCreatedAt: string;
  orderStatus: string;
  shippingService?: string | null;
  className?: string;
}

const PROCESSING_CAP: Record<string, number> = {
  usps_priority_express: 1,
  usps_priority: 2,
  usps_ground_advantage: 2,
};

const DEFAULT_PROCESSING_MAX = 2;

const resolveProcessingMax = (shippingService?: string | null): number => {
  if (!shippingService) return DEFAULT_PROCESSING_MAX;
  return (
    PROCESSING_CAP[shippingService.toLowerCase()] ?? DEFAULT_PROCESSING_MAX
  );
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/** Adds n business days (Mon–Fri) to a starting date — weekends are skipped */
const addBusinessDays = (startDate: Date, n: number): Date => {
  const result = new Date(startDate);
  let added = 0;
  while (added < n) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) added++;
  }
  return result;
};

const toDateOnly = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const FORMAT_OPTS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", FORMAT_OPTS);

// ============================================================================
// URGENCY LOGIC
//   "on-time"   — ship-by date is still in the future
//   "due-today" — ship-by date is today
//   "overdue"   — ship-by date has passed, order hasn't shipped
//   "shipped"   — order is already shipped/delivered/closed; badge hidden
// ============================================================================

type UrgencyState = "on-time" | "due-today" | "overdue" | "shipped";

const CLOSED_STATUSES = new Set([
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

const getUrgency = (shipByDate: Date, orderStatus: string): UrgencyState => {
  if (CLOSED_STATUSES.has(orderStatus)) return "shipped";

  const today = toDateOnly(new Date());
  const shipBy = toDateOnly(shipByDate);

  if (shipBy < today) return "overdue";
  if (shipBy.getTime() === today.getTime()) return "due-today";
  return "on-time";
};

/** Counts business days remaining from today up to (but not including) shipByDate */
const businessDaysUntil = (shipByDate: Date): number => {
  const today = toDateOnly(new Date());
  const target = toDateOnly(shipByDate);
  let count = 0;
  const cursor = new Date(today);

  while (toDateOnly(cursor) < target) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isWeekend(cursor)) count++;
  }
  return count;
};

const ShipByDate = ({
  orderCreatedAt,
  orderStatus,
  shippingService,
  className = "",
}: ShipByDateProps) => {
  const processingMax = resolveProcessingMax(shippingService);
  const createdAt = new Date(orderCreatedAt);
  const shipByDate = addBusinessDays(createdAt, processingMax);
  const urgency = getUrgency(shipByDate, orderStatus);

  if (urgency === "shipped") return null;

  const daysLeft = businessDaysUntil(shipByDate);

  const urgencyConfig: Record<
    Exclude<UrgencyState, "shipped">,
    { icon: React.ReactNode; modifier: string; subtext: string }
  > = {
    "on-time": {
      icon: <Clock size={16} />,
      modifier: "on-time",
      subtext:
        daysLeft === 1
          ? "1 business day remaining"
          : `${daysLeft} business days remaining`,
    },
    "due-today": {
      icon: <AlertTriangle size={16} />,
      modifier: "due-today",
      subtext: "Must ship today",
    },
    overdue: {
      icon: <AlertTriangle size={16} />,
      modifier: "overdue",
      subtext: "Overdue! Ship as soon as possible",
    },
  };

  const { icon, modifier, subtext } = urgencyConfig[urgency];

  const capNote =
    processingMax === 1
      ? "Express — 1 day processing"
      : "Standard — 2 day processing";

  return (
    <div className={`ship-by-date ship-by-date--${modifier} ${className}`}>
      <div className="ship-by-date__icon">{icon}</div>
      <div className="ship-by-date__body">
        <span className="ship-by-date__label">Ship By&nbsp;</span>
        <span className="ship-by-date__date">{formatDate(shipByDate)}</span>
        <span className="ship-by-date__sub">{subtext}</span>
        {/* <span className="ship-by-date__cap-note">{capNote}</span> */}
      </div>
    </div>
  );
};

export default ShipByDate;
