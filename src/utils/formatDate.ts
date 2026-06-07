// Utility function to format date strings for display
export const formatDate = (
  dateString: string,
  includeTime: boolean = false,
  monthFormat: "long" | "short" = "long"
): string => {
  const options: Intl.DateTimeFormatOptions = includeTime
    ? { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: monthFormat, day: "numeric" };

  return new Date(dateString).toLocaleDateString("en-US", options);
};