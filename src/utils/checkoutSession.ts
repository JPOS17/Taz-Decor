import type { ShippingOption, GuestInfo, GuestShippingAddress } from "../api/checkout";
import type { ProductCoupon } from "../api/couponCustomer";

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

// Merges the provided data into the existing session, preserving all other fields
export const saveSession = (data: Partial<CheckoutSession>): void => {
  try {
    const existing = loadSession();
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...existing, ...data }),
    );
  } catch {
    // Silently fail — sessionStorage may be unavailable (e.g. private browsing restrictions)
  }
};

// Returns the current session object, or an empty object if none exists or parsing fails
export const loadSession = (): Partial<CheckoutSession> => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// Removes the entire checkout session from sessionStorage (called on order completion or logout)
export const clearSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Silently fail
  }
};
