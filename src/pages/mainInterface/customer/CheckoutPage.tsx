import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  saveSession,
  loadSession,
  clearSession,
} from "../../../utils/checkoutSession";
import { useCart, type CartItem } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import {
  FaCreditCard,
  FaPlus,
  FaMinus,
  FaExclamationTriangle,
  FaTag,
  FaLock,
  FaUser,
  FaShoppingBag,
} from "react-icons/fa";
import {
  fetchUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type Address,
  type CreateAddressPayload,
} from "../../../api/user";
import {
  fetchProductCouponsPreview,
  fetchUserCouponUsage,
  type ProductCoupon,
  type GroupedCoupons,
} from "../../../api/couponCustomer";
import {
  validateCart,
  validateCartGuest,
  calculateShipping,
  calculateShippingGuest,
  createOrder,
  createGuestOrder,
  validateCoupons,
  validateAddress,
  validateAddressGuest,
  type GuestInfo,
  type GuestShippingAddress,
  type ShippingOption,
  type AddressValidationResult,
} from "../../../api/checkout";

import StepIndicator from "../../../components/customerInterface/checkout/StepIndicator";
import OrderSummary from "../../../components/customerInterface/checkout/OrderSummary";
import SuccessScreen from "../../../components/customerInterface/checkout/SuccessScreen";
import ShippingOptionsSelector from "../../../components/customerInterface/checkout/ShippingOptionsSelector";
import DeliveryEstimate from "../../../components/customerInterface/checkout/DeliveryEstimate";

import AddressCard from "../../../components/universalComponents/AddressCard";
import AddressForm from "../../../components/universalComponents/AddressForm";
import AddressValidationModal from "../../../components/universalComponents/AddressValidationModal";
import ConfirmModal from "../../../components/universalComponents/ConfirmModal";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";
import { getBOGOLabel } from "../../../utils/couponUtils";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/customer/CheckoutPage.css";

// ============================================================================
// CONSTANTS
// ============================================================================

type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "success";

interface OrderResult {
  order_id: number;
  order_number: string;
  total_price: number;
  status: string;
  created_at: string;
}

const EMPTY_GUEST_INFO: GuestInfo = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
};

