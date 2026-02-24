const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ProductCoupon {
  coupon_id: number;
  coupon_code: string;
  discount_type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping_only';
  discount_value: number | null; 
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  free_shipping: boolean;
  applies_to_type: 'all' | 'category' | 'product' | 'product_type' | 'variant' | 'custom_group';
  applies_to_id?: number | null;
  requires_verified_email: boolean;
  usage_limit_total?: number | null;
  usage_count_total: number;
  usage_limit_per_user: number | null;  // null = no per-user limit
  user_usage_count: number;             // 0 for guests (backend returns 0 when no userId)
  applies_to_name: string;
  description?: string | null;
  bogo_buy_quantity?: number | null;
  bogo_get_quantity?: number | null;
  bogo_discount_percentage?: number | null;
  valid_until?: string | null;
  location_ids?: number[]; 
}

export interface GroupedCoupons {
  all: ProductCoupon[];
  category: ProductCoupon[];
  product_type: ProductCoupon[];
  product: ProductCoupon[];
  variant: ProductCoupon[];
  custom_group: ProductCoupon[];
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * GET all active coupons for product listings.
 * Pass userId when the user is logged in so the backend can calculate
 * user_usage_count for check 5 (per-user limit). Omit for guest sessions.
 */
export const fetchProductCouponsPreview = async (
  userId?: number | null
): Promise<GroupedCoupons> => {
  const params = new URLSearchParams();
  if (userId) {
    params.set('userId', userId.toString());
  }

  const url = params.toString()
    ? `${API_URL}/api/products/coupons/preview?${params.toString()}`
    : `${API_URL}/api/products/coupons/preview`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch product coupons');
  }
  return response.json();
};

/**
 * GET applicable coupons for a specific variant.
 * Pass userId when the user is logged in so the backend can calculate
 * user_usage_count for check 5 (per-user limit). Omit for guest sessions.
 */
export const fetchApplicableCouponsForVariant = async (
  variantId: number,
  productId: number,
  categoryId: number,
  productTypeId?: number | null,
  userId?: number | null
): Promise<ProductCoupon[]> => {
  const params = new URLSearchParams({
    variantId: variantId.toString(),
    productId: productId.toString(),
    categoryId: categoryId.toString(),
    ...(productTypeId && { productTypeId: productTypeId.toString() }),
    ...(userId && { userId: userId.toString() }),
  });

  const response = await fetch(
    `${API_URL}/api/products/coupons/applicable?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch applicable coupons');
  }
  return response.json();
};

/**
 * GET per-user coupon usage counts for a logged-in user.
 * Returns a map of { coupon_id: usage_count }.
 * Only call this when the user is authenticated.
 */
export const fetchUserCouponUsage = async (
  userId: number
): Promise<Record<number, number>> => {
  const params = new URLSearchParams({ userId: userId.toString() });

  const response = await fetch(
    `${API_URL}/api/products/coupons/user-usage?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user coupon usage');
  }
  return response.json();
};

/**
 * GET eligible products for a coupon (used by coupon banner previews).
 * No userId needed — this is purely product data, not user-specific.
 */
export const fetchCouponEligibleProducts = async (
  couponId: number
): Promise<{ products: { variant_id: number; product_id: number; name: string; price: number; primary_image: string }[] }> => {
  const response = await fetch(
    `${API_URL}/api/products/coupons/${couponId}/eligible-products`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch coupon eligible products');
  }
  return response.json();
};

/**
 * Check which custom group coupons apply to a set of variant IDs.
 * No userId needed — just returns which coupons exist for those variants.
 */
