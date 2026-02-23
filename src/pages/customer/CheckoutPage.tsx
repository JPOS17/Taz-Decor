import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  saveSession,
  loadSession,
  clearSession,
} from "../../utils/checkoutSession";
import { useCart, type CartItem } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaCreditCard,
  FaPlus,
  FaMinus,
  FaExclamationTriangle,
  FaTag,
  FaLock,
  FaUser,
  FaUserSecret,
} from "react-icons/fa";
import {
  validateCart,
  validateCartGuest,
  calculateShipping,
  calculateShippingGuest,
  createOrder,
  createGuestOrder,
  validateAddress,
  validateAddressGuest,
  type ShippingOption,
  type AddressValidationResult,
  type GuestInfo,
  type GuestShippingAddress,
} from "../../api/checkout";
import {
  fetchUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type Address,
  type CreateAddressPayload,
} from "../../api/user";
import {
  fetchProductCouponsPreview,
  type ProductCoupon,
  type GroupedCoupons,
} from "../../api/couponCustomer";
import { validateCoupons } from "../../api/couponValidation";

import StepIndicator from "../../components/customerInterface/checkout/StepIndicator";
import OrderSummary from "../../components/customerInterface/checkout/OrderSummary";
import SuccessScreen from "../../components/customerInterface/checkout/SuccessScreen";
import ShippingOptionsSelector from "../../components/customerInterface/checkout/ShippingOptionsSelector";
import DeliveryEstimate from "../../components/customerInterface/checkout/DeliveryEstimate";

import AddressCard from "../../components/universalComponents/AddressCard";
import AddressForm from "../../components/universalComponents/AddressForm";
import AddressValidationModal from "../../components/universalComponents/AddressValidationModal";
import ConfirmModal from "../../components/universalComponents/ConfirmModal";

import LoadingSpinner from "../../components/universalComponents/LoadingSpinner";

