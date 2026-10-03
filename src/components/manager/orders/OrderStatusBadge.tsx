// Color token for each order status (maps to a modifier class in the badge CSS)
const STATUS_COLORS: Record<string, string> = {
  pending: "gray",
  processing: "blue",
  ready_to_ship: "purple",
  shipped: "orange",
  delivered: "green",
  cancelled: "red",
  refunded: "pink",
};

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

// Renders a colored pill for an order status; unknown statuses fall back to grey
const OrderStatusBadge = ({ status, className = "" }: OrderStatusBadgeProps) => {
  const color = STATUS_COLORS[status] || "gray";

  return (
    <span
      className={`order-status-badge order-status-badge--${color} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};

export default OrderStatusBadge;