export const checkCustomGroupCoupons = async (
  variantIds: number[]
): Promise<Record<number, number[]>> => {
  const params = new URLSearchParams({
    variantIds: variantIds.join(',')
  });

  const response = await fetch(
    `${API_URL}/api/products/coupons/check-custom-groups?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to check custom group coupons');
  }
  return response.json();
};

// ============================================================================
// COUPON TYPE HELPERS
// ============================================================================

/**
 * Cart-level coupons (applies_to_type = 'all') apply to the entire cart at checkout.
 */
export const isCartLevelCoupon = (coupon: ProductCoupon): boolean => {
  return coupon.applies_to_type === 'all';
};

/**
 * Item-level coupons apply to specific products/categories/variants.
 */
export const isItemLevelCoupon = (coupon: ProductCoupon): boolean => {
  return !isCartLevelCoupon(coupon);
};

/**
 * Returns true if the discount type is valid for a cart-level coupon.
 */
export const isValidCartLevelDiscountType = (
  discountType: ProductCoupon['discount_type']
): boolean => {
  return ['percentage', 'fixed', 'bogo', 'free_shipping_only'].includes(discountType);
};

/**
 * Returns true if the discount type is valid for an item-level coupon.
 */
export const isValidItemLevelDiscountType = (
  discountType: ProductCoupon['discount_type']
): boolean => {
  return ['percentage', 'bogo'].includes(discountType);
};

/**
 * Determines whether a coupon should display a discounted price on the product listing.
 */
export const shouldShowDiscountedPrice = (coupon: ProductCoupon): boolean => {
  if (isCartLevelCoupon(coupon)) return false;
  return coupon.discount_type === 'percentage' || coupon.discount_type === 'bogo';
};

// ============================================================================
// DISCOUNT CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate BOGO discount for a specific quantity.
 */
export const calculateBogoDiscount = (
  price: number,
  quantity: number,
  coupon: ProductCoupon
): { 
  discountedPrice: number; 
  discountAmount: number; 
  discountPercentage: number; 
  totalPrice: number; 
  qualifiesForBogo: boolean 
} => {
  const buyQty = coupon.bogo_buy_quantity || 1;
  const getQty = coupon.bogo_get_quantity || 1;
  const discountPercentage = coupon.bogo_discount_percentage || 100;
  
  // Check if quantity meets minimum requirement
  const minimumRequired = buyQty + getQty;
  if (quantity < minimumRequired) {
    return {
      discountedPrice: price,
      discountAmount: 0,
      discountPercentage: 0,
      totalPrice: price * quantity,
      qualifiesForBogo: false
    };
  }

  // Calculate how many complete BOGO sets we have
  const totalItemsPerSet = buyQty + getQty;
  const completeSets = Math.floor(quantity / totalItemsPerSet);
  const remainingItems = quantity % totalItemsPerSet;

  // Calculate discount for complete sets
  const discountPerSet = (price * getQty * discountPercentage) / 100;
  const totalDiscountFromSets = discountPerSet * completeSets;

  // Handle remaining items beyond a full set
  let remainingDiscount = 0;
  if (remainingItems > buyQty) {
    const extraDiscountedItems = remainingItems - buyQty;
    remainingDiscount = (price * extraDiscountedItems * discountPercentage) / 100;
  }

  const totalDiscount = totalDiscountFromSets + remainingDiscount;
  
  // Apply max discount cap if set
  const finalDiscount = coupon.max_discount_amount && totalDiscount > coupon.max_discount_amount 
    ? coupon.max_discount_amount 
    : totalDiscount;

  const totalPrice = Math.max(0, (price * quantity) - finalDiscount);
  const discountedPrice = quantity > 0 ? totalPrice / quantity : price;
  const effectiveDiscountPercentage = (price * quantity) > 0 
    ? parseFloat(((finalDiscount / (price * quantity)) * 100).toFixed(0))
    : 0;

  return {
    discountedPrice: parseFloat(discountedPrice.toFixed(2)),
    discountAmount: parseFloat(finalDiscount.toFixed(2)),
    discountPercentage: effectiveDiscountPercentage,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    qualifiesForBogo: true
  };
};

/**
 * Calculate the discount amount/price for a coupon against a given price + quantity.
 */
export const calculateDiscount = (
  price: number,
  coupon: ProductCoupon,
  quantity: number = 1
): { 
  discountedPrice: number; 
  discountAmount: number; 
  discountPercentage: number; 
  totalPrice?: number; 
  qualifiesForBogo?: boolean 
} => {
  if (
    coupon.discount_type === 'free_shipping_only' ||
    coupon.discount_type === 'fixed'
  ) {
    return {
      discountedPrice: price,
      discountAmount: 0,
      discountPercentage: 0,
      totalPrice: price * quantity
    };
  }

  if (coupon.discount_type === 'percentage' && coupon.discount_value !== null) {
    let discountAmount = (price * coupon.discount_value) / 100;
    
    if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount;
    }

    const discountedPrice = Math.max(0, price - discountAmount);
    const totalDiscount = discountAmount * quantity;
    const totalPrice = discountedPrice * quantity;
    
    return {
      discountedPrice: parseFloat(discountedPrice.toFixed(2)),
      discountAmount: parseFloat(totalDiscount.toFixed(2)),
      discountPercentage: parseFloat(((discountAmount / price) * 100).toFixed(0)),
      totalPrice: parseFloat(totalPrice.toFixed(2))
    };
  } else if (coupon.discount_type === 'bogo') {
    return calculateBogoDiscount(price, quantity, coupon);
  }

  return {
    discountedPrice: price,
    discountAmount: 0,
    discountPercentage: 0,
    totalPrice: price * quantity
  };
};

/**
 * Calculate the discount a cart-level coupon gives against the subtotal
 * (after item-level discounts have already been applied).
 *
 * Mirrors the server-side logic in couponCustomerController so the Cart page
 * preview matches what CheckoutPage/validateCoupons will produce.
 *
 * Returns:
 *   discountAmount  – monetary savings (0 for free_shipping_only)
 *   isFreeShipping  – true when discount_type === 'free_shipping_only'
 *   isEligible      – false when min_purchase_amount is not met
 */
export const calculateCartLevelDiscount = (
  coupon: ProductCoupon,
  subtotalAfterItemDiscounts: number,
): {
  discountAmount: number;
  isFreeShipping: boolean;
  isEligible: boolean;
} => {
  // Minimum purchase check
  if (
    coupon.min_purchase_amount &&
    subtotalAfterItemDiscounts < coupon.min_purchase_amount
  ) {
    return { discountAmount: 0, isFreeShipping: false, isEligible: false };
  }

  if (coupon.discount_type === 'free_shipping_only') {
    return { discountAmount: 0, isFreeShipping: true, isEligible: true };
  }

  let discountAmount = 0;

  if (coupon.discount_type === 'percentage' && coupon.discount_value != null) {
    discountAmount = subtotalAfterItemDiscounts * (coupon.discount_value / 100);
  } else if (coupon.discount_type === 'fixed' && coupon.discount_value != null) {
    discountAmount = coupon.discount_value;
  }

  // Apply max discount cap
  if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
    discountAmount = coupon.max_discount_amount;
  }

  // Never discount more than the subtotal
  discountAmount = Math.min(discountAmount, subtotalAfterItemDiscounts);

  return {
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    isFreeShipping: false,
    isEligible: true,
  };
};

// ============================================================================
// COUPON SELECTION HELPERS
// ============================================================================

/**
 * Find the best item-level coupon for a product based on maximum savings.
 * Only considers item-level coupons (category, product, product_type, variant, custom_group).
 */
export const findBestCoupon = (
  coupons: ProductCoupon[],
  price: number,
  quantity: number = 1
): ProductCoupon | null => {
  if (!coupons || coupons.length === 0) return null;

  // Only consider item-level coupons with valid item-level discount types
  const itemLevelCoupons = coupons.filter(
    c => isItemLevelCoupon(c) && isValidItemLevelDiscountType(c.discount_type)
  );

  if (itemLevelCoupons.length === 0) return null;

  let bestCoupon: ProductCoupon | null = null;
  let maxSavings = 0;

  for (const coupon of itemLevelCoupons) {
    const discountInfo = calculateDiscount(price, coupon, quantity);
    const discountAmount = discountInfo.discountAmount;
    
    // If this coupon saves more money, use it
    if (discountAmount > maxSavings) {
      maxSavings = discountAmount;
      bestCoupon = coupon;
    } 
    // If savings are very close (within $2), prefer BOGO for psychological appeal
    else if (Math.abs(discountAmount - maxSavings) <= 2 && coupon.discount_type === 'bogo') {
      bestCoupon = coupon;
    }
  }

  return bestCoupon;
};

// ============================================================================
// DISPLAY FORMATTING HELPERS
// ============================================================================

/**
 * Format BOGO badge text adaptively based on coupon configuration.
 */
export const formatBogoBadge = (coupon: ProductCoupon): string => {
  const buyQty = coupon.bogo_buy_quantity || 1;
  const getQty = coupon.bogo_get_quantity || 1;
  const discount = coupon.bogo_discount_percentage || 100;

  if (discount === 100) {
    if (buyQty === 1 && getQty === 1) {
      return "BOGO Free";
    }
    return `Buy ${buyQty} Get ${getQty} Free`;
  } else {
    if (buyQty === 1 && getQty === 1) {
      return `BOGO ${discount}% Off`;
    }
    return `Buy ${buyQty} Get ${getQty} ${discount}% Off`;
  }
};