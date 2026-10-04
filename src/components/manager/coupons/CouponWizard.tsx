import { useEffect, useState } from "react";
import {
  X,
  Check,
  Store,
  LayoutGrid,
  Layers,
  Package,
  Palette,
  ListChecks,
  Percent,
  Gift,
  DollarSign,
  Truck,
} from "lucide-react";
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
import { getBOGOLabel } from "../../../utils/couponUtils";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
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
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Wizard navigation
  const [modalStep, setModalStep] = useState(1);
  const TOTAL_STEPS = 5;

  // Per-step validation error messages
  const [validationErrors, setValidationErrors] =
    useState<CouponValidationErrors>({});

  // Variant data for the custom group builder — keyed by product ID
  const [productVariantsMap, setProductVariantsMap] = useState<{
    [productId: number]: any[];
  }>({});

  // Tracks which products are currently fetching their variants in the custom group builder
  const [loadingVariants, setLoadingVariants] = useState<{
    [productId: number]: boolean;
  }>({});

  // All existing coupon codes — used to detect duplicates during Step 1 validation
  const [existingCouponCodes, setExistingCouponCodes] = useState<string[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Loads all existing coupon codes on mount for duplicate detection in Step 1
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

  // Seeds the local variant map when editing an existing coupon that has pre-fetched variants
  useEffect(() => {
    if (Object.keys(initialProductVariantsMap).length > 0) {
      setProductVariantsMap(initialProductVariantsMap);
    }
  }, [initialProductVariantsMap]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Validates the current step and advances to the next if no errors are found
  const handleNext = () => {
    let errors: CouponValidationErrors = {};

    if (modalStep === 1) {
      errors = validateStep1(formData, existingCouponCodes, !!editingCoupon);
    } else if (modalStep === 2) {
      errors = validateStep2(formData, customGroupProducts);
    } else if (modalStep === 3) {
      errors = validateStep3(formData);
    } else if (modalStep === 4) {
      errors = validateStep4(formData);
    }
    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setModalStep(modalStep + 1);
    }
  };

  // Submits the form and resets the wizard back to Step 1
  const handleSubmit = () => {
    onSubmit();
    setModalStep(1);
  };

  // Jumps back to an earlier, already-completed step (no validation needed going back)
  const handleStepClick = (step: number) => {
    if (step < modalStep) {
      setModalStep(step);
    }
  };

  // Changes the coupon scope; resets all secondary scope state and any discount type the new scope can't use
  const handleScopeChange = (value: string | number) => {
    const newType = value as any;

    const discountBecomesInvalid =
      !!editingCoupon &&
      newType !== "all" &&
      (formData.discount_type === "fixed" ||
        formData.discount_type === "free_shipping_only");

    setFormData({
      ...formData,
      applies_to_type: newType,
      applies_to_id: undefined,
      ...(discountBecomesInvalid
        ? {
            discount_type: "" as any,
            discount_value: undefined,
          }
        : {}),
    });

    // Reset all secondary scope state when the type changes
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
  };

  // Changes the discount type and resets every discount-related field
  const handleDiscountTypeChange = (value: string | number) => {
    const newType = value as any;
    // Reset all discount-related fields when the type changes
    const updates: any = {
      discount_type: newType,
      discount_value: undefined,
      min_purchase_amount: undefined,
      max_discount_amount: undefined,
      bogo_buy_quantity: newType === "bogo" ? 1 : undefined,
      bogo_get_quantity: newType === "bogo" ? 1 : undefined,
      bogo_discount_percentage: newType === "bogo" ? 50 : undefined,
      free_shipping: newType === "free_shipping_only",
    };
    setFormData({ ...formData, ...updates });
    if (validationErrors.discount_type) {
      setValidationErrors({
        ...validationErrors,
        discount_type: undefined,
      });
    }
  };

  // Adds a product to the custom group: fetches its variants and selects all of them by default
  const handleAddGroupProduct = async (value: string | number) => {
    const productId = value ? Number(value) : null;
    if (productId && !customGroupProducts.includes(productId)) {
      setLoadingVariants({
        ...loadingVariants,
        [productId]: true,
      });
      try {
        // Fetch variants and default-select all of them
        const fetchedVariants = await loadVariantsForCustomGroup(productId);
        setProductVariantsMap((prev) => ({
          ...prev,
          [productId]: fetchedVariants,
        }));
        setCustomGroupProducts([...customGroupProducts, productId]);
        setCustomGroupVariants((prev) => ({
          ...prev,
          [productId]: fetchedVariants.map((v: any) => v.variant_id),
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
  };

  // Removes a product from the custom group along with its variant selections
  const handleRemoveGroupProduct = (productId: number) => {
    setCustomGroupProducts(customGroupProducts.filter((id) => id !== productId));
    // Also remove its variant selections from the map
    const newVariants = {
      ...customGroupVariants,
    };
    delete newVariants[productId];
    setCustomGroupVariants(newVariants);
  };

  // ============================================================================
  // STATIC CONFIG + DISPLAY HELPERS
  // ============================================================================

  const STEPS = [
    {
      label: "Basic Info",
      desc: "Where the coupon is valid and the code customers will enter.",
    },
    { label: "Apply To", desc: "Choose what this coupon discounts." },
    { label: "Discount Details", desc: "Set how much customers save." },
    {
      label: "Limits & Dates",
      desc: "Control how often and when the coupon can be used.",
    },
    {
      label: "Preview",
      desc: editingCoupon
        ? "Review the products this coupon affects before updating it."
        : "Review the products this coupon affects before creating it.",
    },
  ];

  const SCOPE_OPTIONS = [
    {
      value: "all",
      title: "All Products",
      desc: "Store-wide, every product",
      icon: Store,
    },
    {
      value: "category",
      title: "Specific Category",
      desc: "Everything in one category",
      icon: LayoutGrid,
    },
    {
      value: "product_type",
      title: "Specific Product Type",
      desc: "All products of one type",
      icon: Layers,
    },
    {
      value: "product",
      title: "Specific Product",
      desc: "One product and its variants",
      icon: Package,
    },
    {
      value: "variant",
      title: "Specific Variant",
      desc: "A single color or size option",
      icon: Palette,
    },
    {
      value: "custom_group",
      title: "Custom Product Group",
      desc: "Hand-pick products and variants",
      icon: ListChecks,
    },
  ];

  // Fixed amount and free shipping can only be used on store-wide coupons
  const isStoreWide = formData.applies_to_type === "all";
  const DISCOUNT_OPTIONS = [
    {
      value: "percentage",
      title: "Percentage Off",
      desc: "Take a percent off",
      icon: Percent,
      storeWideOnly: false,
    },
    {
      value: "bogo",
      title: "Buy One Get One",
      desc: "Buy some, get some discounted",
      icon: Gift,
      storeWideOnly: false,
    },
    {
      value: "fixed",
      title: "Fixed Amount Off",
      desc: "Take a set dollar amount off",
      icon: DollarSign,
      storeWideOnly: true,
    },
    {
      value: "free_shipping_only",
      title: "Free Shipping",
      desc: "Waive shipping, no price cut",
      icon: Truck,
      storeWideOnly: true,
    },
  ];

  // "2026-01-31" -> a readable local date (parsed as local midnight to avoid timezone shifts)
  const formatReviewDate = (date?: string) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString() : "";

  // Names of the stores this coupon covers, for the review summary
  const getStoreSummary = () => {
    const ids = formData.location_ids || [];
    if (ids.length === 0) return "-";
    if (locations.length >= 2 && ids.length === locations.length) {
      return "All stores";
    }
    return (
      locations
        .filter((loc) => ids.includes(loc.location_id))
        .map((loc) => loc.location_name)
        .join(", ") || "-"
    );
  };

  // Summary of the usage caps for the review summary
  const getLimitsSummary = () => {
    const parts: string[] = [];
    if (formData.usage_limit_total) {
      parts.push(`${formData.usage_limit_total} total`);
    }
    if (formData.usage_limit_per_user) {
      parts.push(`${formData.usage_limit_per_user} per customer`);
    }
    return parts.length > 0 ? parts.join(" · ") : "Unlimited";
  };

  // Renders a scope-picker error / secondary-picker error under a field
  const renderError = (message?: string) =>
    message ? <span className="coupon-error">{message}</span> : null;

  // Small helper that clears one validation error as soon as its field is edited
  const clearError = (field: keyof CouponValidationErrors) => {
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: undefined,
      });
    }
  };

  // ============================================================================
  // STEP RENDERERS
  // ============================================================================

  // Step 1: store location, coupon code, internal description
  const renderStep1 = () => (
    <div className="coupon-wizard-grid">
      {/* Store location */}
      <div className="coupon-field coupon-field--full">
        <label className="coupon-label" htmlFor="cw-location">
          Store Location <span className="coupon-required">*</span>
        </label>
        <CustomSelect
          id="cw-location"
          options={[
            ...locations.map((loc) => ({
              value: loc.location_id,
              label: `${loc.location_name} (${loc.city}, ${loc.state})`,
            })),
            // "All Stores" option only available when there are 2 or more locations
            ...(locations.length >= 2
              ? [{ value: "all", label: "All Stores" }]
              : []),
          ]}
          value={
            locations.length >= 2 &&
            formData.location_ids?.length === locations.length
              ? "all"
              : formData.location_ids?.[0] || ""
          }
          onChange={(value) => {
            let newLocationIds: number[];

            if (value === "all") {
              newLocationIds = locations.map((loc) => loc.location_id);
            } else {
              newLocationIds = [value as number];
            }

            setFormData({
              ...formData,
              location_ids: newLocationIds,
            });

            clearError("location_ids");
          }}
          placeholder="--Select--"
          searchable={false}
          className={validationErrors.location_ids ? "coupon-input-error" : ""}
        />
        {renderError(validationErrors.location_ids)}
        <span className="coupon-hint">Select which store location(s)</span>
      </div>

      {/* Coupon code */}
      <div className="coupon-field coupon-field--full">
        <label className="coupon-label" htmlFor="cw-code">
          Coupon Code <span className="coupon-required">*</span>
        </label>
        <input
          id="cw-code"
          type="text"
          value={formData.coupon_code}
          onChange={(e) => {
            setFormData({
              ...formData,
              coupon_code: e.target.value.toUpperCase(),
            });
            clearError("coupon_code");
          }}
          placeholder="e.g., SAVE20"
          disabled={!!editingCoupon}
          className={`coupon-input coupon-input--code ${validationErrors.coupon_code ? "coupon-input-error" : ""}`}
        />
        {renderError(validationErrors.coupon_code)}
        {editingCoupon && (
          <span className="coupon-hint">
            The code can't be changed after a coupon is created.
          </span>
        )}
      </div>

      {/* Internal description */}
      <div className="coupon-field coupon-field--full">
        <label className="coupon-label" htmlFor="cw-description">
          Description
        </label>
        <textarea
          id="cw-description"
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
            })
          }
          placeholder="Internal description for tracking"
          rows={3}
          className="coupon-textarea"
        />
        <span className="coupon-hint">Only visible to managers.</span>
      </div>
    </div>
  );

  // Picker used by the category / product type / product scopes
  const renderSimplePicker = (
    label: string,
    placeholder: string,
    options: { value: string | number; label: string }[],
  ) => (
    <div className="coupon-field coupon-field--full">
      <label className="coupon-label" htmlFor="cw-scope-target">
        {label} <span className="coupon-required">*</span>
      </label>
      <CustomSelect
        id="cw-scope-target"
        options={[{ value: "", label: placeholder }, ...options]}
        value={formData.applies_to_id ?? ""}
        onChange={(value) => {
          setFormData({
            ...formData,
            applies_to_id: value ? Number(value) : undefined,
          });
          clearError("applies_to_id");
        }}
        placeholder={placeholder}
        searchable={true}
        className={validationErrors.applies_to_id ? "coupon-input-error" : ""}
      />
      {renderError(validationErrors.applies_to_id)}
    </div>
  );

  // Step 2: scope cards + the secondary picker for the chosen scope
  const renderStep2 = () => (
    <>
      {/* Scope selector */}
      <div className="coupon-field">
        <span className="coupon-label" id="cw-scope-label">
          This coupon applies to <span className="coupon-required">*</span>
        </span>
        <div
          className="coupon-option-grid"
          role="radiogroup"
          aria-labelledby="cw-scope-label"
        >
          {SCOPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <label key={option.value} className="coupon-option">
                <input
                  type="radio"
                  name="coupon-scope"
                  className="coupon-option-input"
                  value={option.value}
                  checked={formData.applies_to_type === option.value}
                  onChange={() => handleScopeChange(option.value)}
                />
                <span className="coupon-option-card">
                  <span className="coupon-option-icon" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  <span className="coupon-option-text">
                    <span className="coupon-option-title">{option.title}</span>
                    <span className="coupon-option-desc">{option.desc}</span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {renderError(validationErrors.applies_to_type)}
      </div>

      {/* Category picker */}
      {formData.applies_to_type === "category" && (
        <div className="coupon-detail-panel">
          {renderSimplePicker(
            "Select Category",
            "Choose a category...",
            categories.map((cat) => ({
              value: cat.category_id,
              label: cat.category_name,
            })),
          )}
        </div>
      )}

      {/* Product type picker */}
      {formData.applies_to_type === "product_type" && (
        <div className="coupon-detail-panel">
          {renderSimplePicker(
            "Select Product Type",
            "Choose a product type...",
            productTypes.map((type) => ({
              value: type.product_type_id,
              label: type.type_name,
            })),
          )}
        </div>
      )}

      {/* Product picker */}
      {formData.applies_to_type === "product" && (
        <div className="coupon-detail-panel">
          {renderSimplePicker(
            "Select Product",
            "Choose a product...",
            products.map((product) => ({
              value: product.product_id,
              label: product.name,
            })),
          )}
        </div>
      )}

      {/* Variant picker */}
      {formData.applies_to_type === "variant" && (
        <div className="coupon-detail-panel">
          <div className="coupon-field coupon-field--full">
            <label className="coupon-label" htmlFor="cw-variant-product">
              First, Select Product <span className="coupon-required">*</span>
            </label>
            <CustomSelect
              id="cw-variant-product"
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
                // Clear the variant selection when the parent product changes
                setFormData({ ...formData, applies_to_id: undefined });
              }}
              placeholder="Choose a product..."
              searchable={true}
            />
          </div>

          {/* Variant selector — only shown after a product has been selected */}
          {selectedProductForVariant && (
            <div className="coupon-field coupon-field--full">
              <label className="coupon-label" htmlFor="cw-variant">
                Then, Select Variant <span className="coupon-required">*</span>
              </label>
              <CustomSelect
                id="cw-variant"
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
                  clearError("applies_to_id");
                }}
                placeholder="Choose a variant..."
                searchable={true}
                className={
                  validationErrors.applies_to_id ? "coupon-input-error" : ""
                }
              />
              {renderError(validationErrors.applies_to_id)}
            </div>
          )}
        </div>
      )}

      {/* Custom group builder */}
      {formData.applies_to_type === "custom_group" && (
        <div className="coupon-detail-panel">
          <div className="coupon-field coupon-field--full">
            <label className="coupon-label" htmlFor="cw-group-add">
              Build Custom Product Group{" "}
              <span className="coupon-required">*</span>
            </label>
            <div className="coupon-custom-group-builder">
              {/* Product adder — only shows products not already in the group */}
              <CustomSelect
                id="cw-group-add"
                options={[
                  { value: "", label: "Add a product..." },
                  ...products
                    .filter((p) => !customGroupProducts.includes(p.product_id))
                    .map((product) => ({
                      value: product.product_id,
                      label: product.name,
                    })),
                ]}
                value=""
                onChange={handleAddGroupProduct}
                placeholder="Add a product..."
                searchable={true}
              />

              {/* Selected products list — each shows its variants with per-variant checkboxes */}
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
                        {/* Product header — name, selected count and remove button */}
                        <div className="coupon-custom-group-product-header">
                          <span className="coupon-custom-group-product-name">
                            {product?.name}
                          </span>
                          <div className="coupon-custom-group-product-meta">
                            {!loadingVariants[productId] && (
                              <span className="coupon-custom-group-count">
                                {selectedVariants.length} of {variants.length}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveGroupProduct(productId)}
                              className="coupon-custom-group-remove"
                              aria-label={`Remove ${product?.name ?? "product"} from group`}
                              title="Remove product"
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {loadingVariants[productId] ? (
                          <div className="coupon-loading-variants">
                            Loading variants...
                          </div>
                        ) : (
                          <div className="coupon-custom-group-variants">
                            {/* Select All toggle — checks or clears all variants for this product */}
                            <label className="coupon-variant-checkbox-label coupon-variant-checkbox-label--all">
                              <input
                                type="checkbox"
                                checked={selectedVariants.length === variants.length}
                                onChange={(e) => {
                                  setCustomGroupVariants({
                                    ...customGroupVariants,
                                    [productId]: e.target.checked
                                      ? variants.map((v: any) => v.variant_id)
                                      : [],
                                  });
                                }}
                              />
                              <span>Select All Variants</span>
                            </label>

                            {/* Individual variant checkboxes */}
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
                                    setCustomGroupVariants({
                                      ...customGroupVariants,
                                      [productId]: e.target.checked
                                        ? [...selectedVariants, variant.variant_id]
                                        : selectedVariants.filter(
                                            (id) => id !== variant.variant_id,
                                          ),
                                    });
                                  }}
                                />
                                <span>
                                  {variant.color && variant.size
                                    ? `${variant.color} / ${variant.size}`
                                    : variant.color || variant.size || "Default"}{" "}
                                  - ${parseFloat(variant.price).toFixed(2)}{" "}
                                  <span className="coupon-variant-sku">
                                    SKU: {variant.sku}
                                  </span>
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
            {renderError(validationErrors.custom_group)}
            {/* Summary updates dynamically to show a running product and variant count */}
            <span className="coupon-group-summary">
              {customGroupProducts.length === 0
                ? "Select at least one product to create a custom group"
                : `${customGroupProducts.length} product${customGroupProducts.length !== 1 ? "s" : ""} selected - ${Object.values(customGroupVariants).flat().length} variant${Object.values(customGroupVariants).flat().length !== 1 ? "s" : ""} will be included`}
            </span>
          </div>
        </div>
      )}
    </>
  );

  // Step 3: discount type cards + the fields for the chosen type
  const renderStep3 = () => (
    <>
      {/* Discount type selector */}
      <div className="coupon-field">
        <span className="coupon-label" id="cw-discount-label">
          Discount Type <span className="coupon-required">*</span>
        </span>
        <div
          className="coupon-option-grid"
          role="radiogroup"
          aria-labelledby="cw-discount-label"
        >
          {DISCOUNT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isDisabled = option.storeWideOnly && !isStoreWide;
            return (
              <label
                key={option.value}
                className={`coupon-option${isDisabled ? " coupon-option--disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="coupon-discount-type"
                  className="coupon-option-input"
                  value={option.value}
                  checked={formData.discount_type === option.value}
                  disabled={isDisabled}
                  onChange={() => handleDiscountTypeChange(option.value)}
                />
                <span className="coupon-option-card">
                  <span className="coupon-option-icon" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  <span className="coupon-option-text">
                    <span className="coupon-option-title">{option.title}</span>
                    <span className="coupon-option-desc">
                      {isDisabled ? "Only for All Products coupons" : option.desc}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {renderError(validationErrors.discount_type)}
      </div>

      {/* No type selected */}
      {!formData.discount_type ? (
        <div className="coupon-callout coupon-callout--warning">
          <strong>Please Select a Discount Type</strong>
          <p>
            Choose one of the discount types above to continue creating your
            coupon.
          </p>
        </div>
      ) : /* BOGO — buy/get quantities and the discount percentage for the "get" items */
      formData.discount_type === "bogo" ? (
        <>
          <div className="coupon-wizard-grid">
            <div className="coupon-field coupon-field--third">
              <label className="coupon-label" htmlFor="cw-bogo-buy">
                Buy Quantity <span className="coupon-required">*</span>
              </label>
              <input
                id="cw-bogo-buy"
                type="number"
                value={formData.bogo_buy_quantity ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    bogo_buy_quantity: value === "" ? undefined : parseInt(value),
                  });
                  clearError("bogo_buy_quantity");
                }}
                min="1"
                placeholder="1"
                className={`coupon-input ${validationErrors.bogo_buy_quantity ? "coupon-input-error" : ""}`}
              />
              {renderError(validationErrors.bogo_buy_quantity)}
            </div>

            <div className="coupon-field coupon-field--third">
              <label className="coupon-label" htmlFor="cw-bogo-get">
                Get Quantity <span className="coupon-required">*</span>
              </label>
              <input
                id="cw-bogo-get"
                type="number"
                value={formData.bogo_get_quantity ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    bogo_get_quantity: value === "" ? undefined : parseInt(value),
                  });
                  clearError("bogo_get_quantity");
                }}
                min="1"
                placeholder="1"
                className={`coupon-input ${validationErrors.bogo_get_quantity ? "coupon-input-error" : ""}`}
              />
              {renderError(validationErrors.bogo_get_quantity)}
            </div>

            <div className="coupon-field coupon-field--third">
              <label className="coupon-label" htmlFor="cw-bogo-pct">
                Discount % <span className="coupon-required">*</span>
              </label>
              <input
                id="cw-bogo-pct"
                type="number"
                value={formData.bogo_discount_percentage ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    bogo_discount_percentage:
                      value === "" ? undefined : parseInt(value),
                  });
                  clearError("bogo_discount_percentage");
                }}
                min="1"
                max="100"
                placeholder="50"
                className={`coupon-input ${validationErrors.bogo_discount_percentage ? "coupon-input-error" : ""}`}
              />
              {renderError(validationErrors.bogo_discount_percentage)}
              <span className="coupon-hint">1–100% (100 = Free)</span>
            </div>
          </div>

          {/* Live BOGO label preview */}
          <div className="coupon-bogo-preview">
            <span>Customers will see:</span>
            <span className="coupon-discount-chip coupon-discount-chip--bogo">
              {getBOGOLabel(
                formData.bogo_buy_quantity,
                formData.bogo_get_quantity,
                formData.bogo_discount_percentage,
              )}
            </span>
          </div>
        </>
      ) : /* Free Shipping Only — no price reduction, but requires a minimum purchase */
      formData.discount_type === "free_shipping_only" ? (
        <>
          <div className="coupon-callout coupon-callout--info">
            <strong>Free Shipping Only</strong>
            <p>
              This coupon will provide free shipping without any additional
              discount. You must set a minimum purchase amount below.
            </p>
          </div>

          <div className="coupon-field">
            <label className="coupon-label" htmlFor="cw-min-purchase">
              Minimum Purchase Amount <span className="coupon-required">*</span>
            </label>
            <div
              className={`coupon-input-group ${validationErrors.min_purchase_amount ? "coupon-input-error" : ""}`}
            >
              <span className="coupon-input-affix coupon-input-affix--prefix">
                $
              </span>
              <input
                id="cw-min-purchase"
                type="number"
                value={formData.min_purchase_amount ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    min_purchase_amount:
                      value === "" ? undefined : parseFloat(value),
                  });
                  clearError("min_purchase_amount");
                }}
                placeholder="e.g., 50.00"
                step="0.01"
                min="0"
                className="coupon-input"
              />
            </div>
            {renderError(validationErrors.min_purchase_amount)}
            <span className="coupon-hint">
              Free shipping will only apply if order total meets or exceeds this
              amount
            </span>
          </div>
        </>
      ) : (
        /* Percentage / Fixed — discount value, optional min purchase, and optional max cap */
        <div className="coupon-wizard-grid">
          <div className="coupon-field coupon-field--third">
            <label className="coupon-label" htmlFor="cw-discount-value">
              Discount Value <span className="coupon-required">*</span>
            </label>
            <div
              className={`coupon-input-group ${validationErrors.discount_value ? "coupon-input-error" : ""}`}
            >
              {formData.discount_type === "fixed" && (
                <span className="coupon-input-affix coupon-input-affix--prefix">
                  $
                </span>
              )}
              <input
                id="cw-discount-value"
                type="number"
                value={formData.discount_value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    discount_value: value === "" ? undefined : parseFloat(value),
                  });
                  clearError("discount_value");
                }}
                placeholder={formData.discount_type === "percentage" ? "10" : "5.00"}
                step={formData.discount_type === "fixed" ? "0.01" : "1"}
                min="0"
                max={formData.discount_type === "percentage" ? "100" : undefined}
                className="coupon-input"
              />
              {formData.discount_type === "percentage" && (
                <span className="coupon-input-affix coupon-input-affix--suffix">
                  %
                </span>
              )}
            </div>
            {renderError(validationErrors.discount_value)}
          </div>

          {/* Min purchase — required for fixed discounts, optional for percentage */}
          <div className="coupon-field coupon-field--third">
            <label className="coupon-label" htmlFor="cw-min-purchase">
              Minimum Purchase
              {formData.discount_type === "fixed" && (
                <>
                  {" "}
                  <span className="coupon-required">*</span>
                </>
              )}
            </label>
            <div
              className={`coupon-input-group ${validationErrors.min_purchase_amount ? "coupon-input-error" : ""}`}
            >
              <span className="coupon-input-affix coupon-input-affix--prefix">
                $
              </span>
              <input
                id="cw-min-purchase"
                type="number"
                value={formData.min_purchase_amount ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    min_purchase_amount:
                      value === "" ? undefined : parseFloat(value),
                  });
                  clearError("min_purchase_amount");
                }}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="coupon-input"
              />
            </div>
            {renderError(validationErrors.min_purchase_amount)}
            {/* Hint for fixed discounts — enforces the 5× minimum rule */}
            {formData.discount_type === "fixed" && formData.discount_value && (
              <span className="coupon-hint">
                Required: Minimum ${(formData.discount_value * 5).toFixed(2)}{" "}
                (5× discount amount)
              </span>
            )}
          </div>

          {/* Max discount cap — optional; useful for percentage-off coupons */}
          <div className="coupon-field coupon-field--third">
            <label className="coupon-label" htmlFor="cw-max-discount">
              Maximum Discount
            </label>
            <div className="coupon-input-group">
              <span className="coupon-input-affix coupon-input-affix--prefix">
                $
              </span>
              <input
                id="cw-max-discount"
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
                className="coupon-input"
              />
            </div>
            <span className="coupon-hint">Cap total discount (useful for % off)</span>
          </div>
        </div>
      )}
    </>
  );

  // Step 4: usage caps, validity dates and the two toggles
  const renderStep4 = () => (
    <>
      <div className="coupon-wizard-grid">
        {/* Total usage cap — blank means unlimited redemptions */}
        <div className="coupon-field">
          <label className="coupon-label" htmlFor="cw-limit-total">
            Total Usage Limit
          </label>
          <input
            id="cw-limit-total"
            type="number"
            value={formData.usage_limit_total ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                usage_limit_total: value === "" ? undefined : parseInt(value),
              });
            }}
            placeholder="Unlimited"
            min="1"
            className="coupon-input"
          />
          <span className="coupon-hint">
            Max times this coupon can be used total
          </span>
        </div>

        {/* Per-user cap — blank means unlimited uses per customer */}
        <div className="coupon-field">
          <label className="coupon-label" htmlFor="cw-limit-user">
            Per User Limit
          </label>
          <input
            id="cw-limit-user"
            type="number"
            value={formData.usage_limit_per_user ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                usage_limit_per_user: value === "" ? undefined : parseInt(value),
              });
            }}
            placeholder="Unlimited"
            min="1"
            className="coupon-input"
          />
          <span className="coupon-hint">Max times per customer</span>
        </div>

        {/* Valid from date */}
        <div className="coupon-field">
          <label className="coupon-label" htmlFor="cw-valid-from">
            Valid From
          </label>
          <input
            id="cw-valid-from"
            type="date"
            value={formData.valid_from}
            onChange={(e) =>
              setFormData({ ...formData, valid_from: e.target.value })
            }
            className="coupon-input"
          />
          {renderError(validationErrors.valid_from)}
        </div>

        {/* Valid until date — optional */}
        <div className="coupon-field">
          <label className="coupon-label" htmlFor="cw-valid-until">
            Valid Until
          </label>
          <input
            id="cw-valid-until"
            type="date"
            value={formData.valid_until || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                valid_until: e.target.value || undefined,
              })
            }
            className="coupon-input"
          />
          <span className="coupon-hint">Leave blank for no expiry</span>
        </div>
      </div>

      <div className="coupon-switch-card">
        {/* Requires verified email — prevents anonymous or unverified redemptions */}
        <label className="coupon-switch">
          <span className="coupon-switch-text">
            <span className="coupon-switch-label">Require Verified Email</span>
            <span className="coupon-switch-hint">
              Only customers with a verified email can use this coupon.
            </span>
          </span>
          <input
            type="checkbox"
            className="coupon-switch-input"
            checked={formData.requires_verified_email}
            onChange={(e) =>
              setFormData({
                ...formData,
                requires_verified_email: e.target.checked,
              })
            }
          />
          <span className="coupon-switch-track" aria-hidden="true" />
        </label>

        {/* Active toggle */}
        <label className="coupon-switch">
          <span className="coupon-switch-text">
            <span className="coupon-switch-label">Active</span>
            <span className="coupon-switch-hint">
              Inactive coupons can't be redeemed.
            </span>
          </span>
          <input
            type="checkbox"
            className="coupon-switch-input"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
          />
          <span className="coupon-switch-track" aria-hidden="true" />
        </label>
      </div>
    </>
  );

  // Step 5: summary of the settings + the affected-products preview
  const renderStep5 = () => (
    <>
      <dl className="coupon-review">
        <div className="coupon-review-item">
          <dt>Code</dt>
          <dd>
            <code className="coupon-code-display">{formData.coupon_code}</code>
          </dd>
        </div>
        <div className="coupon-review-item">
          <dt>Store</dt>
          <dd>{getStoreSummary()}</dd>
        </div>
        <div className="coupon-review-item">
          <dt>Valid</dt>
          <dd>
            {formData.valid_from
              ? formatReviewDate(formData.valid_from)
              : "Starts immediately"}
            {" – "}
            {formData.valid_until
              ? formatReviewDate(formData.valid_until)
              : "No expiry"}
          </dd>
        </div>
        <div className="coupon-review-item">
          <dt>Usage limits</dt>
          <dd>{getLimitsSummary()}</dd>
        </div>
        <div className="coupon-review-item">
          <dt>Verified email</dt>
          <dd>{formData.requires_verified_email ? "Required" : "Not required"}</dd>
        </div>
        <div className="coupon-review-item">
          <dt>Status</dt>
          <dd>{formData.is_active ? "Active" : "Inactive"}</dd>
        </div>
      </dl>

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
              ? JSON.stringify(Object.values(customGroupVariants).flat())
              : formData.applies_to_id || null,
          applies_to_name:
            formData.applies_to_type === "all" ? "All Products" : undefined,
          usage_count_total: 0,
          usage_limit_total: formData.usage_limit_total || null,
          usage_limit_per_user: formData.usage_limit_per_user || null,
          requires_verified_email: formData.requires_verified_email || false,
          valid_from: formData.valid_from || new Date().toISOString(),
          valid_until: formData.valid_until || null,
          is_active:
            formData.is_active !== undefined ? formData.is_active : true,
          created_at: new Date().toISOString(),
          bogo_buy_quantity: formData.bogo_buy_quantity,
          bogo_get_quantity: formData.bogo_get_quantity,
          bogo_discount_percentage: formData.bogo_discount_percentage,
          location_ids: formData.location_ids || [],
        }}
        showCloseButton={false}
        isDraft={true}
        draftCustomGroupProducts={Object.values(customGroupVariants).flat()}
      />
    </>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    // Not closed by clicking the backdrop on purpose — it would discard the form
    <div className="coupon-wizard-overlay">
      <div
        className="coupon-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-wizard-title"
      >
        {/* Wizard header */}
        <div className="coupon-wizard-header">
          <div className="coupon-wizard-header-top">
            <div>
              <p className="coupon-wizard-eyebrow">Coupons</p>
              <h2 id="coupon-wizard-title" className="coupon-wizard-title">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
            </div>
            <button
              type="button"
              className="coupon-wizard-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper — completed steps can be clicked to go back */}
          <ol className="coupon-wizard-steps">
            {STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = modalStep === stepNumber;
              const isCompleted = modalStep > stepNumber;
              return (
                <li
                  key={step.label}
                  className={`${isActive ? "coupon-step-active" : ""} ${isCompleted ? "coupon-step-completed" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  <button
                    type="button"
                    className="coupon-step-button"
                    disabled={!isCompleted}
                    onClick={() => handleStepClick(stepNumber)}
                  >
                    <span className="coupon-step-number">
                      {isCompleted ? (
                        <Check size={14} aria-hidden="true" />
                      ) : (
                        stepNumber
                      )}
                    </span>
                    <span className="coupon-step-label">{step.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ================================================================== */}
        {/* STEP CONTENT                                                        */}
        {/* ================================================================== */}

        <div className="coupon-wizard-body">
          <div className="coupon-wizard-step">
            <div className="coupon-wizard-step-head">
              <h3 className="coupon-wizard-step-title">
                {STEPS[modalStep - 1].label}
              </h3>
              <p className="coupon-wizard-step-desc">
                {STEPS[modalStep - 1].desc}
              </p>
            </div>

            {modalStep === 1 && renderStep1()}
            {modalStep === 2 && renderStep2()}
            {modalStep === 3 && renderStep3()}
            {modalStep === 4 && renderStep4()}
            {modalStep === 5 && renderStep5()}
          </div>
        </div>

        <div className="coupon-wizard-footer">
          <button
            type="button"
            onClick={onClose}
            className="coupons-btn coupons-btn--secondary"
          >
            Cancel
          </button>
          <div className="coupon-wizard-navigation">
            <span className="coupon-wizard-counter">
              Step {modalStep} of {TOTAL_STEPS}
            </span>
            {/* Back button */}
            {modalStep > 1 && (
              <button
                type="button"
                onClick={() => setModalStep(modalStep - 1)}
                className="coupons-btn coupons-btn--secondary"
              >
                Back
              </button>
            )}
            {/* Next advances through steps */}
            {modalStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="coupons-btn coupons-btn--primary"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="coupons-btn coupons-btn--primary"
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
