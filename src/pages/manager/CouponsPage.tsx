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

import "../../styles/pages/manager/CouponsPage.css";

// ============================================================================
// COUPONS PAGE COMPONENT
// ============================================================================

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
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: undefined,
    is_active: true,
    bogo_buy_quantity: undefined,
    bogo_get_quantity: undefined,
    bogo_discount_percentage: undefined,
    location_ids: [],
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadCoupons();
    loadDropdownData();
  }, [statusFilter, appliesToFilter, searchQuery, locationFilter]);

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

  const loadVariantsForProduct = async (productId: number) => {
    try {
      const variantsData = await fetchVariantsForProduct(productId);
      setVariants(variantsData);
    } catch (err) {
      console.error("Failed to load variants:", err);
      setVariants([]);
    }
  };

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
      valid_from: new Date().toISOString().split("T")[0],
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

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

  const handleDeleteCoupon = async (couponId: number) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      setError(null);
      await deleteCoupon(couponId);
      loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

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

  const handlePreviewCoupon = (coupon: Coupon) => {
    setPreviewCoupon(coupon);
    setShowPreviewModal(true);
  };

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
        const variantId = Number(fullCoupon.applies_to_id);
        const variant = await fetchVariantById(variantId);
        selectedProduct = variant.product_id;
        loadedVariants = await fetchVariantsForProduct(variant.product_id);
      } else if (
        fullCoupon.applies_to_type === "custom_group" &&
        fullCoupon.applies_to_id
      ) {
        const variantIds: number[] = Array.isArray(fullCoupon.applies_to_id)
          ? fullCoupon.applies_to_id
          : [];

        const productIds: Set<number> = new Set();
        const groupedVariants: { [productId: number]: number[] } = {};

        if (
          fullCoupon.variant_details &&
          fullCoupon.variant_details.length > 0
        ) {
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
        applies_to_id:
          fullCoupon.applies_to_type === "custom_group"
            ? undefined
            : (Array.isArray(fullCoupon.applies_to_id)
                ? undefined
                : fullCoupon.applies_to_id) || undefined,
        usage_limit_total: fullCoupon.usage_limit_total || undefined,
        usage_limit_per_user: fullCoupon.usage_limit_per_user || undefined,
        requires_verified_email: fullCoupon.requires_verified_email,
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

      // STEP 5: Set editingCoupon LAST - this is the trigger that opens the modal
      // Setting it last ensures all other state is ready when the modal opens
      setEditingCoupon(fullCoupon);
    } catch (error) {
      console.error("Failed to load coupon data:", error);
      setError("Failed to load coupon data for editing");
    }
  };

  const handleWizardSubmit = () => {
    if (editingCoupon) {
      handleUpdateCoupon(editingCoupon.coupon_id);
    } else {
      handleCreateCoupon();
    }
  };

  const handleCloseWizard = () => {
    setShowCreateModal(false);
    setEditingCoupon(null);
    resetForm();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header coupon-dashboard-header">
        <div className="container">
          <button
            onClick={() => navigate("/manager")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              marginBottom: "0.5rem",
              padding: "0.5rem",
            }}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="coupon-dashboard-header-content">
            <div>
              <h1 className="dashboard-title">Coupons & Discounts</h1>
              <p className="coupon-dashboard-subtitle">
                Create and manage discount codes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container coupon-page-container">
        {error && <div className="coupon-error-alert">{error}</div>}

        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="coupon-btn coupon-btn-primary coupon-btn-icon"
          >
            <Plus size={20} />
            Create Coupon
          </button>
        </div>

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

      {/* Create/Edit Modal */}
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
        <div className="coupon-modal-overlay">
          <div className="coupon-modal-content coupon-preview-modal">
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

            <div className="coupon-preview-modal-footer">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewCoupon(null);
                }}
                className="coupon-btn coupon-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
