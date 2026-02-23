import type { ShippingOption, GuestInfo, GuestShippingAddress } from "../api/checkout";
import type { ProductCoupon } from "../api/couponCustomer";

// ============================================================================
// CHECKOUT SESSION — persists checkout state to sessionStorage across refreshes
// ============================================================================

const SESSION_KEY = "checkout_session";

export interface CheckoutSession {
  checkoutMode: "auth" | "guest";
  guestInfo: GuestInfo;
  guestAddress: GuestShippingAddress;
  guestAddressValidated: boolean;
  selectedAddressId: number | null;
  shippingCost: number;
  selectedShipping: ShippingOption | null;
  shippingOptions: ShippingOption[];
  cartLevelCouponId: number | null;
  cartLevelCoupon: ProductCoupon | null;
}

export const saveSession = (data: Partial<CheckoutSession>): void => {
  try {
    const existing = loadSession();
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...existing, ...data }),
    );
  } catch {
  }
};

export const loadSession = (): Partial<CheckoutSession> => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const clearSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
  }
};