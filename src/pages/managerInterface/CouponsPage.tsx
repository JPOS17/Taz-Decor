import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  fetchCategoriesForCoupons,
  fetchProductTypesForCoupons,
  fetchProductsForCoupons,
  fetchVariantById,
  fetchVariantsForProduct,
  fetchLocationsForCoupons,
  type Coupon,
  type CreateCouponPayload,
  type CategoryOption,
  type ProductTypeOption,
  type ProductOption,
  type LocationOption,
  fetchCouponById,
} from "../../api/couponManagement";

import { CouponFilters } from "../../components/managerInterface/coupons/CouponFilters";
import { CouponsTable } from "../../components/managerInterface/coupons/CouponsTable";
import { CouponWizard } from "../../components/managerInterface/coupons/CouponWizard";
import { CouponPreview } from "../../components/managerInterface/coupons/CouponPreview";
import ConfirmationModal from "../../components/managerInterface/universal/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";

import "../../styles/pages/managerInterface/Tokens.css";
import "../../styles/pages/managerInterface/Components.css";
import "../../styles/pages/managerInterface/ManagerShared.css";
import "../../styles/pages/managerInterface/CouponsPage.css";

const CouponsPage = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Coupon data
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [appliesToFilter, setAppliesToFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCoupon, setPreviewCoupon] = useState<Coupon | null>(null);

  // Dropdown data
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  // Variant / custom group state
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<
    number | null
  >(null);
  const [customGroupProducts, setCustomGroupProducts] = useState<number[]>([]);
  const [customGroupVariants, setCustomGroupVariants] = useState<{
    [productId: number]: number[];
  }>({});
  const [initialProductVariantsMap, setInitialProductVariantsMap] = useState<{
    [productId: number]: any[];
  }>({});

  // Form state
  const [formData, setFormData] = useState<CreateCouponPayload>({
    coupon_code: "",
    description: "",
    discount_type: "" as any,
    discount_value: undefined,
    min_purchase_amount: undefined,
    max_discount_amount: undefined,
    free_shipping: false,
    applies_to_type: "" as any,
    applies_to_id: undefined,
    usage_limit_total: undefined,
    usage_limit_per_user: undefined,
    requires_verified_email: true,
    valid_from: "",
    valid_until: undefined,
    is_active: true,
    bogo_buy_quantity: undefined,
    bogo_get_quantity: undefined,
    bogo_discount_percentage: undefined,
    location_ids: [],
  });

  // Confirmation modal
  const deleteConfirmation = useConfirmationModal();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Dropdown data is static reference so it only needs to be fetched once on mount
  useEffect(() => {
    loadDropdownData();
  }, []);

  // Debounced 400ms so typing in the search box doesn't fire a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoupons();
    }, 400);
    return () => clearTimeout(timer);
  }, [statusFilter, appliesToFilter, searchQuery, locationFilter]);

  // Fetches the filtered coupon list from the API
  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await fetchCoupons(
        statusFilter === "all" ? null : statusFilter,
        appliesToFilter === "all" ? null : appliesToFilter,
        searchQuery || null,
        locationFilter === "all" ? null : locationFilter,
      );
      setCoupons(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  // Fetches all dropdown option data (categories, product types, products, locations) in parallel
  const loadDropdownData = async () => {
    try {
      const [categoriesData, productTypesData, productsData, locationsData] =
        await Promise.all([
          fetchCategoriesForCoupons(),
          fetchProductTypesForCoupons(),
          fetchProductsForCoupons(),
          fetchLocationsForCoupons(),
        ]);
      setCategories(categoriesData);
      setProductTypes(productTypesData);
      setProducts(productsData);
      setLocations(locationsData);
    } catch (err) {
      console.error("Failed to load dropdown data:", err);
    }
  };

  // Fetches and sets the variants for a single product (used by the variant coupon type selector)
  const loadVariantsForProduct = async (productId: number) => {
    try {
      const variantsData = await fetchVariantsForProduct(productId);
      setVariants(variantsData);
    } catch (err) {
      console.error("Failed to load variants:", err);
      setVariants([]);
    }
  };

  // Fetches and returns variants for a product without setting global state (used by custom group builder)
  const loadVariantsForCustomGroup = async (productId: number) => {
    try {
      return await fetchVariantsForProduct(productId);
    } catch (err) {
      console.error("Failed to load variants:", err);
      return [];
    }
  };

  // ============================================================================
  // FORM HELPERS
  // ============================================================================

  // Resets all form fields and custom group state back to their blank defaults
  const resetForm = () => {
    setFormData({
      coupon_code: "",
      description: "",
      discount_type: "" as any,
      discount_value: undefined,
      min_purchase_amount: undefined,
      max_discount_amount: undefined,
      free_shipping: false,
      applies_to_type: "" as any,
      applies_to_id: undefined,
      usage_limit_total: undefined,
      usage_limit_per_user: undefined,
      requires_verified_email: true,
      valid_from: "",
      valid_until: undefined,
      is_active: true,
      bogo_buy_quantity: undefined,
      bogo_get_quantity: undefined,
      bogo_discount_percentage: undefined,
      location_ids: [],
    });
    setCustomGroupProducts([]);
    setCustomGroupVariants({});
    setInitialProductVariantsMap({});
    setSelectedProductForVariant(null);
  };

  // Copies the given text string to the user's clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Creates a new coupon; for custom_group type, flattens all selected variant IDs into the payload
  const handleCreateCoupon = async () => {
    try {
      setError(null);

      const customGroupVariantIds =
        formData.applies_to_type === "custom_group"
          ? Object.values(customGroupVariants).flat()
          : undefined;

      const payload = {
        ...formData,
        applies_to_id:
          formData.applies_to_type === "custom_group"
            ? customGroupVariantIds
            : formData.applies_to_id,
      };

      await createCoupon(payload as any);
      setShowCreateModal(false);
      resetForm();
      loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create coupon");
    }
  };

  // Updates an existing coupon; same custom_group flattening as create
  const handleUpdateCoupon = async (couponId: number) => {
    try {
      setError(null);

      const customGroupVariantIds =
        formData.applies_to_type === "custom_group"
          ? Object.values(customGroupVariants).flat()
          : undefined;

      const payload = {
        ...formData,
        applies_to_id:
          formData.applies_to_type === "custom_group"
            ? customGroupVariantIds
            : formData.applies_to_id,
      };

      await updateCoupon(couponId, payload as any);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update coupon");
    }
  };

  // Opens the delete confirmation modal and deletes on confirm
  const handleDeleteCoupon = (couponId: number) => {
    deleteConfirmation.showConfirmation({
      title: "Delete Coupon?",
      message:
        "This coupon will be permanently deleted. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setError(null);
          await deleteCoupon(couponId);
          loadCoupons();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to delete coupon",
          );
        }
      },
    });
  };

  // Flips the coupon's active state and reloads the table
  const handleToggleStatus = async (
    couponId: number,
    currentStatus: boolean,
  ) => {
    try {
      setError(null);
      await toggleCouponStatus(couponId, !currentStatus);
      loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  // Opens the read-only preview modal for the given coupon
  const handlePreviewCoupon = (coupon: Coupon) => {
    setPreviewCoupon(coupon);
    setShowPreviewModal(true);
  };

  // Loads full coupon data (including variant details) in a specific order before opening the edit wizard
  const openEditModal = async (coupon: Coupon) => {
    try {
      // STEP 1: Fetch full coupon data first
      const fullCoupon = await fetchCouponById(coupon.coupon_id);

      // STEP 2: Prepare all the state variables
      let selectedProduct: number | null = null;
      let loadedVariants: any[] = [];
      let customProducts: number[] = [];
      let customVariants: { [productId: number]: number[] } = {};
      let variantsMap: { [productId: number]: any[] } = {};

      // STEP 3: Load variant-specific or custom_group-specific data
      if (
        fullCoupon.applies_to_type === "variant" &&
        fullCoupon.applies_to_id
      ) {
        // For variant coupons — resolve the product so the variant dropdown is pre-populated
        const variantId = Number(fullCoupon.applies_to_id);
        const variant = await fetchVariantById(variantId);
        selectedProduct = variant.product_id;
        loadedVariants = await fetchVariantsForProduct(variant.product_id);
      } else if (
        fullCoupon.applies_to_type === "custom_group" &&
        fullCoupon.applies_to_id
      ) {
        // For custom_group coupons — group variant IDs by product, preferring cached variant_details
        const variantIds: number[] = Array.isArray(fullCoupon.applies_to_id)
          ? fullCoupon.applies_to_id
          : [];

        const productIds: Set<number> = new Set();
        const groupedVariants: { [productId: number]: number[] } = {};

        if (
          fullCoupon.variant_details &&
          fullCoupon.variant_details.length > 0
        ) {
          // Use pre-fetched variant details to avoid individual API calls
          for (const detail of fullCoupon.variant_details) {
            const productId = detail.product_id;
            const variantId = detail.variant_id;

            productIds.add(productId);

            if (!groupedVariants[productId]) {
              groupedVariants[productId] = [];
            }
            groupedVariants[productId].push(variantId);
          }
        } else {
          // Fallback: fetch each variant individually to determine its product
          for (const variantId of variantIds) {
            try {
              const variant = await fetchVariantById(variantId);
              const productId = variant.product_id;
              productIds.add(productId);

              if (!groupedVariants[productId]) {
                groupedVariants[productId] = [];
              }
              groupedVariants[productId].push(variantId);
            } catch (error) {
              console.error(`Failed to load variant ${variantId}:`, error);
            }
          }
        }

        // Load the full variant list for each product so checkboxes can be rendered
        for (const productId of Array.from(productIds)) {
          try {
            const variants = await loadVariantsForCustomGroup(productId);
            variantsMap[productId] = variants;
          } catch (error) {
            console.error(
              `Failed to load variants for product ${productId}:`,
              error,
            );
          }
        }

        customProducts = Array.from(productIds);
        customVariants = groupedVariants;
      }

      // STEP 4: Set ALL state at once in the correct order
      setSelectedProductForVariant(selectedProduct);
      setVariants(loadedVariants);
      setCustomGroupProducts(customProducts);
      setCustomGroupVariants(customVariants);
      setInitialProductVariantsMap(variantsMap);

      setFormData({
        coupon_code: fullCoupon.coupon_code,
        description: fullCoupon.description || "",
        discount_type: fullCoupon.discount_type,
        discount_value: fullCoupon.discount_value || undefined,
        min_purchase_amount: fullCoupon.min_purchase_amount || undefined,
        max_discount_amount: fullCoupon.max_discount_amount || undefined,
        free_shipping: fullCoupon.free_shipping,
        applies_to_type: fullCoupon.applies_to_type,
        // For custom_group, applies_to_id is managed via customGroupVariants instead
        applies_to_id:
          fullCoupon.applies_to_type === "custom_group"
            ? undefined
            : (Array.isArray(fullCoupon.applies_to_id)
                ? undefined
                : fullCoupon.applies_to_id) || undefined,
        usage_limit_total: fullCoupon.usage_limit_total || undefined,
        usage_limit_per_user: fullCoupon.usage_limit_per_user || undefined,
        requires_verified_email: fullCoupon.requires_verified_email,
        // Strip time component — form only uses the date portion
        valid_from: fullCoupon.valid_from.split("T")[0],
        valid_until: fullCoupon.valid_until
          ? fullCoupon.valid_until.split("T")[0]
          : undefined,
        is_active: fullCoupon.is_active,
        bogo_buy_quantity: fullCoupon.bogo_buy_quantity || undefined,
        bogo_get_quantity: fullCoupon.bogo_get_quantity || undefined,
        bogo_discount_percentage:
          fullCoupon.bogo_discount_percentage || undefined,
        location_ids: fullCoupon.location_ids || [],
      });

      // STEP 5: Set editingCoupon LAST — this is the trigger that opens the modal
      // All other state must be ready before the wizard renders
      setEditingCoupon(fullCoupon);
    } catch (error) {
      console.error("Failed to load coupon data:", error);
      setError("Failed to load coupon data for editing");
    }
  };

  // Routes the wizard's submit action to create or update depending on whether a coupon is being edited
  const handleWizardSubmit = () => {
    if (editingCoupon) {
      handleUpdateCoupon(editingCoupon.coupon_id);
    } else {
      handleCreateCoupon();
    }
  };

  // Closes the create/edit wizard and resets all form state
  const handleCloseWizard = () => {
    setShowCreateModal(false);
    setEditingCoupon(null);
    resetForm();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-page accent-coupons">
      {/* Header */}
      <div className="mgr-header">
        <div className="mgr-header-inner">
          <div>
            <button
              className="mgr-back-button"
              onClick={() => navigate("/manager")}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            <h1 className="mgr-header-title">Coupons & Discounts</h1>
            <p className="mgr-header-subtitle">
              Create and manage discount codes
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mgr-container">
        <div className="mgr-body">
          {/* Inline error alert */}
          {error && <div className="coupon-error-alert">{error}</div>}

          {/* Create Coupon action button */}
          <div className="coupon-create-action">
            <button
              onClick={() => setShowCreateModal(true)}
              className="mgr-btn mgr-btn-primary"
            >
              <Plus size={20} />
              Create Coupon
            </button>
          </div>

          {/* Filter bar */}
          <CouponFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            appliesToFilter={appliesToFilter}
            setAppliesToFilter={setAppliesToFilter}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            locations={locations}
          />

          {/* Coupons table */}
          <CouponsTable
            coupons={coupons}
            loading={loading}
            onPreview={handlePreviewCoupon}
            onToggleStatus={handleToggleStatus}
            onEdit={openEditModal}
            onDelete={handleDeleteCoupon}
            onCopyCode={copyToClipboard}
          />
        </div>
      </div>

      {/* Create/Edit Wizard Modal */}
      {(showCreateModal || editingCoupon) && (
        <CouponWizard
          editingCoupon={editingCoupon}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          productTypes={productTypes}
          products={products}
          variants={variants}
          selectedProductForVariant={selectedProductForVariant}
          setSelectedProductForVariant={setSelectedProductForVariant}
          customGroupProducts={customGroupProducts}
          setCustomGroupProducts={setCustomGroupProducts}
          customGroupVariants={customGroupVariants}
          setCustomGroupVariants={setCustomGroupVariants}
          initialProductVariantsMap={initialProductVariantsMap}
          locations={locations}
          onClose={handleCloseWizard}
          onSubmit={handleWizardSubmit}
          loadVariantsForProduct={loadVariantsForProduct}
          loadVariantsForCustomGroup={loadVariantsForCustomGroup}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewCoupon && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content coupon-preview-modal">
            {/* Preview modal header */}
            <div className="coupon-preview-modal-header">
              <h2 className="coupon-preview-modal-title">
                Coupon Preview: {previewCoupon.coupon_code}
              </h2>
            </div>

            <CouponPreview
              coupon={previewCoupon}
              onClose={() => {
                setShowPreviewModal(false);
                setPreviewCoupon(null);
              }}
            />

            {/* Preview modal footer */}
            <div className="coupon-preview-modal-footer">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewCoupon(null);
                }}
                className="mgr-btn mgr-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.config && (
        <ConfirmationModal
          title={deleteConfirmation.config.title}
          message={deleteConfirmation.config.message}
          confirmText={deleteConfirmation.config.confirmText}
          cancelText={deleteConfirmation.config.cancelText}
          onConfirm={deleteConfirmation.handleConfirm}
          onCancel={deleteConfirmation.handleCancel}
        />
      )}
    </div>
  );
};

export default CouponsPage;