const EMPTY_GUEST_ADDRESS: GuestShippingAddress = {
  address_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  country: "USA",
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { step: urlStep } = useParams<{ step?: string }>();
  const { user, isLoading } = useAuth();
  const {
    cartItems,
    clearCart,
    updateQuantity,
    removeFromCart,
    cartLevelCouponId,
    setCartLevelCouponId,
  } = useCart();
  const errorRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Rehydrate checkout session from sessionStorage on mount
  const session = loadSession();

  // Step management — derive initial step from URL param
  const stepFromUrl = (urlStep as CheckoutStep) || "cart";
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(stepFromUrl);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // Guest vs auth mode — rehydrated from session if returning mid-checkout
  const [checkoutMode, setCheckoutMode] = useState<"auth" | "guest" | null>(
    session.checkoutMode ?? null,
  );
  const [guestInfo, setGuestInfo] = useState<GuestInfo>(
    session.guestInfo ?? EMPTY_GUEST_INFO,
  );
  const [guestAddress, setGuestAddress] = useState<GuestShippingAddress>(
    session.guestAddress ?? EMPTY_GUEST_ADDRESS,
  );
  const [guestInfoErrors, setGuestInfoErrors] = useState<
    Record<string, string>
  >({});

  // Auth user address management
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    session.selectedAddressId ?? null,
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<CreateAddressPayload>({
    address_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    is_default: false,
  });

  // Coupon management — auth users only
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [couponValidation, setCouponValidation] = useState<any>(null);
  const [couponErrors, setCouponErrors] = useState<string[]>([]);
  const [selectedCartLevelCoupon, setSelectedCartLevelCoupon] =
    useState<ProductCoupon | null>(null);
  const [itemLevelDiscount, setItemLevelDiscount] = useState<number>(0);
  const [cartLevelDiscount, setCartLevelDiscount] = useState<number>(0);
  // Per-coupon usage counts — fetched once and passed to OrderSummary → CartLevelCouponSelector
  // so it doesn't fetch independently
  const [userCouponUsage, setUserCouponUsage] = useState<
    Record<number, number>
  >({});

  // Shipping management
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(
    session.shippingOptions ?? [],
  );
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(session.selectedShipping ?? null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(
    session.shippingCost ?? 0,
  );
  const [isFreeShipping, setIsFreeShipping] = useState<boolean>(false);

  // Order totals
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  // Universal confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  // Address validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);
  // Pending address data — for auth users awaiting save, or guest users awaiting apply
  const [pendingAddressData, setPendingAddressData] =
    useState<CreateAddressPayload | null>(null);
  const [pendingGuestAddressData, setPendingGuestAddressData] =
    useState<GuestShippingAddress | null>(null);
  const [guestAddressValidated, setGuestAddressValidated] = useState(
    session.guestAddressValidated ?? false,
  );
  // Draft quantity state — tracks in-progress typed values keyed by variant_id
  const [draftQuantities, setDraftQuantities] = useState<
    Record<number, string>
  >({});

  // Loading and error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isEmailVerified = user?.isEmailVerified ?? false;
  const isGuest = checkoutMode === "guest";

  const guestAddressComplete =
    !!guestAddress.address_line1 &&
    !!guestAddress.city &&
    !!guestAddress.state &&
    !!guestAddress.zip;

  // ============================================================================
  // LIFECYCLE EFFECTS
  // ============================================================================

  // Determines checkout mode (auth vs guest) once auth resolves
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
      if (user) {
        setCheckoutMode("auth");
      } else {
        // Restore guest session if they were mid-checkout
        const savedMode = session.checkoutMode;
        if (savedMode === "guest") {
          setCheckoutMode("guest");
        } else {
          // No valid session — show mode selection
          setCheckoutMode(null);
        }
      }
    }
  }, [isLoading, user]);

  // Redirects to cart page if cart becomes empty mid-checkout
  useEffect(() => {
    if (isInitialLoad) return;
    if (cartItems.length === 0 && currentStep !== "success") {
      navigate("/cart");
    }
  }, [cartItems, currentStep, navigate, isInitialLoad]);

  // Loads saved addresses when the authenticated user is known
  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  // Loads coupons once when the user/auth state is known
  // Cart contents don't affect which coupons exist; applicability is handled client-side
  useEffect(() => {
    if (cartItems.length > 0) loadCoupons();
  }, [user]);

  // Re-validates coupon rules whenever the cart or selected coupons change (auth users only)
  useEffect(() => {
    if (user && cartItems.length > 0 && coupons) {
      validateCouponRules();
    }
  }, [cartItems, user, coupons, selectedCartLevelCoupon]);

  // Recalculates shipping options for auth users when address, step, or coupon state changes
  useEffect(() => {
    if (
      !isGuest &&
      selectedAddressId &&
      addresses.length > 0 &&
      cartItems.length > 0 &&
      currentStep === "shipping" &&
      coupons !== null
    ) {
      handleCalculateShipping();
    }
  }, [
    selectedAddressId,
    addresses.length,
    currentStep,
    isGuest,
    isFreeShipping,
    coupons,
  ]);

  // Recalculates order totals whenever cart, coupons, shipping, or step changes
  useEffect(() => {
    calculateOrderTotals();
  }, [
    cartItems,
    couponValidation,
    shippingCost,
    isFreeShipping,
    isEmailVerified,
    currentStep,
  ]);

  // Restores guest shipping options on page refresh when address is already validated
  useEffect(() => {
    if (
      isGuest &&
      guestAddressComplete &&
      guestAddressValidated &&
      currentStep === "shipping" &&
      shippingOptions.length === 0 &&
      cartItems.length > 0
    ) {
      handleCalculateShippingGuest();
    }
  }, [guestAddressValidated, currentStep, isGuest, cartItems.length]);

  // Persists key checkout state to sessionStorage whenever it changes
  useEffect(() => {
    if (checkoutMode === null) return;
    saveSession({
      checkoutMode,
      guestInfo,
      guestAddress,
      guestAddressValidated,
      selectedAddressId,
    });
  }, [
    checkoutMode,
    guestInfo,
    guestAddress,
    guestAddressValidated,
    selectedAddressId,
  ]);

  // Syncs the current checkout step to the URL
  useEffect(() => {
    if (currentStep === "success") return;
    const target =
      currentStep === "cart" ? "/checkout" : `/checkout/${currentStep}`;
    if (window.location.pathname !== target) {
      navigate(target, { replace: false });
    }
  }, [currentStep]);

  // Clears session storage when the user navigates away from checkout
  useEffect(() => {
    return () => {
      clearSession();
    };
  }, []);

  // Scrolls the error banner into view when a new error is set
  useEffect(() => {
    const firstErrorEl = errorRef.current;
    if (firstErrorEl) {
      firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  // Scrolls to the top of the page on each step transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetches saved addresses for the auth user and pre-selects the default
  const loadAddresses = async () => {
    try {
      const data = await fetchUserAddresses();
      setAddresses(data);
      const defaultAddr = data.find((a) => a.is_default);
      if (defaultAddr) setSelectedAddressId(defaultAddr.address_id);
    } catch (err) {
      console.error("Error loading addresses:", err);
    }
  };

  // Fetches the coupon catalogue and user usage data in a single round trip
  const loadCoupons = async () => {
    try {
      const [data, usageData] = await Promise.all([
        fetchProductCouponsPreview(),
        user ? fetchUserCouponUsage() : Promise.resolve({}),
      ]);
      setCoupons(data);
      setUserCouponUsage(usageData);

      const couponIdToFind = cartLevelCouponId ?? session.cartLevelCouponId;
      if (couponIdToFind) {
        const found =
          data.all.find((c: ProductCoupon) => c.coupon_id === couponIdToFind) ??
          null;
        if (found) {
          setSelectedCartLevelCoupon(found);
          setCartLevelCouponId(found.coupon_id);
        }
      }
    } catch (err) {
      console.error("Error loading coupons:", err);
    }
  };

  // Validates current cart coupons server-side and updates discount and error state
  const validateCouponRules = async () => {
    if (!user) return;
    try {
      const payload = {
        cart_items: cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          selected_coupon_id: item.selected_coupon_id || null,
        })),
        cart_level_coupon_id: selectedCartLevelCoupon?.coupon_id || null,
      };

      const validation = await validateCoupons(payload);
      setCouponValidation(validation);

      const hasFreeShipping =
        validation.cart_level_discount?.free_shipping === true;
      setIsFreeShipping(hasFreeShipping);
      setItemLevelDiscount(validation.item_level_discount || 0);
      setCartLevelDiscount(
        validation.cart_level_discount?.discount_amount || 0,
      );

      const allErrors: string[] = [];
      if (validation.errors?.length > 0) {
        validation.errors.forEach((err: any) =>
          allErrors.push(`Item ${err.variant_id}: ${err.error}`),
        );
      }
      if (validation.cart_level_discount?.error) {
        allErrors.push(validation.cart_level_discount.error);
      }
      setCouponErrors(allErrors);
    } catch (err) {
      console.error("Error validating coupons:", err);
      setCouponErrors(["Failed to validate coupons"]);
    }
  };

  // Updates selectedCartLevelCoupon and keeps CartContext in sync when user selects or clears a cart-level coupon
  const handleCartLevelCouponSelect = (coupon: ProductCoupon | null) => {
    setSelectedCartLevelCoupon(coupon);
    setCartLevelCouponId(coupon ? coupon.coupon_id : null);
    saveSession({
      cartLevelCoupon: coupon,
      cartLevelCouponId: coupon?.coupon_id ?? null,
    });
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Looks up the selected coupon for a cart item from the loaded coupon catalogue
  const getCouponForItem = (item: CartItem): ProductCoupon | null => {
    if (!coupons || !item.selected_coupon_id) return null;
    const all = [
      ...coupons.all,
      ...coupons.category,
      ...coupons.product_type,
      ...coupons.product,
      ...coupons.variant,
      ...coupons.custom_group,
    ];
    return all.find((c) => c.coupon_id === item.selected_coupon_id) || null;
  };

  // Recalculates subtotal, discounts, tax, and total based on current cart and coupon state
  const calculateOrderTotals = () => {
    const originalSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    setSubtotal(originalSubtotal);

    // Discounts only apply for authenticated users
    let itemDiscountTotal = 0;
    if (!isGuest && couponValidation?.validated_discounts) {
      itemDiscountTotal = couponValidation.validated_discounts.reduce(
        (sum: number, item: any) => sum + item.discount_amount,
        0,
      );
    }
    const cartDiscount = !isGuest
      ? couponValidation?.cart_level_discount?.discount_amount || 0
      : 0;

    const totalDiscountAmount = itemDiscountTotal + cartDiscount;
    setDiscountAmount(totalDiscountAmount);

    const subtotalAfterDiscounts = originalSubtotal - totalDiscountAmount;

    if (currentStep === "cart") {
      setTaxAmount(0);
      setTotal(subtotalAfterDiscounts);
    } else {
      const finalShipping = isFreeShipping ? 0 : shippingCost;
      const taxRate = 0.08;
      const calculatedTax = subtotalAfterDiscounts * taxRate;
      setTaxAmount(calculatedTax);
      setTotal(subtotalAfterDiscounts + finalShipping + calculatedTax);
    }
  };

  // Validates guest contact info fields and populates field-level errors; returns true if valid
  const validateGuestInfo = (): boolean => {
    const errs: Record<string, string> = {};
    if (!guestInfo.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!guestInfo.first_name.trim()) {
      errs.first_name = "First name is required";
    }
    if (!guestInfo.last_name.trim()) {
      errs.last_name = "Last name is required";
    }
    if (guestInfo.phone?.trim()) {
      const phoneDigits = guestInfo.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        errs.phone = "Please enter a valid 10-digit phone number";
      }
    }
    setGuestInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ============================================================================
  // QUANTITY INPUT HANDLERS
  // ============================================================================

  // Stores the current quantity as a draft string when the input gains focus
  const handleQuantityFocus = (variantId: number, currentQty: number) => {
    setDraftQuantities((prev) => ({
      ...prev,
      [variantId]: String(currentQty),
    }));
  };

  // Updates the draft quantity for a cart item, restricting input to digits only
  const handleQuantityChange = (variantId: number, value: string) => {
    if (/^\d*$/.test(value)) {
      setDraftQuantities((prev) => ({ ...prev, [variantId]: value }));
    }
  };

  // Commits the draft quantity on blur, prompting removal confirmation if set to zero
  const handleQuantityCommit = (variantId: number) => {
    const draft = draftQuantities[variantId];
    setDraftQuantities((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });

    const parsed = parseInt(draft, 10);

    if (!draft || isNaN(parsed) || parsed < 0) return;

    if (parsed === 0) {
      setConfirmModal({
        isOpen: true,
        title: "Remove Item?",
        message: "This item will be removed from your cart. Are you sure?",
        confirmLabel: "Remove",
        variant: "danger",
        onConfirm: () => {
          removeFromCart(variantId);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
      return;
    }

    updateQuantity(variantId, parsed);
  };

  // Submits quantity on Enter or discards the draft on Escape
  const handleQuantityKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    variantId: number,
  ) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setDraftQuantities((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      e.currentTarget.blur();
    }
  };

  // ============================================================================
  // SHIPPING HANDLERS
  // ============================================================================

  // Fetches shipping options for the selected auth user address and persists the result
  const handleCalculateShipping = async () => {
    if (!selectedAddressId) return;
    setLoadingShipping(true);
    setShippingError(null);
    try {
      const result = await calculateShipping(
        cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        selectedAddressId,
      );
      setShippingOptions(result.shipping_options);

      if (selectedShipping) {
        const refreshed = result.shipping_options.find(
          (o) => o.service === selectedShipping.service,
        );
        if (refreshed) {
          setSelectedShipping(refreshed);
          setShippingCost(isFreeShipping ? 0 : parseFloat(refreshed.amount));
          saveSession({
            selectedShipping: refreshed,
            shippingCost: isFreeShipping ? 0 : parseFloat(refreshed.amount),
            shippingOptions: result.shipping_options,
          });
        } else {
          setSelectedShipping(null);
          setShippingCost(0);
          saveSession({
            selectedShipping: null,
            shippingCost: 0,
            shippingOptions: result.shipping_options,
          });
        }
      } else {
        setShippingCost(0);
        saveSession({ shippingOptions: result.shipping_options });
      }
    } catch (err: any) {
      setShippingError(err.message || "Failed to calculate shipping");
    } finally {
      setLoadingShipping(false);
    }
  };

  // Fetches shipping options for the guest's validated address using current guestInfo
  const handleCalculateShippingGuest = async () => {
    if (!guestAddressComplete) return;
    setLoadingShipping(true);
    setShippingError(null);
    try {
      const addressForShipping: GuestShippingAddress = {
        ...guestAddress,
        first_name: guestInfo.first_name,
        last_name: guestInfo.last_name,
      };
      const result = await calculateShippingGuest(
        cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        addressForShipping,
      );
      setShippingOptions(result.shipping_options);

      if (selectedShipping) {
        const refreshed = result.shipping_options.find(
          (o) => o.service_level_name === selectedShipping.service_level_name,
        );
        if (refreshed) {
          setSelectedShipping(refreshed);
          setShippingCost(isFreeShipping ? 0 : parseFloat(refreshed.amount));
          saveSession({
            selectedShipping: refreshed,
            shippingCost: isFreeShipping ? 0 : parseFloat(refreshed.amount),
            shippingOptions: result.shipping_options,
          });
        } else {
          setSelectedShipping(null);
          setShippingCost(0);
          saveSession({
            selectedShipping: null,
            shippingCost: 0,
            shippingOptions: result.shipping_options,
          });
        }
      } else {
        setShippingCost(0);
        saveSession({ shippingOptions: result.shipping_options });
      }
    } catch (err: any) {
      setShippingError(err.message || "Failed to calculate shipping");
    } finally {
      setLoadingShipping(false);
    }
  };

  // Fetches shipping options for a guest using an explicitly provided address object
  const handleCalculateShippingGuestWithAddress = async (
    address: GuestShippingAddress,
  ) => {
    setLoadingShipping(true);
    setShippingError(null);
    try {
      const addressForShipping: GuestShippingAddress = {
        ...address,
        first_name: guestInfo.first_name,
        last_name: guestInfo.last_name,
      };
      const result = await calculateShippingGuest(
        cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        addressForShipping,
      );
      setShippingOptions(result.shipping_options);

      if (selectedShipping) {
        const refreshed = result.shipping_options.find(
          (o) => o.service_level_name === selectedShipping.service_level_name,
        );
        if (refreshed) {
          setSelectedShipping(refreshed);
          setShippingCost(isFreeShipping ? 0 : parseFloat(refreshed.amount));
          saveSession({
            selectedShipping: refreshed,
            shippingCost: isFreeShipping ? 0 : parseFloat(refreshed.amount),
            shippingOptions: result.shipping_options,
          });
        } else {
          setSelectedShipping(null);
          setShippingCost(0);
          saveSession({
            selectedShipping: null,
            shippingCost: 0,
            shippingOptions: result.shipping_options,
          });
        }
      } else {
        setShippingCost(0);
        saveSession({ shippingOptions: result.shipping_options });
      }
    } catch (err: any) {
      setShippingError(err.message || "Failed to calculate shipping");
    } finally {
      setLoadingShipping(false);
    }
  };

  // Selects a shipping option, updates the cost, and persists the choice to session
  const handleShippingOptionSelect = (option: ShippingOption) => {
    const cost = isFreeShipping ? 0 : parseFloat(option.amount);
    setSelectedShipping(option);
    setShippingCost(cost);
    saveSession({
      selectedShipping: option,
      shippingCost: cost,
      shippingOptions,
    });
  };

  // ============================================================================
  // CHECKOUT FLOW HANDLERS
  // ============================================================================

  // Validates the cart and coupon state before advancing to the shipping step
  const handleContinueToShipping = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    try {
      const validation = isGuest
        ? await validateCartGuest(cartItems)
        : await validateCart(cartItems);

      if (!validation.valid) {
        setValidationErrors(validation.items.filter((item) => !item.valid));
        setError(
          "Some items in your cart are no longer available or have insufficient stock.",
        );
        return;
      }
      if (validation.has_price_changes) {
        setValidationErrors(
          validation.items.filter((item) => item.price_changed),
        );
        setError(
          "Some prices have changed since you added items to your cart.",
        );
        return;
      }
      if (!isGuest && couponErrors.length > 0) {
        setError("Please fix coupon issues before proceeding to checkout");
        return;
      }
      setCurrentStep("shipping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate cart");
    } finally {
      setLoading(false);
    }
  };

  // Validates shipping info before advancing to the payment step
  const handleContinueToPayment = () => {
    if (isGuest) {
      if (!validateGuestInfo()) {
        setError("Please fill in all required contact information");
        return;
      }
      if (!guestAddressComplete) {
        setError("Please enter a complete shipping address");
        return;
      }
    } else {
      if (!selectedAddressId) {
        setError("Please select a shipping address");
        return;
      }
    }
    if (!selectedShipping && !isFreeShipping) {
      setError("Please select a shipping method");
      return;
    }
    setError(null);
    setCurrentStep("payment");
  };

  // Advances to the review step
  const handleContinueToReview = () => {
    setCurrentStep("review");
  };

  // Submits the order for authenticated users after final coupon validation
  const handlePlaceOrder = async () => {
    if (!selectedAddressId || (!selectedShipping && !isFreeShipping)) {
      setError("Please complete all required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await validateCouponRules();
      if (couponErrors.length > 0) {
        setError("Please resolve coupon errors before placing order");
        return;
      }

      const appliedCoupons = cartItems
        .filter((item) => item.selected_coupon_id)
        .map((item) => ({
          variant_id: item.variant_id,
          coupon_id: item.selected_coupon_id!,
        }));

      const result = await createOrder({
        shipping_address_id: selectedAddressId,
        cart_items: cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          selected_coupon_id: item.selected_coupon_id || null,
        })),
        subtotal,
        item_level_discount: itemLevelDiscount,
        cart_level_discount: cartLevelDiscount,
        discount_amount: discountAmount,
        shipping_cost: isFreeShipping ? 0 : shippingCost,
        tax_amount: taxAmount,
        total_price: total,
        applied_coupons: appliedCoupons.length > 0 ? appliedCoupons : undefined,
        cart_level_coupon_id: selectedCartLevelCoupon?.coupon_id || null,
        selected_shipping_rate_id: selectedShipping?.rate_id ?? undefined,
        shipping_carrier:
          selectedShipping?.carrier ?? (isFreeShipping ? "USPS" : undefined),
        shipping_service:
          selectedShipping?.service ??
          (isFreeShipping ? "usps_ground_advantage" : undefined),
      });

      clearCart();
      clearSession();
      setOrderResult(result.order);
      setCurrentStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Submits the order for guest users after validating contact and address info
  const handlePlaceGuestOrder = async () => {
    if (!validateGuestInfo() || !guestAddressComplete || !selectedShipping) {
      setError("Please complete all required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createGuestOrder({
        guest_info: guestInfo,
        shipping_address: guestAddress,
        cart_items: cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total_price: total,
        selected_shipping_rate_id: selectedShipping.rate_id,
        shipping_carrier: selectedShipping.carrier,
        shipping_service: selectedShipping.service,
      });

      clearCart();
      clearSession();
      setOrderResult(result.order);
      setCurrentStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Submits the address form, triggering validation before saving
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (
        !addressForm.country ||
        addressForm.country === "US" ||
        addressForm.country === "USA"
      ) {
        const validation = await validateAddress(addressForm);
        setPendingAddressData(addressForm);
        setValidationResult(validation);
        setShowAddressModal(false);
        setShowValidationModal(true);
        setLoading(false);
      } else {
        await saveAddress(addressForm);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to validate address",
      );
      setLoading(false);
    }
  };

  // Saves a new or edited address, then refreshes the address list
  const saveAddress = async (addressData: CreateAddressPayload) => {
    const wasEditingSelected = editingAddressId === selectedAddressId;
    setLoading(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, addressData);
      } else {
        await createAddress(addressData);
      }
      await loadAddresses();
      setShowAddressModal(false);
      setEditingAddressId(null);
      resetAddressForm();
      setShowValidationModal(false);
      setPendingAddressData(null);
      setValidationResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  // Saves the address as entered, bypassing the corrected suggestion
  const handleAcceptOriginalAddress = () => {
    if (pendingAddressData) saveAddress(pendingAddressData);
  };

  // Saves the USPS-corrected address in place of what the user entered
  const handleAcceptCorrectedAddress = () => {
    if (validationResult?.validated_address && pendingAddressData) {
      saveAddress({
        ...pendingAddressData,
        address_line1: validationResult.validated_address.street1,
        address_line2: validationResult.validated_address.street2 || "",
        city: validationResult.validated_address.city,
        state: validationResult.validated_address.state,
        zip: validationResult.validated_address.zip,
        country: "USA",
      });
    }
  };

  // Dismisses the validation modal and returns the user to the address form
  const handleCancelValidation = () => {
    setShowValidationModal(false);
    if (pendingAddressData) {
      setShowAddressModal(true);
    }
    setPendingAddressData(null);
    setPendingGuestAddressData(null);
    setValidationResult(null);
  };

  // Populates the address form with an existing address and opens the edit modal
  const handleEditAddress = (address: Address) => {
    setAddressForm({
      address_name: address.address_name,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      is_default: address.is_default,
    });
    setEditingAddressId(address.address_id);
    setShowAddressModal(true);
  };

  // Prompts for confirmation before permanently deleting an address
  const handleDeleteAddress = (addressId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Address?",
      message: "This address will be permanently removed. Are you sure?",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteAddress(addressId);
          await loadAddresses();
          if (selectedAddressId === addressId) setSelectedAddressId(null);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to delete address",
          );
        }
      },
    });
  };

  // Resets the address form to its empty default state
  const resetAddressForm = () => {
    setAddressForm({
      address_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
      is_default: false,
    });
  };

  // Updates a single field in the address form
  const handleAddressFormChange = (
    field: keyof CreateAddressPayload,
    value: string | boolean,
  ) => {
    setAddressForm({ ...addressForm, [field]: value });
  };

  // Resets guest address validation and shipping when the user edits a field
  const handleGuestAddressFieldChange = (
    field: keyof GuestShippingAddress,
    value: string,
  ) => {
    setGuestAddress((prev) => ({ ...prev, [field]: value }));
    if (guestAddressValidated) {
      setGuestAddressValidated(false);
      setShippingOptions([]);
      setSelectedShipping(null);
      setShippingCost(0);
    }
  };

  // Validates the guest address with USPS before showing shipping options
  const handleGuestAddressValidate = async () => {
    setLoading(true);
    setError(null);
    try {
      const validation = await validateAddressGuest({
        address_line1: guestAddress.address_line1,
        address_line2: guestAddress.address_line2,
        city: guestAddress.city,
        state: guestAddress.state,
        zip: guestAddress.zip,
        country: guestAddress.country,
      });
      setPendingGuestAddressData(guestAddress);
      setValidationResult(validation);
      setShowValidationModal(true);
    } catch (err) {
      setGuestAddressValidated(false);
      setError(
        err instanceof Error ? err.message : "Failed to validate address",
      );
    } finally {
      setLoading(false);
    }
  };

  // Applies the USPS-corrected guest address and immediately fetches shipping rates
  const handleAcceptCorrectedGuestAddress = () => {
    let finalAddress = pendingGuestAddressData
      ? { ...pendingGuestAddressData }
      : { ...guestAddress };
    if (validationResult?.validated_address && pendingGuestAddressData) {
      finalAddress = {
        ...pendingGuestAddressData,
        address_line1: validationResult.validated_address.street1,
        address_line2: validationResult.validated_address.street2 || "",
        city: validationResult.validated_address.city,
        state: validationResult.validated_address.state,
        zip: validationResult.validated_address.zip,
        country: "USA",
      };
      setGuestAddress(finalAddress);
    }
    setGuestAddressValidated(true);
    setShowValidationModal(false);
    setPendingGuestAddressData(null);
    setValidationResult(null);
    handleCalculateShippingGuestWithAddress(finalAddress);
  };

  // Accepts the guest address as entered and immediately fetches shipping rates
  const handleAcceptOriginalGuestAddress = () => {
    setGuestAddressValidated(true);
    setShowValidationModal(false);
    setPendingGuestAddressData(null);
    setValidationResult(null);
    handleCalculateShippingGuest();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isInitialLoad) {
    return (
      <div className="checkout-page checkout-loading-state">
        <LoadingSpinner message="Loading checkout..." />
      </div>
    );
  }

  if (!isInitialLoad && !user && checkoutMode === null) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h1 className="checkout-title">Checkout</h1>
          <div className="checkout-mode-selection">
            <p className="checkout-mode-selection-description">
              How would you like to check out?
            </p>
            <div className="checkout-mode-selection-cards">
              <button
                className="checkout-mode-card checkout-mode-card-login"
                onClick={() => navigate("/login?redirect=/checkout")}
              >
                <FaUser size={32} />
                <h3>Sign In</h3>
                <p>
                  Use your account for faster checkout, order history, and
                  exclusive discounts.
                </p>
              </button>

              <button
                className="checkout-mode-card checkout-mode-card-guest"
                onClick={() => {
                  setCheckoutMode("guest");
                  saveSession({ checkoutMode: "guest" });
                }}
              >
                <FaShoppingBag size={32} />
                <h3>Guest Checkout</h3>
                <p>
                  No account needed. Just your email for your order
                  confirmation.
                </p>
              </button>
            </div>
            <p className="checkout-mode-selection-note">
              Don&apos;t have an account?{" "}
              <button
                className="checkout-btn-link"
                onClick={() => navigate("/register?redirect=/checkout")}
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "success") {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <SuccessScreen
            orderResult={orderResult}
            userEmail={isGuest ? guestInfo.email : user?.email}
            isGuest={isGuest}
            shippingMethodName={
              selectedShipping?.service_level_name ??
              (isFreeShipping ? "usps ground advantage" : undefined)
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">
          Checkout
          {isGuest && <span className="checkout-guest-mode-badge">Guest</span>}
        </h1>
        <StepIndicator currentStep={currentStep} />

        {/* Address validation modal — shown after address form submission */}
        {showValidationModal && validationResult && (
          <AddressValidationModal
            validationResult={validationResult}
            onAcceptOriginal={
              isGuest
                ? handleAcceptOriginalGuestAddress
                : handleAcceptOriginalAddress
            }
            onAcceptCorrected={
              isGuest
                ? handleAcceptCorrectedGuestAddress
                : handleAcceptCorrectedAddress
            }
            onCancel={handleCancelValidation}
          />
        )}

        {/* Address form modal — add or edit a saved address */}
        {showAddressModal && (
          <div
            className="checkout-modal-overlay"
            onClick={() => {
              setShowAddressModal(false);
              setEditingAddressId(null);
              resetAddressForm();
            }}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <AddressForm
                addressForm={addressForm}
                onFormChange={handleAddressFormChange}
                onSubmit={handleAddressSubmit}
                onCancel={() => {
                  setShowAddressModal(false);
                  setEditingAddressId(null);
                  resetAddressForm();
                }}
                isEditing={!!editingAddressId}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Universal confirm modal — used for item removal and address deletion */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() =>
            setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          }
        />

        {/* Error banner — shown when a step validation or API error occurs */}
        {error && (
          <div className="checkout-error" ref={errorRef}>
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* Coupon error list — shown for auth users with invalid coupon selections */}
        {!isGuest && couponErrors.length > 0 && (
          <div className="checkout-coupon-errors-section">
            <h3>
              <FaExclamationTriangle /> Coupon Issues
            </h3>
            <ul>
              {couponErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="checkout-coupon-errors-help">
              Please remove or update the coupons in your cart to continue.
            </p>
          </div>
        )}

        {/* Validation error list — shown when cart items fail stock or price checks */}
        {validationErrors.length > 0 && (
          <div className="checkout-validation-errors">
            <h4>Please review the following issues:</h4>
            {validationErrors.map((err, i) => (
              <div key={i} className="checkout-validation-error-item">
                <FaExclamationTriangle />
                <span>{err.error}</span>
              </div>
            ))}
          </div>
        )}

        <div className="checkout-content">
          <div className="checkout-main">
            {/* Cart step — item review and coupon application */}
            {currentStep === "cart" && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">Review Your Cart</h2>
                <p className="checkout-section-description">
                  Review your items before proceeding to checkout
                </p>

                <div className="checkout-cart-items-list">
                  {cartItems.map((item) => {
                    const validatedDiscount =
                      !isGuest &&
                      couponValidation?.validated_discounts?.find(
                        (d: any) => d.variant_id === item.variant_id,
                      );
                    const itemTotal = item.price * item.quantity;
                    const hasDiscount =
                      validatedDiscount &&
                      validatedDiscount.discount_amount > 0;
                    const itemCoupon = getCouponForItem(item);

                    return (
                      <div key={item.variant_id} className="checkout-cart-item">
                        <img src={item.image} alt={item.name} />
                        <div className="checkout-item-info">
                          <h4>{item.name}</h4>
                          <p className="checkout-item-variant">
                            {item.color} {item.color && item.size && "•"}{" "}
                            {item.size}
                          </p>
                          <div className="checkout-quantity-control">
                            <button
                              className="checkout-quantity-btn"
                              onClick={() => {
                                if (item.quantity === 1) {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Remove Item?",
                                    message:
                                      "This item will be removed from your cart. Are you sure?",
                                    confirmLabel: "Remove",
                                    variant: "danger",
                                    onConfirm: () => {
                                      removeFromCart(item.variant_id);
                                      setConfirmModal((prev) => ({
                                        ...prev,
                                        isOpen: false,
                                      }));
                                    },
                                  });
                                } else {
                                  updateQuantity(
                                    item.variant_id,
                                    item.quantity - 1,
                                  );
                                }
                              }}
                            >
                              <FaMinus size={10} />
                            </button>
                            <input
                              className="checkout-quantity-value"
                              type="text"
                              inputMode="numeric"
                              value={
                                draftQuantities[item.variant_id] !== undefined
                                  ? draftQuantities[item.variant_id]
                                  : item.quantity
                              }
                              onFocus={() =>
                                handleQuantityFocus(
                                  item.variant_id,
                                  item.quantity,
                                )
                              }
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.variant_id,
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                handleQuantityCommit(item.variant_id)
                              }
                              onKeyDown={(e) =>
                                handleQuantityKeyDown(e, item.variant_id)
                              }
                            />
                            <button
                              className="checkout-quantity-btn"
                              onClick={() =>
                                updateQuantity(
                                  item.variant_id,
                                  item.quantity + 1,
                                )
                              }
                            >
                              <FaPlus size={10} />
                            </button>
                          </div>
                          {itemCoupon && !isGuest && (
                            <div className="checkout-item-coupon-display">
                              <div className="checkout-item-coupon-code-badge">
                                <FaTag size={10} />
                                <span>{itemCoupon.coupon_code}</span>
                              </div>
                              {itemCoupon.discount_type !== "bogo" && (
                                <div className="checkout-item-coupon-savings">
                                  {itemCoupon.discount_type ===
                                    "percentage" && (
                                    <span className="checkout-savings-badge">
                                      {itemCoupon.discount_value}% OFF
                                    </span>
                                  )}
                                  {itemCoupon.discount_type === "fixed" && (
                                    <span className="checkout-savings-badge">
                                      ${itemCoupon.discount_value} OFF
                                    </span>
                                  )}
                                  {itemCoupon.free_shipping && (
                                    <span className="checkout-savings-badge shipping">
                                      Free Shipping
                                    </span>
                                  )}
                                </div>
                              )}
                              {itemCoupon.discount_type === "bogo" && (
                                <div className="checkout-item-coupon-savings">
                                  <span className="checkout-savings-badge bogo">
                                    {getBOGOLabel(
                                      itemCoupon.bogo_buy_quantity,
                                      itemCoupon.bogo_get_quantity,
                                      itemCoupon.bogo_discount_percentage,
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="checkout-item-price-section">
                          <div className="checkout-item-price">
                            {hasDiscount ? (
                              <>
                                <span className="checkout-price-original">
                                  ${itemTotal.toFixed(2)}
                                </span>
                                <span className="checkout-price-final">
                                  ${validatedDiscount.final_price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="checkout-price-final">
                                ${itemTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <div className="checkout-item-savings">
                              <span className="checkout-savings-label">
                                You Save:
                              </span>
                              <span className="checkout-savings-amount">
                                ${validatedDiscount.discount_amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Email verification prompt — auth users without a verified email */}
                {!isGuest && !isEmailVerified && (
                  <div className="checkout-warning">
                    <FaLock />
                    <span>
                      Please verify your email to access discounts and special
                      offers.
                    </span>
                  </div>
                )}

                <div className="checkout-actions">
                  <button
                    className="checkout-btn-back"
                    onClick={() => navigate("/cart")}
                  >
                    Back to Cart
                  </button>
                  <button
                    className="checkout-btn-continue"
                    onClick={handleContinueToShipping}
                    disabled={loading || (!isGuest && couponErrors.length > 0)}
                  >
                    {loading ? "Validating..." : "Continue to Shipping"}
                  </button>
                </div>
              </div>
            )}

            {/* Shipping step — address selection and shipping method */}
            {currentStep === "shipping" && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">Shipping</h2>

                {/* Guest checkout — contact info and inline address form */}
                {isGuest && (
                  <>
                    <div className="checkout-guest-contact-section">
                      <h3 className="checkout-subsection-title">
                        Contact Information
                      </h3>
                      <p className="checkout-section-description">
                        Your order confirmation will be sent to this email.
                      </p>

                      <div className="checkout-guest-form-grid">
                        <div className="checkout-form-group">
                          <label htmlFor="guest-email">Email Address *</label>
                          <input
                            id="guest-email"
                            type="email"
                            value={guestInfo.email}
                            onChange={(e) =>
                              setGuestInfo({
                                ...guestInfo,
                                email: e.target.value,
                              })
                            }
                            placeholder="you@example.com"
                            className={
                              guestInfoErrors.email ? "input-error" : ""
                            }
                          />
                          {guestInfoErrors.email && (
                            <span className="checkout-field-error">
                              {guestInfoErrors.email}
                            </span>
                          )}
                        </div>

                        <div className="checkout-form-group">
                          <label htmlFor="guest-first-name">First Name *</label>
                          <input
                            id="guest-first-name"
                            type="text"
                            value={guestInfo.first_name}
                            onChange={(e) =>
                              setGuestInfo({
                                ...guestInfo,
                                first_name: e.target.value,
                              })
                            }
                            placeholder="Jane"
                            className={
                              guestInfoErrors.first_name ? "input-error" : ""
                            }
                          />
                          {guestInfoErrors.first_name && (
                            <span className="checkout-field-error">
                              {guestInfoErrors.first_name}
                            </span>
                          )}
                        </div>

                        <div className="checkout-form-group">
                          <label htmlFor="guest-last-name">Last Name *</label>
                          <input
                            id="guest-last-name"
                            type="text"
                            value={guestInfo.last_name || ""}
                            onChange={(e) =>
                              setGuestInfo({
                                ...guestInfo,
                                last_name: e.target.value,
                              })
                            }
                            placeholder="Doe"
                            className={
                              guestInfoErrors.last_name ? "input-error" : ""
                            }
                          />
                          {guestInfoErrors.last_name && (
                            <span className="checkout-field-error">
                              {guestInfoErrors.last_name}
                            </span>
                          )}
                        </div>

                        <div className="checkout-form-group">
                          <label htmlFor="guest-phone">Phone (optional)</label>
                          <input
                            id="guest-phone"
                            type="tel"
                            value={guestInfo.phone || ""}
                            onChange={(e) =>
                              setGuestInfo({
                                ...guestInfo,
                                phone: e.target.value,
                              })
                            }
                            placeholder="555 555"
                            className={
                              guestInfoErrors.phone ? "input-error" : ""
                            }
                          />
                          {guestInfoErrors.phone && (
                            <span className="checkout-field-error">
                              {guestInfoErrors.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Guest shipping address fields */}
                    <div className="checkout-guest-address-section">
                      <h3 className="checkout-subsection-title">
                        Shipping Address
                      </h3>

                      <div className="checkout-guest-form-grid">
                        <div className="checkout-form-group checkout-form-group-full">
                          <label htmlFor="g-line1">Address Line 1 *</label>
                          <input
                            id="g-line1"
                            type="text"
                            value={guestAddress.address_line1}
                            onChange={(e) =>
                              handleGuestAddressFieldChange(
                                "address_line1",
                                e.target.value,
                              )
                            }
                            placeholder="123 Main St"
                          />
                        </div>

                        <div className="checkout-form-group checkout-form-group-full">
                          <label htmlFor="g-line2">Address Line 2</label>
                          <input
                            id="g-line2"
                            type="text"
                            value={guestAddress.address_line2 || ""}
                            onChange={(e) =>
                              handleGuestAddressFieldChange(
                                "address_line2",
                                e.target.value,
                              )
                            }
                            placeholder="Apt, Suite, etc."
                          />
                        </div>

                        <div className="checkout-form-group">
                          <label htmlFor="g-city">City *</label>
                          <input
                            id="g-city"
                            type="text"
                            value={guestAddress.city}
                            onChange={(e) =>
                              handleGuestAddressFieldChange(
                                "city",
                                e.target.value,
                              )
                            }
                            placeholder="New York"
                          />
                        </div>

                        <div className="checkout-form-group">
                          <label htmlFor="g-state">State *</label>
                          <input
                            id="g-state"
                            type="text"
                            value={guestAddress.state}
                            onChange={(e) =>
                              handleGuestAddressFieldChange(
                                "state",
                                e.target.value,
                              )
                            }
                            placeholder="NY"
                            maxLength={2}
                          />
                        </div>

                        <div className="checkout-form-group">
                          <label htmlFor="g-zip">ZIP Code *</label>
                          <input
                            id="g-zip"
                            type="text"
                            value={guestAddress.zip}
                            onChange={(e) =>
                              handleGuestAddressFieldChange(
                                "zip",
                                e.target.value,
                              )
                            }
                            placeholder="10001"
                          />
                        </div>

                        <div className="checkout-form-group">
                          <label htmlFor="g-country">Country</label>
                          <input
                            id="g-country"
                            type="text"
                            value={guestAddress.country || "USA"}
                            onChange={(e) =>
                              handleGuestAddressFieldChange(
                                "country",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      {guestAddressComplete && (
                        <button
                          type="button"
                          className="checkout-btn-validate-address"
                          onClick={handleGuestAddressValidate}
                          disabled={loading}
                        >
                          {loading ? "Verifying..." : "Verify Address"}
                        </button>
                      )}
                      <p className="checkout-address-verify-hint">
                        Verify your address to get shipping options.
                      </p>
                    </div>
                  </>
                )}

                {/* Auth checkout — saved address list and add new address button */}
                {!isGuest && (
                  <>
                    <p className="checkout-section-description">
                      Select or add a shipping address
                    </p>

                    {user?.email && (
                      <div className="checkout-user-email-display">
                        <strong>Order confirmation will be sent to:</strong>{" "}
                        {user.email}
                      </div>
                    )}

                    <div className="checkout-address-list">
                      {addresses.map((address) => (
                        <AddressCard
                          key={address.address_id}
                          address={address}
                          isSelected={selectedAddressId === address.address_id}
                          onSelect={() =>
                            setSelectedAddressId(address.address_id)
                          }
                          onEdit={() => handleEditAddress(address)}
                          onDelete={() =>
                            handleDeleteAddress(address.address_id)
                          }
                        />
                      ))}
                    </div>

                    <button
                      className="checkout-btn-add-address"
                      onClick={() => {
                        resetAddressForm();
                        setEditingAddressId(null);
                        setShowAddressModal(true);
                      }}
                    >
                      <FaPlus /> Add New Address
                    </button>
                  </>
                )}

                {/* Shipping options — shown once an address is selected or validated */}
                {((isGuest && guestAddressValidated) ||
                  (!isGuest && selectedAddressId)) && (
                  <ShippingOptionsSelector
                    shippingOptions={shippingOptions}
                    selectedShipping={selectedShipping}
                    onShippingOptionSelect={handleShippingOptionSelect}
                    onRetryCalculation={
                      isGuest
                        ? handleCalculateShippingGuest
                        : handleCalculateShipping
                    }
                    loadingShipping={loadingShipping}
                    shippingError={shippingError}
                    isFreeShippingCoupon={!isGuest && isFreeShipping}
                  />
                )}

                {selectedShipping && !loadingShipping && !isFreeShipping && (
                  <DeliveryEstimate
                    shippingMethodName={selectedShipping.service}
                    className="checkout-review-delivery-estimate"
                  />
                )}

                <div className="checkout-actions">
                  <button
                    className="checkout-btn-back"
                    onClick={() => setCurrentStep("cart")}
                  >
                    Back to Cart
                  </button>
                  <button
                    className="checkout-btn-continue"
                    onClick={handleContinueToPayment}
                    disabled={
                      loadingShipping ||
                      (!isGuest &&
                        (!selectedAddressId ||
                          (!selectedShipping && !isFreeShipping))) ||
                      (isGuest && (!guestAddressComplete || !selectedShipping))
                    }
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Payment step — payment method entry */}
            {currentStep === "payment" && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">Payment Information</h2>
                <div className="checkout-payment-placeholder">
                  <FaCreditCard size={48} />
                  <p>Payment integration coming soon</p>
                  <p className="checkout-placeholder-text">
                    In production, this would integrate with Stripe, PayPal, or
                    another payment processor
                  </p>
                </div>

                <div className="checkout-actions">
                  <button
                    className="checkout-btn-back"
                    onClick={() => setCurrentStep("shipping")}
                  >
                    Back to Shipping
                  </button>
                  <button
                    className="checkout-btn-continue"
                    onClick={handleContinueToReview}
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Review step — final order confirmation before placing */}
            {currentStep === "review" && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">Review Your Order</h2>

                {/* Shipping address summary */}
                <div className="checkout-review-section">
                  <h3>Shipping Address</h3>
                  <div className="checkout-review-address">
                    {isGuest ? (
                      <>
                        <p>
                          <strong>
                            {guestInfo.first_name} {guestInfo.last_name}
                          </strong>
                        </p>
                        <p>{guestAddress.address_line1}</p>
                        {guestAddress.address_line2 && (
                          <p>{guestAddress.address_line2}</p>
                        )}
                        <p>
                          {guestAddress.city}, {guestAddress.state}{" "}
                          {guestAddress.zip}
                        </p>
                        <p>Email: {guestInfo.email}</p>
                      </>
                    ) : (
                      (() => {
                        const addr = addresses.find(
                          (a) => a.address_id === selectedAddressId,
                        );
                        if (!addr) return null;
                        return (
                          <>
                            <p>
                              <strong>{addr.address_name}</strong>
                            </p>
                            <p>{addr.address_line1}</p>
                            {addr.address_line2 && <p>{addr.address_line2}</p>}
                            <p>
                              {addr.city}, {addr.state} {addr.zip}
                            </p>
                            {user?.email && <p>Email: {user.email}</p>}
                          </>
                        );
                      })()
                    )}
                  </div>

                  {selectedShipping && !loadingShipping && (
                    <DeliveryEstimate
                      shippingMethodName={selectedShipping.service}
                      className="checkout-review-delivery-estimate"
                    />
                  )}
                </div>

                {/* Order items */}
                <div className="checkout-review-section">
                  <h3>Order Items</h3>
                  <div className="checkout-review-items">
                    {cartItems.map((item) => {
                      const validatedDiscount =
                        !isGuest &&
                        couponValidation?.validated_discounts?.find(
                          (d: any) => d.variant_id === item.variant_id,
                        );
                      const itemCoupon = getCouponForItem(item);

                      return (
                        <div
                          key={item.variant_id}
                          className="checkout-review-item"
                        >
                          <img src={item.image} alt={item.name} />
                          <div className="checkout-review-item-details">
                            <h4>{item.name}</h4>
                            <p>
                              {item.color} {item.color && item.size && "•"}{" "}
                              {item.size}
                            </p>
                            <p>Qty: {item.quantity}</p>
                            {itemCoupon && !isGuest && (
                              <div className="checkout-review-item-coupon-display">
                                <div className="checkout-review-coupon-code-badge">
                                  <FaTag size={10} />
                                  <span>{itemCoupon.coupon_code}</span>
                                </div>
                                {itemCoupon.discount_type !== "bogo" && (
                                  <div className="checkout-review-coupon-savings">
                                    {itemCoupon.discount_type ===
                                      "percentage" && (
                                      <span className="checkout-savings-badge">
                                        {itemCoupon.discount_value}% OFF
                                      </span>
                                    )}
                                    {itemCoupon.discount_type === "fixed" && (
                                      <span className="checkout-savings-badge">
                                        ${itemCoupon.discount_value} OFF
                                      </span>
                                    )}
                                    {itemCoupon.free_shipping && (
                                      <span className="checkout-savings-badge shipping">
                                        Free Shipping
                                      </span>
                                    )}
                                  </div>
                                )}
                                {itemCoupon.discount_type === "bogo" && (
                                  <div className="checkout-review-coupon-savings">
                                    <span className="checkout-savings-badge bogo">
                                      {getBOGOLabel(
                                        itemCoupon.bogo_buy_quantity,
                                        itemCoupon.bogo_get_quantity,
                                        itemCoupon.bogo_discount_percentage,
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="checkout-review-item-price">
                            {!isGuest &&
                            validatedDiscount &&
                            validatedDiscount.discount_amount > 0 ? (
                              <>
                                <span className="checkout-price-original">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                                <span className="checkout-price-final">
                                  ${validatedDiscount.final_price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="checkout-price-final">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="checkout-actions">
                  <button
                    className="checkout-btn-back"
                    onClick={() => setCurrentStep("payment")}
                  >
                    Back to Payment
                  </button>
                  <button
                    className="checkout-btn-place-order"
                    onClick={isGuest ? handlePlaceGuestOrder : handlePlaceOrder}
                    disabled={loading || (!isGuest && couponErrors.length > 0)}
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar — visible on all steps */}
          <div className="checkout-sidebar">
            <OrderSummary
              cartItems={cartItems}
              currentStep={currentStep}
              coupons={coupons}
              selectedCartLevelCoupon={selectedCartLevelCoupon}
              onCartLevelCouponSelect={handleCartLevelCouponSelect}
              subtotal={subtotal}
              itemLevelDiscount={!isGuest ? itemLevelDiscount : 0}
              cartLevelDiscount={!isGuest ? cartLevelDiscount : 0}
              discountAmount={!isGuest ? discountAmount : 0}
              shippingCost={shippingCost}
              isFreeShipping={!isGuest && isFreeShipping}
              taxAmount={taxAmount}
              total={total}
              isEmailVerified={!isGuest && isEmailVerified}
              getCouponForItem={getCouponForItem}
              couponValidation={!isGuest ? couponValidation : null}
              userCouponUsage={userCouponUsage}
              isGuest={isGuest}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