import "../../styles/pages/customer/CheckoutPage.css";

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

  // Rehydrate from sessionStorage once on mount
  const session = loadSession();

  // Step management — derive initial step from URL param
  const stepFromUrl = (urlStep as CheckoutStep) || "cart";
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(stepFromUrl);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // Guest vs auth mode — rehydrate from session if available
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

  // Auth user: address management
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

  // Coupon management (auth users only)
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [couponValidation, setCouponValidation] = useState<any>(null);
  const [couponErrors, setCouponErrors] = useState<string[]>([]);
  const [selectedCartLevelCoupon, setSelectedCartLevelCoupon] =
    useState<ProductCoupon | null>(null);
  const [itemLevelDiscount, setItemLevelDiscount] = useState<number>(0);
  const [cartLevelDiscount, setCartLevelDiscount] = useState<number>(0);

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

  // Confirm modal (universal)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  // Address validation modal
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);
  // For auth users, pending save; for guests, pending address apply
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

  // Loading / error states
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

  // After auth finishes loading, decide mode
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

  // Redirect if cart is empty (but not on success step)
  useEffect(() => {
    if (isInitialLoad) return;
    if (cartItems.length === 0 && currentStep !== "success") {
      navigate("/cart");
    }
  }, [cartItems, currentStep, navigate, isInitialLoad]);

  // Load saved addresses for auth users
  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  // Load coupons for auth users only
  useEffect(() => {
    if (user && cartItems.length > 0) loadCoupons();
  }, [user, cartItems]);

  // Validate coupons for auth users only
  useEffect(() => {
    if (user && cartItems.length > 0 && coupons) {
      validateCouponRules();
    }
  }, [cartItems, user, coupons, selectedCartLevelCoupon]);

  // Re-fetch shipping options when free shipping status changes
  useEffect(() => {
    if (
      !isGuest &&
      selectedAddressId &&
      cartItems.length > 0 &&
      currentStep === "shipping"
    ) {
      handleCalculateShipping();
    }
  }, [isFreeShipping]);

  // Recalculate totals whenever relevant state changes
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

  // Load shipping options for auth users whenever:
  // - An address is selected AND addresses have finished loading from the API
  // - This covers both: user clicks a new address, and page refresh
  useEffect(() => {
    if (
      !isGuest &&
      selectedAddressId &&
      addresses.length > 0 &&
      cartItems.length > 0 &&
      currentStep === "shipping"
    ) {
      handleCalculateShipping();
    }
  }, [selectedAddressId, addresses.length, currentStep, isGuest]);

  // Load shipping options for guests on refresh
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

  // Persist key checkout state to sessionStorage whenever it changes
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

  // Sync current step to the URL
  useEffect(() => {
    if (currentStep === "success") return;
    const target =
      currentStep === "cart" ? "/checkout" : `/checkout/${currentStep}`;
    if (window.location.pathname !== target) {
      navigate(target, { replace: false });
    }
  }, [currentStep]);

  useEffect(() => {
    return () => {
      // When the user navigates away from checkout entirely, wipe the session
      // so they start fresh next time (mode selection will show again)
      clearSession();
    };
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

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

  const loadCoupons = async () => {
    try {
      const data = await fetchProductCouponsPreview();
      setCoupons(data);

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

  // Updates selectedCartLevelCoupon AND keeps CartContext in sync
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

  // Guest info validation
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
    setGuestInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ============================================================================
  // QUANTITY INPUT HANDLERS
  // ============================================================================

  const handleQuantityFocus = (variantId: number, currentQty: number) => {
    setDraftQuantities((prev) => ({
      ...prev,
      [variantId]: String(currentQty),
    }));
  };

  const handleQuantityChange = (variantId: number, value: string) => {
    if (/^\d*$/.test(value)) {
      setDraftQuantities((prev) => ({ ...prev, [variantId]: value }));
    }
  };

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

  const handleContinueToReview = () => {
    setCurrentStep("review");
  };

  // Place order (auth)
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
        shipping_carrier: selectedShipping?.carrier ?? undefined,
        shipping_service: selectedShipping?.service ?? undefined,
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

  // Place order (guest)
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

  // Auth user address handlers
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
      // If the currently-selected address was edited, selectedAddressId won't
      // change so the shipping useEffect won't fire — trigger it manually.
      if (wasEditingSelected && selectedAddressId) {
        handleCalculateShipping();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOriginalAddress = () => {
    if (pendingAddressData) saveAddress(pendingAddressData);
  };

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

  const handleCancelValidation = () => {
    setShowValidationModal(false);
    // If this was an auth-user address save (pendingAddressData set), reopen
    // the address form so the user can correct their input.
    if (pendingAddressData) {
      setShowAddressModal(true);
    }
    setPendingAddressData(null);
    setPendingGuestAddressData(null);
    setValidationResult(null);
  };

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

  const handleAddressFormChange = (
    field: keyof CreateAddressPayload,
    value: string | boolean,
  ) => {
    setAddressForm({ ...addressForm, [field]: value });
  };

  // Resets guest address validation + shipping when the user edits a field
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

  // Guest address validation via Shippo
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

  // Fetch shipping rates immediately after validation (mirrors auth flow)
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

  // Fetch shipping rates immediately after validation (mirrors auth flow)
  const handleAcceptOriginalGuestAddress = () => {
    setGuestAddressValidated(true);
    setShowValidationModal(false);
    setPendingGuestAddressData(null);
    setValidationResult(null);
    handleCalculateShippingGuest();
  };

  if (isInitialLoad) {
    return (
      <div className="cp-checkout-page cp-checkout-loading-state">
        <LoadingSpinner message="Loading checkout..." />
      </div>
    );
  }

  // ============================================================================
  // RENDER: MODE SELECTION (shown when user is not logged in)
  // ============================================================================

  if (!isInitialLoad && !user && checkoutMode === null) {
    return (
      <div className="cp-checkout-page">
        <div className="cp-checkout-container">
          <h1 className="cp-checkout-title">Checkout</h1>
          <div className="cp-checkout-mode-selection">
            <p className="cp-mode-selection-description">
              How would you like to check out?
            </p>
            <div className="cp-mode-selection-cards">
              <button
                className="cp-mode-card cp-mode-card-login"
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
                className="cp-mode-card cp-mode-card-guest"
                onClick={() => {
                  setCheckoutMode("guest");
                  saveSession({ checkoutMode: "guest" });
                }}
              >
                <FaUserSecret size={32} />
                <h3>Guest Checkout</h3>
                <p>
                  No account needed. Just your email for your order
                  confirmation.
                </p>
              </button>
            </div>
            <p className="cp-mode-selection-note">
              Don&apos;t have an account?{" "}
              <button
                className="cp-btn-link"
                onClick={() => navigate("/register?redirect=/checkout")}
              >
                Create one free
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: SUCCESS SCREEN
  // ============================================================================

  if (currentStep === "success") {
    return (
      <div className="cp-checkout-page">
        <div className="cp-checkout-container">
          <SuccessScreen
            orderResult={orderResult}
            userEmail={isGuest ? guestInfo.email : user?.email}
            isGuest={isGuest}
          />
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN CHECKOUT FLOW
  // ============================================================================

  return (
    <div className="cp-checkout-page">
      <div className="cp-checkout-container">
        <h1 className="cp-checkout-title">
          Checkout
          {isGuest && <span className="cp-guest-mode-badge">Guest</span>}
        </h1>

        <StepIndicator currentStep={currentStep} />

        {/* Address Validation Modal */}
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

        {/* Address Form Modal */}
        {showAddressModal && (
          <div
            className="cp-modal-overlay"
            onClick={() => {
              setShowAddressModal(false);
              setEditingAddressId(null);
              resetAddressForm();
            }}
          >
            <div
              className="cp-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
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

        {/* Universal Confirm Modal */}
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

        {error && (
          <div className="cp-checkout-error">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* Coupon errors — auth users only */}
        {!isGuest && couponErrors.length > 0 && (
          <div className="coupon-errors-section">
            <h3>
              <FaExclamationTriangle /> Coupon Issues
            </h3>
            <ul>
              {couponErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="coupon-errors-help">
              Please remove or update the coupons in your cart to continue.
            </p>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="cp-checkout-validation-errors">
            <h4>Please review the following issues:</h4>
            {validationErrors.map((err, i) => (
              <div key={i} className="cp-validation-error-item">
                <FaExclamationTriangle />
                <span>{err.error}</span>
              </div>
            ))}
          </div>
        )}

        <div className="cp-checkout-content">
          <div className="cp-checkout-main">
            {/* ================================================================
                CART REVIEW STEP
            ================================================================ */}
            {currentStep === "cart" && (
              <div className="cp-checkout-section">
                <h2 className="cp-section-title">Review Your Cart</h2>
                <p className="cp-section-description">
                  Review your items before proceeding to checkout
                </p>

                <div className="cp-cart-items-list">
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
                      <div
                        key={item.variant_id}
                        className="cp-checkout-cart-item"
                      >
                        <img src={item.image} alt={item.name} />
                        <div className="cp-item-info">
                          <h4>{item.name}</h4>
                          <p className="cp-item-variant">
                            {item.color} {item.color && item.size && "•"}{" "}
                            {item.size}
                          </p>
                          <div className="cp-quantity-control">
                            <button
                              className="cp-quantity-btn"
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
                              className="cp-quantity-value"
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
                              className="cp-quantity-btn"
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
                            <div className="cp-item-coupon-display">
                              <div className="cp-item-coupon-code-badge">
                                <FaTag size={10} />
                                <span>{itemCoupon.coupon_code}</span>
                              </div>
                              {itemCoupon.discount_type !== "bogo" && (
                                <div className="cp-item-coupon-savings">
                                  {itemCoupon.discount_type ===
                                    "percentage" && (
                                    <span className="cp-savings-badge">
                                      {itemCoupon.discount_value}% OFF
                                    </span>
                                  )}
                                  {itemCoupon.discount_type === "fixed" && (
                                    <span className="cp-savings-badge">
                                      ${itemCoupon.discount_value} OFF
                                    </span>
                                  )}
                                  {itemCoupon.free_shipping && (
                                    <span className="cp-savings-badge cp-shipping">
                                      Free Shipping
                                    </span>
                                  )}
                                </div>
                              )}
                              {itemCoupon.discount_type === "bogo" && (
                                <div className="cp-item-coupon-savings">
                                  <span className="cp-savings-badge cp-bogo">
                                    {itemCoupon.bogo_discount_percentage === 100
                                      ? `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} FREE`
                                      : `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} ${itemCoupon.bogo_discount_percentage}% OFF`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="cp-item-price-section">
                          <div className="cp-item-price">
                            {hasDiscount ? (
                              <>
                                <span className="cp-price-original">
                                  ${itemTotal.toFixed(2)}
                                </span>
                                <span className="cp-price-final">
                                  ${validatedDiscount.final_price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="cp-price-final">
                                ${itemTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <div className="cp-item-savings">
                              <span className="cp-savings-label">
                                You Save:
                              </span>
                              <span className="cp-savings-amount">
                                ${validatedDiscount.discount_amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Email verification prompt — auth users only */}
                {!isGuest && !isEmailVerified && (
                  <div className="checkout-warning">
                    <FaLock />
                    <span>
                      Please verify your email to access discounts and special
                      offers.
                    </span>
                  </div>
                )}

                <div className="cp-checkout-actions">
                  <button
                    className="cp-btn-back"
                    onClick={() => navigate("/cart")}
                  >
                    Back to Cart
                  </button>
                  <button
                    className="cp-btn-continue"
                    onClick={handleContinueToShipping}
                    disabled={loading || (!isGuest && couponErrors.length > 0)}
                  >
                    {loading ? "Validating..." : "Continue to Shipping"}
                  </button>
                </div>
              </div>
            )}

            {/* ================================================================
                SHIPPING STEP
            ================================================================ */}
            {currentStep === "shipping" && (
              <div className="cp-checkout-section">
                <h2 className="cp-section-title">Shipping</h2>
                {/* GUEST: contact info + inline address form */}
                {isGuest && (
                  <>
                    <div className="cp-guest-contact-section">
                      <h3 className="cp-subsection-title">
                        Contact Information
                      </h3>
                      <p className="cp-section-description">
                        Your order confirmation will be sent here. Save your
                        order number to look up your order later.
                      </p>

                      <div className="cp-guest-form-grid">
                        <div className="cp-form-group">
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
                              guestInfoErrors.email ? "cp-input-error" : ""
                            }
                          />
                          {guestInfoErrors.email && (
                            <span className="cp-field-error">
                              {guestInfoErrors.email}
                            </span>
                          )}
                        </div>

                        <div className="cp-form-group">
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
                              guestInfoErrors.first_name ? "cp-input-error" : ""
                            }
                          />
                          {guestInfoErrors.first_name && (
                            <span className="cp-field-error">
                              {guestInfoErrors.first_name}
                            </span>
                          )}
                        </div>

                        <div className="cp-form-group">
                          <label htmlFor="guest-last-name">Last Name</label>
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
                          />
                        </div>

                        <div className="cp-form-group">
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
                            placeholder="555-555-5555"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="cp-guest-address-section">
                      <h3 className="cp-subsection-title">Shipping Address</h3>

                      <div className="cp-guest-form-grid">
                        <div className="cp-form-group cp-form-group-full">
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

                        <div className="cp-form-group cp-form-group-full">
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

                        <div className="cp-form-group">
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

                        <div className="cp-form-group">
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

                        <div className="cp-form-group">
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

                        <div className="cp-form-group">
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
                          className="cp-btn-validate-address"
                          onClick={handleGuestAddressValidate}
                          disabled={loading}
                        >
                          {loading ? "Validating..." : "Validate Address"}
                        </button>
                      )}
                    </div>
                  </>
                )}
                {/* AUTH: saved address list + add form */}
                {!isGuest && (
                  <>
                    <p className="cp-section-description">
                      Select or add a shipping address
                    </p>

                    {user?.email && (
                      <div className="cp-user-email-display">
                        <strong>Order confirmation will be sent to:</strong>{" "}
                        {user.email}
                      </div>
                    )}

                    <div className="cp-address-list">
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
                      className="cp-btn-add-address"
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

                {/* Shipping options (shown once we have rates) */}
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

                {selectedShipping && !loadingShipping && (
                  <DeliveryEstimate
                    shippingMethodName={selectedShipping.service_level_name}
                    className="cp-review-delivery-estimate"
                  />
                )}

                <div className="cp-checkout-actions">
                  <button
                    className="cp-btn-back"
                    onClick={() => setCurrentStep("cart")}
                  >
                    Back to Cart
                  </button>
                  <button
                    className="cp-btn-continue"
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

            {/* ================================================================
                PAYMENT STEP
            ================================================================ */}
            {currentStep === "payment" && (
              <div className="cp-checkout-section">
                <h2 className="cp-section-title">Payment Information</h2>
                <div className="cp-payment-placeholder">
                  <FaCreditCard size={48} />
                  <p>Payment integration coming soon</p>
                  <p className="cp-placeholder-text">
                    In production, this would integrate with Stripe, PayPal, or
                    another payment processor
                  </p>
                </div>

                <div className="cp-checkout-actions">
                  <button
                    className="cp-btn-back"
                    onClick={() => setCurrentStep("shipping")}
                  >
                    Back to Shipping
                  </button>
                  <button
                    className="cp-btn-continue"
                    onClick={handleContinueToReview}
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* ================================================================
                REVIEW STEP
            ================================================================ */}
            {currentStep === "review" && (
              <div className="cp-checkout-section">
                <h2 className="cp-section-title">Review Your Order</h2>

                {/* Shipping address summary */}
                <div className="cp-review-section">
                  <h3>Shipping Address</h3>
                  <div className="cp-review-address">
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
                      shippingMethodName={selectedShipping.service_level_name}
                      className="cp-review-delivery-estimate"
                    />
                  )}
                </div>

                {/* Order items */}
                <div className="cp-review-section">
                  <h3>Order Items</h3>
                  <div className="cp-review-items">
                    {cartItems.map((item) => {
                      const validatedDiscount =
                        !isGuest &&
                        couponValidation?.validated_discounts?.find(
                          (d: any) => d.variant_id === item.variant_id,
                        );
                      const itemCoupon = getCouponForItem(item);

                      return (
                        <div key={item.variant_id} className="cp-review-item">
                          <img src={item.image} alt={item.name} />
                          <div className="cp-review-item-details">
                            <h4>{item.name}</h4>
                            <p>
                              {item.color} {item.color && item.size && "•"}{" "}
                              {item.size}
                            </p>
                            <p>Qty: {item.quantity}</p>
                            {itemCoupon && !isGuest && (
                              <div className="cp-review-item-coupon-display">
                                <div className="cp-review-coupon-code-badge">
                                  <FaTag size={10} />
                                  <span>{itemCoupon.coupon_code}</span>
                                </div>
                                {itemCoupon.discount_type !== "bogo" && (
                                  <div className="cp-review-coupon-savings">
                                    {itemCoupon.discount_type ===
                                      "percentage" && (
                                      <span className="cp-savings-badge">
                                        {itemCoupon.discount_value}% OFF
                                      </span>
                                    )}
                                    {itemCoupon.discount_type === "fixed" && (
                                      <span className="cp-savings-badge">
                                        ${itemCoupon.discount_value} OFF
                                      </span>
                                    )}
                                    {itemCoupon.free_shipping && (
                                      <span className="cp-savings-badge cp-shipping">
                                        Free Shipping
                                      </span>
                                    )}
                                  </div>
                                )}
                                {itemCoupon.discount_type === "bogo" && (
                                  <div className="cp-review-coupon-savings">
                                    <span className="cp-savings-badge cp-bogo">
                                      {itemCoupon.bogo_discount_percentage ===
                                      100
                                        ? `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} FREE`
                                        : `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} ${itemCoupon.bogo_discount_percentage}% OFF`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="cp-review-item-price">
                            {!isGuest &&
                            validatedDiscount &&
                            validatedDiscount.discount_amount > 0 ? (
                              <>
                                <span className="cp-price-original">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                                <span className="cp-price-final">
                                  ${validatedDiscount.final_price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="cp-price-final">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="cp-checkout-actions">
                  <button
                    className="cp-btn-back"
                    onClick={() => setCurrentStep("payment")}
                  >
                    Back to Payment
                  </button>
                  <button
                    className="cp-btn-place-order"
                    onClick={isGuest ? handlePlaceGuestOrder : handlePlaceOrder}
                    disabled={loading || (!isGuest && couponErrors.length > 0)}
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="cp-checkout-sidebar">
            <OrderSummary
              cartItems={cartItems}
              currentStep={currentStep}
              coupons={!isGuest ? coupons : null}
              selectedCartLevelCoupon={
                !isGuest ? selectedCartLevelCoupon : null
              }
              onCartLevelCouponSelect={
                !isGuest ? handleCartLevelCouponSelect : () => {}
              }
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
