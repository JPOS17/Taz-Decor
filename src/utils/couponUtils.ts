// Returns the display label for a BOGO coupon
export const getBOGOLabel = (
  buyQuantity: number | null | undefined,
  getQuantity: number | null | undefined,
  discountPercentage: number | null | undefined
): string => {
  const buy = buyQuantity || 1;
  const get = getQuantity || 1;
  const pct = discountPercentage || 100;

  return pct === 100
    ? `Buy ${buy} Get ${get} FREE`
    : `Buy ${buy} Get ${get} ${pct}% OFF`;
};