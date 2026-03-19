import { useEffect, useState } from "react";
import { fetchAllCouponCodes } from "../../../api/couponManagement";
import type {
  Coupon,
  CreateCouponPayload,
  CategoryOption,
  ProductTypeOption,
  ProductOption,
  LocationOption,
} from "../../../api/couponManagement";
import { CouponPreview } from "./CouponPreview";
import { CustomSelect } from "./CustomSelect";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  type CouponValidationErrors,
} from "../../../utils/couponValidation";

interface CouponWizardProps {
  editingCoupon: Coupon | null;
  formData: CreateCouponPayload;
  setFormData: (data: CreateCouponPayload) => void;
  categories: CategoryOption[];
  productTypes: ProductTypeOption[];
  products: ProductOption[];
  variants: any[];
  locations: LocationOption[];
  selectedProductForVariant: number | null;
  setSelectedProductForVariant: (id: number | null) => void;
  customGroupProducts: number[];
  setCustomGroupProducts: (ids: number[]) => void;
  customGroupVariants: { [productId: number]: number[] };
  setCustomGroupVariants: (
    variants:
      | { [productId: number]: number[] }
      | ((prev: { [productId: number]: number[] }) => {
          [productId: number]: number[];
        }),
  ) => void;
  initialProductVariantsMap: { [productId: number]: any[] };
  onClose: () => void;
  onSubmit: () => void;
  loadVariantsForProduct: (productId: number) => void;
  loadVariantsForCustomGroup: (productId: number) => Promise<any[]>;
}

