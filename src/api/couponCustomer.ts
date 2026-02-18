const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ProductCoupon {
  coupon_id: number;
  coupon_code: string;
  discount_type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping_only';
  discount_value: number | null; // Can be null for BOGO coupons and free_shipping_only
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  free_shipping: boolean;
  applies_to_type: 'all' | 'category' | 'product' | 'product_type' | 'variant' | 'custom_group';
  applies_to_id?: number | null;
  requires_verified_email: boolean;
  usage_limit_total?: number | null;
  usage_count_total: number;
  applies_to_name: string;
  description?: string | null;
  bogo_buy_quantity?: number | null;
  bogo_get_quantity?: number | null;
  bogo_discount_percentage?: number | null;
  valid_until?: string | null;
  location_ids?: number[]; // Array of location IDs this coupon applies to
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
 * GET all active coupons for product listings
 */
export const fetchProductCouponsPreview = async (): Promise<GroupedCoupons> => {
  const response = await fetch(`${API_URL}/api/products/coupons/preview`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch product coupons');
  }
  return response.json();
};

/**
 * Get applicable coupons for a specific variant
 */
export const fetchApplicableCouponsForVariant = async (
  variantId: number,
  productId: number,
  categoryId: number,
  productTypeId?: number | null
): Promise<ProductCoupon[]> => {
  const params = new URLSearchParams({
    variantId: variantId.toString(),
    productId: productId.toString(),
    categoryId: categoryId.toString(),
    ...(productTypeId && { productTypeId: productTypeId.toString() }),
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
 * Check which custom group coupons apply to variants
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
 * Helper to determine if a coupon is cart-level (applies at checkout to entire cart)
 */
export const isCartLevelCoupon = (coupon: ProductCoupon): boolean => {
  // Cart-level coupons are any coupon that applies to "all" products (site-wide promotions)
  return (
    coupon.applies_to_type === 'all'
  );
};

/**
 * Helper to determine if a coupon is item-level (applies to individual items)
 */
export const isItemLevelCoupon = (coupon: ProductCoupon): boolean => {
  return !isCartLevelCoupon(coupon);
};

/**
 * Helper to determine if coupon should show discounted price
 */
export const shouldShowDiscountedPrice = (coupon: ProductCoupon): boolean => {
  // Percentage, fixed, and BOGO discounts all show discounted prices
  // Free shipping only doesn't change the displayed price
  return (
    coupon.discount_type === 'percentage' || 
    coupon.discount_type === 'fixed' ||
    coupon.discount_type === 'bogo'
  );
};

// ============================================================================
// DISCOUNT CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate BOGO discount for a specific quantity
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

  // Handle remaining items (they might qualify for partial BOGO)
  let remainingDiscount = 0;
  if (remainingItems > buyQty) {
    // We have enough items for another buy quantity, so we can discount the extra items
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
 * Helper function to calculate discounted price
 * NOTE: free_shipping_only coupons don't affect price
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
  let discountAmount = 0;

  // Free shipping only doesn't change the price
  if (coupon.discount_type === 'free_shipping_only') {
    return {
      discountedPrice: price,
      discountAmount: 0,
      discountPercentage: 0,
      totalPrice: price * quantity
    };
  }

  if (coupon.discount_type === 'percentage' && coupon.discount_value !== null) {
    discountAmount = (price * coupon.discount_value) / 100;
    
    // Apply max discount cap if set
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
  } else if (coupon.discount_type === 'fixed' && coupon.discount_value !== null) {
    discountAmount = coupon.discount_value;
    
    const discountedPrice = Math.max(0, price - discountAmount);
    const totalPrice = Math.max(0, (price * quantity) - discountAmount);
    
    return {
      discountedPrice: parseFloat(discountedPrice.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountPercentage: price > 0 ? parseFloat(((discountAmount / price) * 100).toFixed(0)) : 0,
      totalPrice: parseFloat(totalPrice.toFixed(2))
    };
  } else if (coupon.discount_type === 'bogo') {
    // Use the BOGO-specific calculation
    return calculateBogoDiscount(price, quantity, coupon);
  }

  return {
    discountedPrice: price,
    discountAmount: 0,
    discountPercentage: 0,
    totalPrice: price * quantity
  };
};

// ============================================================================
// COUPON SELECTION HELPERS
// ============================================================================

/**
 * Helper to find the best coupon for a product
 * Priority: Highest dollar savings, with preference for BOGO if savings are similar
 * Now excludes ALL cart-level coupons from consideration
 */
export const findBestCoupon = (
  coupons: ProductCoupon[],
  price: number,
  quantity: number = 1
): ProductCoupon | null => {
  if (!coupons || coupons.length === 0) return null;

  // Filter out cart-level coupons - only consider item-level coupons
  const itemLevelCoupons = coupons.filter(isItemLevelCoupon);

  if (itemLevelCoupons.length === 0) return null;

  let bestCoupon: ProductCoupon | null = null;
  let maxSavings = 0;

  for (const coupon of itemLevelCoupons) {
    // Skip free shipping only coupons (no actual discount)
    if (coupon.discount_type === 'free_shipping_only') {
      // Only consider free shipping if no other coupons exist
      if (!bestCoupon) {
        bestCoupon = coupon;
      }
      continue;
    }

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
 * Helper to format BOGO badge text adaptively
 */
export const formatBogoBadge = (coupon: ProductCoupon): string => {
  const buyQty = coupon.bogo_buy_quantity || 1;
  const getQty = coupon.bogo_get_quantity || 1;
  const discount = coupon.bogo_discount_percentage || 100;

  if (discount === 100) {
    // Free items
    if (buyQty === 1 && getQty === 1) {
      return "BOGO Free";
    }
    return `Buy ${buyQty} Get ${getQty} Free`;
  } else {
    // Partial discount
    if (buyQty === 1 && getQty === 1) {
      return `BOGO ${discount}% Off`;
    }
    return `Buy ${buyQty} Get ${getQty} ${discount}% Off`;
  }
};