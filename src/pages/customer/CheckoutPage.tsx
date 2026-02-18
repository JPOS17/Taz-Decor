import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, type CartItem } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaCreditCard,
  FaPlus,
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
import AddressCard from "../../components/universalComponents/AddressCard";
import AddressForm from "../../components/universalComponents/AddressForm";
import AddressValidationModal from "../../components/universalComponents/AddressValidationModal";

import "../../styles/pages/customer/CheckoutPage.css";

type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "success";

interface OrderResult {
  order_id: number;
  order_number: string;
  total_price: number;
  status: string;
  created_at: string;
}

// ── Blank guest info state ────────────────────────────────────────────────────
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
  const { user, isLoading } = useAuth();
  const { cartItems, clearCart } = useCart();

  // ── Step management ───────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // ── Guest vs auth mode ────────────────────────────────────────────────────
  // null = undecided (shown only after auth finishes loading and user is null)
  const [checkoutMode, setCheckoutMode] = useState<"auth" | "guest" | null>(
    null,
  );
  const [guestInfo, setGuestInfo] = useState<GuestInfo>(EMPTY_GUEST_INFO);
  const [guestAddress, setGuestAddress] =
    useState<GuestShippingAddress>(EMPTY_GUEST_ADDRESS);
  const [guestInfoErrors, setGuestInfoErrors] = useState<
    Record<string, string>
  >({});

  // ── Auth user: address management ─────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);
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

  // ── Coupon management (auth users only) ───────────────────────────────────
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [couponValidation, setCouponValidation] = useState<any>(null);
  const [couponErrors, setCouponErrors] = useState<string[]>([]);
  const [selectedCartLevelCoupon, setSelectedCartLevelCoupon] =
    useState<ProductCoupon | null>(null);
  const [itemLevelDiscount, setItemLevelDiscount] = useState<number>(0);
  const [cartLevelDiscount, setCartLevelDiscount] = useState<number>(0);

  // ── Shipping management ───────────────────────────────────────────────────
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isFreeShipping, setIsFreeShipping] = useState<boolean>(false);

  // ── Order totals ──────────────────────────────────────────────────────────
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  // ── Address validation modal ──────────────────────────────────────────────
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);
  // For auth users, pending save; for guests, pending address apply
  const [pendingAddressData, setPendingAddressData] =
    useState<CreateAddressPayload | null>(null);
  const [pendingGuestAddressData, setPendingGuestAddressData] =
    useState<GuestShippingAddress | null>(null);
  const [guestAddressValidated, setGuestAddressValidated] = useState(false);

  // ── Loading / error states ────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isEmailVerified = user?.isEmailVerified ?? false;
  const isGuest = checkoutMode === "guest";

  // ── Computed: does the guest address form have enough to calculate shipping? ─
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
      }
      // If user is null we wait for them to choose (guest or login)
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
    if (user && cartItems.length > 0) validateCouponRules();
  }, [cartItems, user]);

  useEffect(() => {
    if (user && cartItems.length > 0) validateCouponRules();
  }, [selectedCartLevelCoupon]);

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

  // Recalculate shipping for auth users when address changes
  useEffect(() => {
    if (!isGuest && selectedAddressId && cartItems.length > 0) {
      handleCalculateShipping();
    }
  }, [selectedAddressId]);

  // Recalculate shipping for guests when address becomes complete
  useEffect(() => {
    if (isGuest && guestAddressComplete && cartItems.length > 0) {
      handleCalculateShippingGuest();
    }
  }, [
    guestAddress.address_line1,
    guestAddress.city,
    guestAddress.state,
    guestAddress.zip,
    guestAddress.country,
  ]);

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
    } catch (err) {
      console.error("Error loading coupons:", err);
    }
  };

  const validateCouponRules = async () => {
    if (!user) return; // Guests skip coupon validation entirely
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

  // ── Guest info validation ─────────────────────────────────────────────────
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
      setSelectedShipping(null);
      setShippingCost(0);
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
      setSelectedShipping(null);
      setShippingCost(0);
    } catch (err: any) {
      setShippingError(err.message || "Failed to calculate shipping");
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleShippingOptionSelect = (option: ShippingOption) => {
    setSelectedShipping(option);
    setShippingCost(isFreeShipping ? 0 : parseFloat(option.amount));
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
    if (!selectedShipping) {
      setError("Please select a shipping method");
      return;
    }
    setError(null);
    setCurrentStep("payment");
  };

  const handleContinueToReview = () => {
    setCurrentStep("review");
  };

  // ── Place order (auth) ────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !selectedShipping) {
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
        selected_shipping_rate_id: selectedShipping.rate_id,
        shipping_carrier: selectedShipping.carrier,
        shipping_service: selectedShipping.service,
      });

      clearCart();
      setOrderResult(result.order);
      setCurrentStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // ── Place order (guest) ───────────────────────────────────────────────────
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
      setOrderResult(result.order);
      setCurrentStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // ── Auth user address handlers ────────────────────────────────────────────
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
    setLoading(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, addressData);
      } else {
        await createAddress(addressData);
      }
      await loadAddresses();
      setIsAddingAddress(false);
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
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      await deleteAddress(addressId);
      await loadAddresses();
      if (selectedAddressId === addressId) setSelectedAddressId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    }
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

  // ── Guest address validation via Shippo ───────────────────────────────────

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
      setGuestAddressValidated(false); // ✅ reset if validation call fails
      setError(
        err instanceof Error ? err.message : "Failed to validate address",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCorrectedGuestAddress = () => {
    if (validationResult?.validated_address && pendingGuestAddressData) {
      setGuestAddress({
        ...pendingGuestAddressData,
        address_line1: validationResult.validated_address.street1,
        address_line2: validationResult.validated_address.street2 || "",
        city: validationResult.validated_address.city,
        state: validationResult.validated_address.state,
        zip: validationResult.validated_address.zip,
        country: "USA",
      });
    }
    setGuestAddressValidated(true); // ✅ user accepted the corrected address
    setShowValidationModal(false);
    setPendingGuestAddressData(null);
    setValidationResult(null);
  };

  const handleAcceptOriginalGuestAddress = () => {
    setGuestAddressValidated(true);
    setShowValidationModal(false);
    setPendingGuestAddressData(null);
    setValidationResult(null);
  };

  // ============================================================================
  // RENDER: MODE SELECTION (shown when user is not logged in)
  // ============================================================================

  if (!isInitialLoad && !user && checkoutMode === null) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h1 className="checkout-title">Checkout</h1>
          <div className="checkout-mode-selection">
            <p className="mode-selection-description">
              How would you like to check out?
            </p>
            <div className="mode-selection-cards">
              <button
                className="mode-card mode-card-login"
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
                className="mode-card mode-card-guest"
                onClick={() => setCheckoutMode("guest")}
              >
                <FaUserSecret size={32} />
                <h3>Guest Checkout</h3>
                <p>
                  No account needed. Just your email for your order
                  confirmation.
                </p>
              </button>
            </div>
            <p className="mode-selection-note">
              Don&apos;t have an account?{" "}
              <button
                className="btn-link"
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
      <div className="checkout-page">
        <div className="checkout-container">
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
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">
          Checkout
          {isGuest && <span className="guest-mode-badge">Guest</span>}
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

        {error && (
          <div className="checkout-error">
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
          <div className="checkout-validation-errors">
            <h4>Please review the following issues:</h4>
            {validationErrors.map((err, i) => (
              <div key={i} className="validation-error-item">
                <FaExclamationTriangle />
                <span>{err.error}</span>
              </div>
            ))}
          </div>
        )}

        <div className="checkout-content">
          <div className="checkout-main">
            {/* ================================================================
                CART REVIEW STEP
            ================================================================ */}
            {currentStep === "cart" && (
              <div className="checkout-section">
                <h2 className="section-title">Review Your Cart</h2>
                <p className="section-description">
                  Review your items before proceeding to checkout
                </p>

                <div className="cart-items-list">
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
                        <div className="item-info">
                          <h4>{item.name}</h4>
                          <p className="item-variant">
                            {item.color} {item.color && item.size && "•"}{" "}
                            {item.size}
                          </p>
                          <p className="item-quantity">
                            Quantity: {item.quantity}
                          </p>
                          {itemCoupon && !isGuest && (
                            <div className="item-coupon-display">
                              <div className="item-coupon-code-badge">
                                <FaTag size={10} />
                                <span>{itemCoupon.coupon_code}</span>
                              </div>
                              {itemCoupon.discount_type !== "bogo" && (
                                <div className="item-coupon-savings">
                                  {itemCoupon.discount_type ===
                                    "percentage" && (
                                    <span className="savings-badge">
                                      {itemCoupon.discount_value}% OFF
                                    </span>
                                  )}
                                  {itemCoupon.discount_type === "fixed" && (
                                    <span className="savings-badge">
                                      ${itemCoupon.discount_value} OFF
                                    </span>
                                  )}
                                  {itemCoupon.free_shipping && (
                                    <span className="savings-badge shipping">
                                      Free Shipping
                                    </span>
                                  )}
                                </div>
                              )}
                              {itemCoupon.discount_type === "bogo" && (
                                <div className="item-coupon-savings">
                                  <span className="savings-badge bogo">
                                    {itemCoupon.bogo_discount_percentage === 100
                                      ? `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} FREE`
                                      : `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} ${itemCoupon.bogo_discount_percentage}% OFF`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="item-price-section">
                          <div className="item-price">
                            {hasDiscount ? (
                              <>
                                <span className="price-original">
                                  ${itemTotal.toFixed(2)}
                                </span>
                                <span className="price-final">
                                  ${validatedDiscount.final_price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="price-final">
                                ${itemTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <div className="item-savings">
                              <span className="savings-label">You Save:</span>
                              <span className="savings-amount">
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

                <div className="checkout-actions">
                  <button
                    className="btn-back"
                    onClick={() => navigate("/cart")}
                  >
                    Back to Cart
                  </button>
                  <button
                    className="btn-continue"
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
              <div className="checkout-section">
                <h2 className="section-title">Shipping</h2>

                {/* ── GUEST: contact info + inline address form ─────────── */}
                {isGuest && (
                  <>
                    <div className="guest-contact-section">
                      <h3 className="subsection-title">Contact Information</h3>
                      <p className="section-description">
                        Your order confirmation will be sent here. Save your
                        order number to look up your order later.
                      </p>

                      <div className="guest-form-grid">
                        <div className="form-group">
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
                            <span className="field-error">
                              {guestInfoErrors.email}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
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
                            <span className="field-error">
                              {guestInfoErrors.first_name}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
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

                        <div className="form-group">
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

                    <div className="guest-address-section">
                      <h3 className="subsection-title">Shipping Address</h3>

                      <div className="guest-form-grid">
                        <div className="form-group form-group-full">
                          <label htmlFor="g-line1">Address Line 1 *</label>
                          <input
                            id="g-line1"
                            type="text"
                            value={guestAddress.address_line1}
                            onChange={(e) =>
                              setGuestAddress({
                                ...guestAddress,
                                address_line1: e.target.value,
                              })
                            }
                            placeholder="123 Main St"
                          />
                        </div>

                        <div className="form-group form-group-full">
                          <label htmlFor="g-line2">Address Line 2</label>
                          <input
                            id="g-line2"
                            type="text"
                            value={guestAddress.address_line2 || ""}
                            onChange={(e) =>
                              setGuestAddress({
                                ...guestAddress,
                                address_line2: e.target.value,
                              })
                            }
                            placeholder="Apt, Suite, etc."
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="g-city">City *</label>
                          <input
                            id="g-city"
                            type="text"
                            value={guestAddress.city}
                            onChange={(e) =>
                              setGuestAddress({
                                ...guestAddress,
                                city: e.target.value,
                              })
                            }
                            placeholder="New York"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="g-state">State *</label>
                          <input
                            id="g-state"
                            type="text"
                            value={guestAddress.state}
                            onChange={(e) =>
                              setGuestAddress({
                                ...guestAddress,
                                state: e.target.value,
                              })
                            }
                            placeholder="NY"
                            maxLength={2}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="g-zip">ZIP Code *</label>
                          <input
                            id="g-zip"
                            type="text"
                            value={guestAddress.zip}
                            onChange={(e) =>
                              setGuestAddress({
                                ...guestAddress,
                                zip: e.target.value,
                              })
                            }
                            placeholder="10001"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="g-country">Country</label>
                          <input
                            id="g-country"
                            type="text"
                            value={guestAddress.country || "USA"}
                            onChange={(e) =>
                              setGuestAddress({
                                ...guestAddress,
                                country: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {guestAddressComplete && (
                        <button
                          type="button"
                          className="btn-validate-address"
                          onClick={handleGuestAddressValidate}
                          disabled={loading}
                        >
                          {loading ? "Validating..." : "Validate Address"}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* ── AUTH: saved address list + add form ───────────────── */}
                {!isGuest && (
                  <>
                    <p className="section-description">
                      Select or add a shipping address
                    </p>

                    {user?.email && (
                      <div className="user-email-display">
                        <strong>Order confirmation will be sent to:</strong>{" "}
                        {user.email}
                      </div>
                    )}

                    <div className="address-list">
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

                    {!isAddingAddress && (
                      <button
                        className="btn-add-address"
                        onClick={() => setIsAddingAddress(true)}
                      >
                        <FaPlus /> Add New Address
                      </button>
                    )}

                    {isAddingAddress && (
                      <AddressForm
                        addressForm={addressForm}
                        onFormChange={handleAddressFormChange}
                        onSubmit={handleAddressSubmit}
                        onCancel={() => {
                          setIsAddingAddress(false);
                          setEditingAddressId(null);
                          resetAddressForm();
                        }}
                        isEditing={!!editingAddressId}
                        loading={loading}
                      />
                    )}
                  </>
                )}

                {/* ── Shipping options (shown once we have rates) ───────── */}
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

                <div className="checkout-actions">
                  <button
                    className="btn-back"
                    onClick={() => setCurrentStep("cart")}
                  >
                    Back to Cart
                  </button>
                  <button
                    className="btn-continue"
                    onClick={handleContinueToPayment}
                    disabled={
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
              <div className="checkout-section">
                <h2 className="section-title">Payment Information</h2>
                <div className="payment-placeholder">
                  <FaCreditCard size={48} />
                  <p>Payment integration coming soon</p>
                  <p className="placeholder-text">
                    In production, this would integrate with Stripe, PayPal, or
                    another payment processor
                  </p>
                </div>

                <div className="checkout-actions">
                  <button
                    className="btn-back"
                    onClick={() => setCurrentStep("shipping")}
                  >
                    Back to Shipping
                  </button>
                  <button
                    className="btn-continue"
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
              <div className="checkout-section">
                <h2 className="section-title">Review Your Order</h2>

                {/* Shipping address summary */}
                <div className="review-section">
                  <h3>Shipping Address</h3>
                  <div className="review-address">
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
                </div>

                {/* Order items */}
                <div className="review-section">
                  <h3>Order Items</h3>
                  <div className="review-items">
                    {cartItems.map((item) => {
                      const validatedDiscount =
                        !isGuest &&
                        couponValidation?.validated_discounts?.find(
                          (d: any) => d.variant_id === item.variant_id,
                        );
                      const itemCoupon = getCouponForItem(item);

                      return (
                        <div key={item.variant_id} className="review-item">
                          <img src={item.image} alt={item.name} />
                          <div className="review-item-details">
                            <h4>{item.name}</h4>
                            <p>
                              {item.color} {item.color && item.size && "•"}{" "}
                              {item.size}
                            </p>
                            <p>Qty: {item.quantity}</p>
                            {itemCoupon && !isGuest && (
                              <div className="review-item-coupon-display">
                                <div className="review-coupon-code-badge">
                                  <FaTag size={10} />
                                  <span>{itemCoupon.coupon_code}</span>
                                </div>
                                {itemCoupon.discount_type !== "bogo" && (
                                  <div className="review-coupon-savings">
                                    {itemCoupon.discount_type ===
                                      "percentage" && (
                                      <span className="savings-badge">
                                        {itemCoupon.discount_value}% OFF
                                      </span>
                                    )}
                                    {itemCoupon.discount_type === "fixed" && (
                                      <span className="savings-badge">
                                        ${itemCoupon.discount_value} OFF
                                      </span>
                                    )}
                                    {itemCoupon.free_shipping && (
                                      <span className="savings-badge shipping">
                                        Free Shipping
                                      </span>
                                    )}
                                  </div>
                                )}
                                {itemCoupon.discount_type === "bogo" && (
                                  <div className="review-coupon-savings">
                                    <span className="savings-badge bogo">
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
                          <div className="review-item-price">
                            {!isGuest &&
                            validatedDiscount &&
                            validatedDiscount.discount_amount > 0 ? (
                              <>
                                <span className="price-original">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                                <span className="price-final">
                                  ${validatedDiscount.final_price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="price-final">
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
                    className="btn-back"
                    onClick={() => setCurrentStep("payment")}
                  >
                    Back to Payment
                  </button>
                  <button
                    className="btn-place-order"
                    onClick={isGuest ? handlePlaceGuestOrder : handlePlaceOrder}
                    disabled={loading || (!isGuest && couponErrors.length > 0)}
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary Sidebar ─────────────────────────────────────── */}
          <div className="checkout-sidebar">
            <OrderSummary
              cartItems={cartItems}
              currentStep={currentStep}
              // Pass coupons/coupon state only for auth users
              coupons={!isGuest ? coupons : null}
              selectedCartLevelCoupon={
                !isGuest ? selectedCartLevelCoupon : null
              }
              onCartLevelCouponSelect={
                !isGuest ? setSelectedCartLevelCoupon : () => {}
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