export const CouponWizard = ({
  editingCoupon,
  formData,
  setFormData,
  categories,
  productTypes,
  products,
  variants,
  locations,
  selectedProductForVariant,
  setSelectedProductForVariant,
  customGroupProducts,
  setCustomGroupProducts,
  customGroupVariants,
  setCustomGroupVariants,
  initialProductVariantsMap,
  onClose,
  onSubmit,
  loadVariantsForProduct,
  loadVariantsForCustomGroup,
}: CouponWizardProps) => {
  const [modalStep, setModalStep] = useState(1);
  const TOTAL_STEPS = 5;
  const [validationErrors, setValidationErrors] =
    useState<CouponValidationErrors>({});

  const [productVariantsMap, setProductVariantsMap] = useState<{
    [productId: number]: any[];
  }>({});
  const [loadingVariants, setLoadingVariants] = useState<{
    [productId: number]: boolean;
  }>({});

  const [existingCouponCodes, setExistingCouponCodes] = useState<string[]>([]);

  useEffect(() => {
    const loadCouponCodes = async () => {
      try {
        const codes = await fetchAllCouponCodes();
        setExistingCouponCodes(codes);
      } catch (error) {
        console.error("Failed to load coupon codes:", error);
      }
    };
    loadCouponCodes();
  }, []);

  useEffect(() => {
    if (Object.keys(initialProductVariantsMap).length > 0) {
      setProductVariantsMap(initialProductVariantsMap);
    }
  }, [initialProductVariantsMap]);

  // Track original applies_to when editing
  const [originalAppliesTo, setOriginalAppliesTo] = useState<{
    type: string;
    id?: number | null | string | number[];
  } | null>(null);

  // Track previous discount type to detect changes
  const [previousDiscountType, setPreviousDiscountType] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (editingCoupon && !originalAppliesTo) {
      setOriginalAppliesTo({
        type: editingCoupon.applies_to_type,
        id: editingCoupon.applies_to_id,
      });
      setPreviousDiscountType(editingCoupon.discount_type);
    }
  }, [editingCoupon, originalAppliesTo]);

  // Combined discount type change handling
  useEffect(() => {
    const currentType = formData.discount_type;

    if (previousDiscountType === null) {
      setPreviousDiscountType(currentType);
      return;
    }

    // Skip if discount type hasn't actually changed OR if discount type is empty
    if (previousDiscountType === currentType || !currentType) {
      return;
    }

    const isFixed = currentType === "fixed";
    const wasFixed = previousDiscountType === "fixed";
    const isFreeShippingOnly = currentType === "free_shipping_only";
    const wasFreeShippingOnly = previousDiscountType === "free_shipping_only";

    // Build updates object to apply all changes at once
    let updates: Partial<CreateCouponPayload> = {};

    if (
      (!wasFixed && isFixed) ||
      (!wasFreeShippingOnly && isFreeShippingOnly)
    ) {
      updates.applies_to_type = "all" as any;
      updates.applies_to_id = undefined;

      setCustomGroupProducts([]);
      setCustomGroupVariants({});
    }
    // Handle applies_to restore when switching FROM fixed/free_shipping_only to any other type
    // Only restore if we're editing and have original data
    else if (
      (wasFixed || wasFreeShippingOnly) &&
      !isFixed &&
      !isFreeShippingOnly &&
      editingCoupon &&
      originalAppliesTo
    ) {
      updates.applies_to_type = originalAppliesTo.type as any;
      updates.applies_to_id =
        originalAppliesTo.id === null
          ? undefined
          : Array.isArray(originalAppliesTo.id)
            ? JSON.stringify(originalAppliesTo.id)
            : originalAppliesTo.id;
    }

    // Handle discount_value and free_shipping reset whenever discount type changes
    // ONLY reset discount_value if actually switching between percentage/fixed/bogo/free_shipping_only
    if (currentType !== previousDiscountType) {
      updates.discount_value = undefined;
    }

    // Auto-enable free_shipping when switching TO free_shipping_only
    if (!wasFreeShippingOnly && isFreeShippingOnly) {
      updates.free_shipping = true;
    }
    // Reset free_shipping to false when switching FROM free_shipping_only
    else if (wasFreeShippingOnly && !isFreeShippingOnly) {
      updates.free_shipping = false;
    }

    // Apply all updates at once
    if (Object.keys(updates).length > 0) {
      setFormData({
        ...formData,
        ...updates,
      });
    }

    // Update previous discount type AFTER all logic is complete
    setPreviousDiscountType(currentType);
  }, [formData.discount_type]);

  const handleNext = () => {
    let errors: CouponValidationErrors = {};

    if (modalStep === 1) {
      errors = validateStep1(formData, existingCouponCodes, !!editingCoupon);
    } else if (modalStep === 2) {
      errors = validateStep2(formData);
    } else if (modalStep === 3) {
      errors = validateStep3(formData, customGroupProducts);
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setModalStep(modalStep + 1);
    }
  };

  const handleSubmit = () => {
    onSubmit();
    setModalStep(1);
  };

  return (
    <div className="coupon-modal-overlay">
      <div className="coupon-modal-content coupon-modal-wizard">
        <div className="coupon-wizard-header">
          <h2>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</h2>
          <div className="coupon-wizard-progress">
            <div className="coupon-progress-steps">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`coupon-progress-step ${modalStep === step ? "coupon-step-active" : ""} ${modalStep > step ? "coupon-step-completed" : ""}`}
                >
                  <div className="coupon-step-number">{step}</div>
                  <div className="coupon-step-label">
                    {step === 1 && "Basic Info"}
                    {step === 2 && "Discount Details"}
                    {step === 3 && "Apply To"}
                    {step === 4 && "Limits & Dates"}
                    {step === 5 && "Preview"}
                  </div>
                </div>
              ))}
            </div>
            <div className="coupon-progress-bar">
              <div
                className="coupon-progress-fill"
                style={{ width: `${(modalStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="coupon-wizard-body">
          {/* Step 1: Basic Info */}
          {modalStep === 1 && (
            <div className="coupon-wizard-step">
              {/* Store Location - ABOVE Coupon Code */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Store Location *</label>
                <CustomSelect
                  options={[
                    ...locations.map((loc) => ({
                      value: loc.location_id,
                      label: `${loc.location_name} (${loc.city}, ${loc.state})`,
                    })),
                    { value: "both", label: "Both Stores" },
                  ]}
                  value={
                    formData.location_ids?.length === locations.length
                      ? "both"
                      : formData.location_ids?.[0] || ""
                  }
                  onChange={(value) => {
                    let newLocationIds: number[];

                    if (value === "both") {
                      // Select all locations
                      newLocationIds = locations.map((loc) => loc.location_id);
                    } else {
                      // Select single location
                      newLocationIds = [value as number];
                    }

                    setFormData({
                      ...formData,
                      location_ids: newLocationIds,
                    });

                    // Clear error when user makes a selection
                    if (validationErrors.location_ids) {
                      setValidationErrors({
                        ...validationErrors,
                        location_ids: undefined,
                      });
                    }
                  }}
                  placeholder="--Select--"
                  searchable={false}
                  className={
                    validationErrors.location_ids ? "coupon-input-error" : ""
                  }
                />
                {validationErrors.location_ids && (
                  <span className="coupon-error-message">
                    {validationErrors.location_ids}
                  </span>
                )}
                <small className="coupon-form-hint">
                  Select which store location(s) this coupon applies to
                  {formData.location_ids &&
                    formData.location_ids.length > 0 && (
                      <>
                        {" "}
                        (
                        {formData.location_ids.length === locations.length
                          ? "Both stores"
                          : `${formData.location_ids.length} location${formData.location_ids.length !== 1 ? "s" : ""}`}{" "}
                        selected)
                      </>
                    )}
                </small>
              </div>

              {/* Coupon Code - BELOW Store Location */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.coupon_code}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      coupon_code: e.target.value.toUpperCase(),
                    });
                    if (validationErrors.coupon_code) {
                      setValidationErrors({
                        ...validationErrors,
                        coupon_code: undefined,
                      });
                    }
                  }}
                  placeholder="e.g., SAVE20"
                  disabled={!!editingCoupon}
                  className={`coupon-form-input ${validationErrors.coupon_code ? "coupon-input-error" : ""}`}
                />
                {validationErrors.coupon_code && (
                  <span className="coupon-error-message">
                    {validationErrors.coupon_code}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Internal description for tracking"
                  rows={3}
                  className="coupon-form-textarea"
                />
              </div>
            </div>
          )}
          {/* Step 2: Discount Details */}
          {modalStep === 2 && (
            <div className="coupon-wizard-step">
              <div className="coupon-form-group">
                <label className="coupon-form-label">Discount Type *</label>
                <CustomSelect
                  options={[
                    { value: "", label: "--Select--" },
                    { value: "percentage", label: "Percentage Off" },
                    { value: "fixed", label: "Fixed Amount Off" },
                    { value: "bogo", label: "Buy One Get One (BOGO)" },
                    { value: "free_shipping_only", label: "Free Shipping" },
                  ]}
                  value={formData.discount_type || ""}
                  onChange={(value) => {
                    const newType = value as any;

                    // Auto-enable free_shipping for free_shipping_only type
                    const updates: any = {
                      discount_type: newType,
                      discount_value: undefined,
                      min_purchase_amount: undefined,
                      max_discount_amount: undefined,
                      bogo_buy_quantity: newType === "bogo" ? 1 : undefined,
                      bogo_get_quantity: newType === "bogo" ? 1 : undefined,
                      bogo_discount_percentage:
                        newType === "bogo" ? 50 : undefined,
                      free_shipping:
                        newType === "free_shipping_only"
                          ? true
                          : formData.free_shipping,
                    };

                    setFormData({
                      ...formData,
                      ...updates,
                    });

                    if (validationErrors.discount_type) {
                      setValidationErrors({
                        ...validationErrors,
                        discount_type: undefined,
                      });
                    }
                  }}
                  placeholder="Select discount type"
                  searchable={false}
                  className={
                    validationErrors.discount_type ? "coupon-input-error" : ""
                  }
                />
                {validationErrors.discount_type && (
                  <span className="coupon-error-message">
                    {validationErrors.discount_type}
                  </span>
                )}
              </div>

              {!formData.discount_type ? (
                <div className="coupon-form-group">
                  <div
                    className="coupon-info-message"
                    style={{
                      backgroundColor: "#fff3cd",
                      border: "1px solid #ffc107",
                      borderRadius: "4px",
                      padding: "16px",
                      marginTop: "12px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#856404",
                        marginBottom: "8px",
                        fontSize: "16px",
                      }}
                    >
                      Please Select a Discount Type
                    </strong>
                    <p
                      style={{
                        margin: "8px 0",
                        color: "#856404",
                        lineHeight: "1.5",
                      }}
                    >
                      Choose one of the discount types above to continue
                      creating your coupon.
                    </p>
                  </div>
                </div>
              ) : formData.discount_type === "bogo" ? (
                <>
                  <div className="coupon-form-grid-3">
                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        Buy Quantity *
                      </label>
                      <input
                        type="number"
                        value={formData.bogo_buy_quantity ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            bogo_buy_quantity:
                              value === "" ? undefined : parseInt(value),
                          });
                          if (validationErrors.bogo_buy_quantity) {
                            setValidationErrors({
                              ...validationErrors,
                              bogo_buy_quantity: undefined,
                            });
                          }
                        }}
                        min="1"
                        placeholder="1"
                        className={`coupon-form-input ${validationErrors.bogo_buy_quantity ? "coupon-input-error" : ""}`}
                      />
                      {validationErrors.bogo_buy_quantity && (
                        <span className="coupon-error-message">
                          {validationErrors.bogo_buy_quantity}
                        </span>
                      )}
                    </div>

                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        Get Quantity *
                      </label>
                      <input
                        type="number"
                        value={formData.bogo_get_quantity ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            bogo_get_quantity:
                              value === "" ? undefined : parseInt(value),
                          });
                          if (validationErrors.bogo_get_quantity) {
                            setValidationErrors({
                              ...validationErrors,
                              bogo_get_quantity: undefined,
                            });
                          }
                        }}
                        min="1"
                        placeholder="1"
                        className={`coupon-form-input ${validationErrors.bogo_get_quantity ? "coupon-input-error" : ""}`}
                      />
                      {validationErrors.bogo_get_quantity && (
                        <span className="coupon-error-message">
                          {validationErrors.bogo_get_quantity}
                        </span>
                      )}
                    </div>

                    <div className="coupon-form-group">
                      <label className="coupon-form-label">Discount % *</label>
                      <input
                        type="number"
                        value={formData.bogo_discount_percentage ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            bogo_discount_percentage:
                              value === "" ? undefined : parseInt(value),
                          });
                          if (validationErrors.bogo_discount_percentage) {
                            setValidationErrors({
                              ...validationErrors,
                              bogo_discount_percentage: undefined,
                            });
                          }
                        }}
                        min="1"
                        max="100"
                        placeholder="50"
                        className={`coupon-form-input ${validationErrors.bogo_discount_percentage ? "coupon-input-error" : ""}`}
                      />
                      {validationErrors.bogo_discount_percentage && (
                        <span className="coupon-error-message">
                          {validationErrors.bogo_discount_percentage}
                        </span>
                      )}
                      <small className="coupon-form-hint">
                        1-100% (100 = Free)
                      </small>
                    </div>
                  </div>

                  <div className="coupon-bogo-preview">
                    <strong>Preview:</strong> Buy{" "}
                    {formData.bogo_buy_quantity || 1} Get{" "}
                    {formData.bogo_get_quantity || 1}{" "}
                    {formData.bogo_discount_percentage === 100
                      ? "Free"
                      : `${formData.bogo_discount_percentage || 50}% Off`}
                  </div>
                </>
              ) : formData.discount_type === "free_shipping_only" ? (
                <>
                  <div className="coupon-form-group">
                    <div
                      className="coupon-info-message"
                      style={{
                        backgroundColor: "#e3f2fd",
                        border: "1px solid #2196f3",
                        borderRadius: "4px",
                        padding: "16px",
                        marginTop: "12px",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#1976d2",
                          marginBottom: "8px",
                          fontSize: "16px",
                        }}
                      >
                        Free Shipping Only
                      </strong>
                      <p
                        style={{
                          margin: "8px 0",
                          color: "#424242",
                          lineHeight: "1.5",
                        }}
                      >
                        This coupon will provide free shipping without any
                        additional discount. You must set a minimum purchase
                        amount below.
                      </p>
                    </div>
                  </div>

                  <div className="coupon-form-group">
                    <label className="coupon-form-label">
                      Minimum Purchase Amount *
                    </label>
                    <div className="coupon-input-with-prefix">
                      <span className="coupon-input-prefix">$</span>
                      <input
                        type="number"
                        value={formData.min_purchase_amount ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            min_purchase_amount:
                              value === "" ? undefined : parseFloat(value),
                          });
                          if (validationErrors.min_purchase_amount) {
                            setValidationErrors({
                              ...validationErrors,
                              min_purchase_amount: undefined,
                            });
                          }
                        }}
                        placeholder="e.g., 50.00"
                        step="0.01"
                        min="0"
                        className={`coupon-form-input ${validationErrors.min_purchase_amount ? "coupon-input-error" : ""}`}
                      />
                    </div>
                    {validationErrors.min_purchase_amount && (
                      <span className="coupon-error-message">
                        {validationErrors.min_purchase_amount}
                      </span>
                    )}
                    <small className="coupon-form-hint">
                      Free shipping will only apply if order total meets or
                      exceeds this amount
                    </small>
                  </div>
                </>
              ) : (
                <>
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">
                      Discount Value *
                    </label>
                    <div className="coupon-input-with-prefix">
                      {formData.discount_type === "percentage" && (
                        <span className="coupon-input-prefix">%</span>
                      )}
                      {formData.discount_type === "fixed" && (
                        <span className="coupon-input-prefix">$</span>
                      )}
                      <input
                        type="number"
                        value={formData.discount_value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            discount_value:
                              value === "" ? undefined : parseFloat(value),
                          });
                          if (validationErrors.discount_value) {
                            setValidationErrors({
                              ...validationErrors,
                              discount_value: undefined,
                            });
                          }
                        }}
                        placeholder={
                          formData.discount_type === "percentage"
                            ? "10"
                            : "5.00"
                        }
                        step={formData.discount_type === "fixed" ? "0.01" : "1"}
                        min="0"
                        max={
                          formData.discount_type === "percentage"
                            ? "100"
                            : undefined
                        }
                        className={`coupon-form-input ${validationErrors.discount_value ? "coupon-input-error" : ""}`}
                      />
                    </div>
                    {validationErrors.discount_value && (
                      <span className="coupon-error-message">
                        {validationErrors.discount_value}
                      </span>
                    )}
                  </div>

                  <div className="coupon-form-grid-2">
                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        Minimum Purchase Amount
                        {formData.discount_type === "fixed" && " *"}
                      </label>
                      <div className="coupon-input-with-prefix">
                        <span className="coupon-input-prefix">$</span>
                        <input
                          type="number"
                          value={formData.min_purchase_amount ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({
                              ...formData,
                              min_purchase_amount:
                                value === "" ? undefined : parseFloat(value),
                            });
                            if (validationErrors.min_purchase_amount) {
                              setValidationErrors({
                                ...validationErrors,
                                min_purchase_amount: undefined,
                              });
                            }
                          }}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className={`coupon-form-input ${validationErrors.min_purchase_amount ? "coupon-input-error" : ""}`}
                        />
                      </div>
                      {validationErrors.min_purchase_amount && (
                        <span className="coupon-error-message">
                          {validationErrors.min_purchase_amount}
                        </span>
                      )}
                      {formData.discount_type === "fixed" &&
                        formData.discount_value && (
                          <small className="coupon-form-hint">
                            Required: Minimum $
                            {(formData.discount_value * 5).toFixed(2)} (5x
                            discount amount)
                          </small>
                        )}
                    </div>

                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        Maximum Discount Amount
                      </label>
                      <div className="coupon-input-with-prefix">
                        <span className="coupon-input-prefix">$</span>
                        <input
                          type="number"
                          value={formData.max_discount_amount ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({
                              ...formData,
                              max_discount_amount:
                                value === "" ? undefined : parseFloat(value),
                            });
                          }}
                          placeholder="No limit"
                          step="0.01"
                          min="0"
                          className="coupon-form-input"
                        />
                      </div>
                      <small className="coupon-form-hint">
                        Cap total discount (useful for % off)
                      </small>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Step 3: Apply To */}
          {modalStep === 3 && (
            <div className="coupon-wizard-step">
              <div className="coupon-form-group">
                <label className="coupon-form-label">
                  This coupon applies to *
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: "--Select--" },
                    { value: "all", label: "All Products (Store-Wide)" },
                    ...(formData.discount_type !== "fixed" &&
                    formData.discount_type !== "free_shipping_only"
                      ? [
                          { value: "category", label: "Specific Category" },
                          {
                            value: "product_type",
                            label: "Specific Product Type",
                          },
                          { value: "product", label: "Specific Product" },
                          { value: "variant", label: "Specific Variant" },
                          {
                            value: "custom_group",
                            label: "Custom Product Group",
                          },
                        ]
                      : []),
                  ]}
                  value={formData.applies_to_type || ""}
                  onChange={(value) => {
                    const newType = value as any;
                    setFormData({
                      ...formData,
                      applies_to_type: newType,
                      applies_to_id: undefined,
                    });
                    setSelectedProductForVariant(null);
                    setCustomGroupProducts([]);
                    setCustomGroupVariants({});
                    if (validationErrors.applies_to_type) {
                      setValidationErrors({
                        ...validationErrors,
                        applies_to_type: undefined,
                        applies_to_id: undefined,
                      });
                    }
                  }}
                  placeholder="Select where to apply"
                  searchable={false}
                  disabled={
                    formData.discount_type === "fixed" ||
                    formData.discount_type === "free_shipping_only"
                  }
                  className={
                    validationErrors.applies_to_type ? "coupon-input-error" : ""
                  }
                />
                {validationErrors.applies_to_type && (
                  <span className="coupon-error-message">
                    {validationErrors.applies_to_type}
                  </span>
                )}
                {(formData.discount_type === "fixed" ||
                  formData.discount_type === "free_shipping_only") && (
                  <small className="coupon-form-hint">
                    {formData.discount_type === "fixed"
                      ? "Fixed amount coupons must apply to all products"
                      : "Free shipping coupons must apply to all products"}
                  </small>
                )}
              </div>

              {formData.applies_to_type === "category" && (
                <div className="coupon-form-group">
                  <label className="coupon-form-label">Select Category *</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Choose a category..." },
                      ...categories.map((cat) => ({
                        value: cat.category_id,
                        label: cat.category_name,
                      })),
                    ]}
                    value={formData.applies_to_id ?? ""}
                    onChange={(value) => {
                      setFormData({
                        ...formData,
                        applies_to_id: value ? Number(value) : undefined,
                      });
                      if (validationErrors.applies_to_id) {
                        setValidationErrors({
                          ...validationErrors,
                          applies_to_id: undefined,
                        });
                      }
                    }}
                    placeholder="Choose a category..."
                    searchable={true}
                    className={
                      validationErrors.applies_to_id ? "coupon-input-error" : ""
                    }
                  />
                  {validationErrors.applies_to_id && (
                    <span className="coupon-error-message">
                      {validationErrors.applies_to_id}
                    </span>
                  )}
                </div>
              )}

              {formData.applies_to_type === "product_type" && (
                <div className="coupon-form-group">
                  <label className="coupon-form-label">
                    Select Product Type *
                  </label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Choose a product type..." },
                      ...productTypes.map((type) => ({
                        value: type.product_type_id,
                        label: type.type_name,
                      })),
                    ]}
                    value={formData.applies_to_id ?? ""}
                    onChange={(value) => {
                      setFormData({
                        ...formData,
                        applies_to_id: value ? Number(value) : undefined,
                      });
                      if (validationErrors.applies_to_id) {
                        setValidationErrors({
                          ...validationErrors,
                          applies_to_id: undefined,
                        });
                      }
                    }}
                    placeholder="Choose a product type..."
                    searchable={true}
                    className={
                      validationErrors.applies_to_id ? "coupon-input-error" : ""
                    }
                  />
                  {validationErrors.applies_to_id && (
                    <span className="coupon-error-message">
                      {validationErrors.applies_to_id}
                    </span>
                  )}
                </div>
              )}

              {formData.applies_to_type === "product" && (
                <div className="coupon-form-group">
                  <label className="coupon-form-label">Select Product *</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Choose a product..." },
                      ...products.map((product) => ({
                        value: product.product_id,
                        label: product.name,
                      })),
                    ]}
                    value={formData.applies_to_id ?? ""}
                    onChange={(value) => {
                      setFormData({
                        ...formData,
                        applies_to_id: value ? Number(value) : undefined,
                      });
                      if (validationErrors.applies_to_id) {
                        setValidationErrors({
                          ...validationErrors,
                          applies_to_id: undefined,
                        });
                      }
                    }}
                    placeholder="Choose a product..."
                    searchable={true}
                    className={
                      validationErrors.applies_to_id ? "coupon-input-error" : ""
                    }
                  />
                  {validationErrors.applies_to_id && (
                    <span className="coupon-error-message">
                      {validationErrors.applies_to_id}
                    </span>
                  )}
                </div>
              )}

              {formData.applies_to_type === "variant" && (
                <>
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">
                      First, Select Product *
                    </label>
                    <CustomSelect
                      options={[
                        { value: "", label: "Choose a product..." },
                        ...products.map((product) => ({
                          value: product.product_id,
                          label: product.name,
                        })),
                      ]}
                      value={selectedProductForVariant ?? ""}
                      onChange={(value) => {
                        const productId = value ? Number(value) : null;
                        setSelectedProductForVariant(productId);
                        if (productId) {
                          loadVariantsForProduct(productId);
                        }
                        setFormData({
                          ...formData,
                          applies_to_id: undefined,
                        });
                      }}
                      placeholder="Choose a product..."
                      searchable={true}
                    />
                  </div>

                  {selectedProductForVariant && (
                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        Then, Select Variant *
                      </label>
                      <CustomSelect
                        options={[
                          { value: "", label: "Choose a variant..." },
                          ...variants.map((variant) => ({
                            value: variant.variant_id,
                            label: `${
                              variant.color && variant.size
                                ? `${variant.color} / ${variant.size}`
                                : variant.color || variant.size || "Default"
                            } - $${parseFloat(variant.price).toFixed(2)} (SKU: ${variant.sku})`,
                          })),
                        ]}
                        value={formData.applies_to_id ?? ""}
                        onChange={(value) => {
                          setFormData({
                            ...formData,
                            applies_to_id: value ? Number(value) : undefined,
                          });
                          if (validationErrors.applies_to_id) {
                            setValidationErrors({
                              ...validationErrors,
                              applies_to_id: undefined,
                            });
                          }
                        }}
                        placeholder="Choose a variant..."
                        searchable={true}
                        className={
                          validationErrors.applies_to_id
                            ? "coupon-input-error"
                            : ""
                        }
                      />
                      {validationErrors.applies_to_id && (
                        <span className="coupon-error-message">
                          {validationErrors.applies_to_id}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}

              {formData.applies_to_type === "custom_group" && (
                <div className="coupon-form-group">
                  <label className="coupon-form-label">
                    Build Custom Product Group *
                  </label>
                  <div className="coupon-custom-group-builder">
                    <CustomSelect
                      options={[
                        { value: "", label: "Add a product..." },
                        ...products
                          .filter(
                            (p) => !customGroupProducts.includes(p.product_id),
                          )
                          .map((product) => ({
                            value: product.product_id,
                            label: product.name,
                          })),
                      ]}
                      value=""
                      onChange={async (value) => {
                        const productId = value ? Number(value) : null;
                        if (
                          productId &&
                          !customGroupProducts.includes(productId)
                        ) {
                          setLoadingVariants({
                            ...loadingVariants,
                            [productId]: true,
                          });
                          try {
                            const fetchedVariants =
                              await loadVariantsForCustomGroup(productId);
                            setProductVariantsMap((prev) => ({
                              ...prev,
                              [productId]: fetchedVariants,
                            }));
                            setCustomGroupProducts([
                              ...customGroupProducts,
                              productId,
                            ]);
                            setCustomGroupVariants((prev) => ({
                              ...prev,
                              [productId]: fetchedVariants.map(
                                (v: any) => v.variant_id,
                              ),
                            }));
                          } catch (error) {
                            console.error("Failed to load variants:", error);
                          } finally {
                            setLoadingVariants({
                              ...loadingVariants,
                              [productId]: false,
                            });
                          }
                        }
                      }}
                      placeholder="Add a product..."
                      searchable={true}
                    />

                    {customGroupProducts.length > 0 && (
                      <div className="coupon-custom-group-products">
                        {customGroupProducts.map((productId) => {
                          const product = products.find(
                            (p) => p.product_id === productId,
                          );
                          const variants = productVariantsMap[productId] || [];
                          const selectedVariants =
                            customGroupVariants[productId] || [];

                          return (
                            <div
                              key={productId}
                              className="coupon-custom-group-product"
                            >
                              <div className="coupon-custom-group-product-header">
                                <strong>{product?.name}</strong>
                                <button
                                  onClick={() => {
                                    setCustomGroupProducts(
                                      customGroupProducts.filter(
                                        (id) => id !== productId,
                                      ),
                                    );
                                    const newVariants = {
                                      ...customGroupVariants,
                                    };
                                    delete newVariants[productId];
                                    setCustomGroupVariants(newVariants);
                                  }}
                                  className="coupon-custom-group-remove"
                                >
                                  ×
                                </button>
                              </div>
                              {loadingVariants[productId] ? (
                                <div className="coupon-loading-variants">
                                  Loading variants...
                                </div>
                              ) : (
                                <div className="coupon-custom-group-variants">
                                  <label className="coupon-variant-checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={
                                        selectedVariants.length ===
                                        variants.length
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setCustomGroupVariants({
                                            ...customGroupVariants,
                                            [productId]: variants.map(
                                              (v: any) => v.variant_id,
                                            ),
                                          });
                                        } else {
                                          setCustomGroupVariants({
                                            ...customGroupVariants,
                                            [productId]: [],
                                          });
                                        }
                                      }}
                                    />
                                    <strong>Select All Variants</strong>
                                  </label>
                                  {variants.map((variant: any) => (
                                    <label
                                      key={variant.variant_id}
                                      className="coupon-variant-checkbox-label"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedVariants.includes(
                                          variant.variant_id,
                                        )}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setCustomGroupVariants({
                                              ...customGroupVariants,
                                              [productId]: [
                                                ...selectedVariants,
                                                variant.variant_id,
                                              ],
                                            });
                                          } else {
                                            setCustomGroupVariants({
                                              ...customGroupVariants,
                                              [productId]:
                                                selectedVariants.filter(
                                                  (id) =>
                                                    id !== variant.variant_id,
                                                ),
                                            });
                                          }
                                        }}
                                      />
                                      <span>
                                        {variant.color && variant.size
                                          ? `${variant.color} / ${variant.size}`
                                          : variant.color ||
                                            variant.size ||
                                            "Default"}{" "}
                                        - $
                                        {parseFloat(variant.price).toFixed(2)}{" "}
                                        (SKU: {variant.sku})
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {validationErrors.custom_group && (
                    <span className="coupon-error-message">
                      {validationErrors.custom_group}
                    </span>
                  )}
                  <small className="coupon-form-hint">
                    {customGroupProducts.length === 0
                      ? "Select at least one product to create a custom group"
                      : `${customGroupProducts.length} product${customGroupProducts.length !== 1 ? "s" : ""} selected - ${Object.values(customGroupVariants).flat().length} variant${Object.values(customGroupVariants).flat().length !== 1 ? "s" : ""} will be included`}
                  </small>
                </div>
              )}
            </div>
          )}
          {/* Step 4: Limits & Dates */}
          {modalStep === 4 && (
            <div className="coupon-wizard-step">
              <div className="coupon-form-grid-2">
                <div className="coupon-form-group">
                  <label className="coupon-form-label">Total Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usage_limit_total ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        usage_limit_total:
                          value === "" ? undefined : parseInt(value),
                      });
                    }}
                    placeholder="Unlimited"
                    min="1"
                    className="coupon-form-input"
                  />
                  <small className="coupon-form-hint">
                    Max times this coupon can be used total
                  </small>
                </div>

                <div className="coupon-form-group">
                  <label className="coupon-form-label">Per User Limit</label>
                  <input
                    type="number"
                    value={formData.usage_limit_per_user ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        usage_limit_per_user:
                          value === "" ? undefined : parseInt(value),
                      });
                    }}
                    placeholder="Unlimited"
                    min="1"
                    className="coupon-form-input"
                  />
                  <small className="coupon-form-hint">
                    Max times per customer
                  </small>
                </div>
              </div>

              <div className="coupon-form-group">
                <label className="coupon-form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requires_verified_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requires_verified_email: e.target.checked,
                      })
                    }
                  />
                  <span>Require Verified Email</span>
                </label>
              </div>

              <div className="coupon-form-grid-2">
                <div className="coupon-form-group">
                  <label className="coupon-form-label">Valid From</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valid_from: e.target.value,
                      })
                    }
                    className="coupon-form-input"
                  />
                </div>

                <div className="coupon-form-group">
                  <label className="coupon-form-label">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valid_until: e.target.value || undefined,
                      })
                    }
                    className="coupon-form-input"
                  />
                </div>
              </div>

              <div className="coupon-form-group">
                <label className="coupon-form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
          )}
          {/* Step 5: Preview */}
          {modalStep === 5 && (
            <div className="coupon-wizard-step">
              <h3 className="coupon-preview-title">Preview Coupon</h3>
              <p className="coupon-preview-description">
                Review the products that will be affected by this coupon before
                creating it.
              </p>
              <CouponPreview
                coupon={{
                  coupon_id: 0,
                  coupon_code: formData.coupon_code,
                  description: formData.description || null,
                  discount_type: formData.discount_type,
                  discount_value: formData.discount_value || null,
                  min_purchase_amount: formData.min_purchase_amount || null,
                  max_discount_amount: formData.max_discount_amount || null,
                  free_shipping: formData.free_shipping || false,
                  applies_to_type: formData.applies_to_type,
                  applies_to_id:
                    formData.applies_to_type === "custom_group"
                      ? JSON.stringify(
                          Object.values(customGroupVariants).flat(),
                        )
                      : formData.applies_to_id || null,
                  applies_to_name:
                    formData.applies_to_type === "all"
                      ? "All Products"
                      : undefined,
                  usage_count_total: 0,
                  usage_limit_total: formData.usage_limit_total || null,
                  usage_limit_per_user: formData.usage_limit_per_user || null,
                  requires_verified_email:
                    formData.requires_verified_email || false,
                  valid_from: formData.valid_from || new Date().toISOString(),
                  valid_until: formData.valid_until || null,
                  is_active:
                    formData.is_active !== undefined
                      ? formData.is_active
                      : true,
                  created_at: new Date().toISOString(),
                  bogo_buy_quantity: formData.bogo_buy_quantity,
                  bogo_get_quantity: formData.bogo_get_quantity,
                  bogo_discount_percentage: formData.bogo_discount_percentage,
                  location_ids: formData.location_ids || [],
                }}
                showCloseButton={false}
                isDraft={true}
                draftCustomGroupProducts={Object.values(
                  customGroupVariants,
                ).flat()}
              />
            </div>
          )}
        </div>

        <div className="coupon-wizard-footer">
          <button onClick={onClose} className="coupon-btn coupon-btn-secondary">
            Cancel
          </button>
          <div className="coupon-wizard-navigation">
            {modalStep > 1 && (
              <button
                onClick={() => setModalStep(modalStep - 1)}
                className="coupon-btn coupon-btn-secondary"
              >
                Back
              </button>
            )}
            {modalStep < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="coupon-btn coupon-btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="coupon-btn coupon-btn-primary"
              >
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
