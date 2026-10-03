import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Package,
  Plus,
  Edit,
  Trash2,
  Power,
  ArrowLeft,
  Building2,
  Phone,
  User,
  Ruler,
  GripVertical,
  X,
} from "lucide-react";
import {
  fetchLocations,
  createLocation,
  updateLocation,
  toggleLocationStatus,
  fetchShippingBoxes,
  createShippingBox,
  updateShippingBox,
  deleteShippingBox,
  toggleShippingBoxStatus,
  reorderShippingBoxes,
  type SellerLocation,
  type ShippingBox,
  type CreateLocationPayload,
  type CreateShippingBoxPayload,
} from "../../../api/settings";
import {
  validateAddress,
  type AddressValidationResult,
} from "../../../api/checkout";

import AddressValidationModal from "../../../components/shared/AddressValidationModal";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import { ToastNotification } from "../../../components/manager/shared/ToastNotifications";
import ConfirmationModal from "../../../components/manager/shared/ManagerConfirmModal";
import { useConfirmationModal } from "../../../hooks/useConfirmationModal";
import { useToastMessage } from "../../../hooks/useToastMessage";

type TabType = "locations" | "shipping";

// Types for the location create/edit form fields
interface LocationFormData {
  location_name: string;
  state: string;
  city: string;
  address_line1: string;
  address_line2: string;
  zip: string;
  phone: string;
  contact_name: string;
  is_active: boolean;
}

// Types for the shipping box create/edit form fields
interface ShippingBoxFormData {
  box_name: string;
  length_in: string;
  width_in: string;
  height_in: string;
  box_type: "box" | "envelope";
  location_id: string;
  is_active: boolean;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabType>("locations");

  // Toast notification
  const { message, showMessage } = useToastMessage();

  // Address validation state
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);
  const [pendingLocationData, setPendingLocationData] =
    useState<CreateLocationPayload | null>(null);

  // ============================================================================
  // STATE MANAGEMENT — LOCATIONS
  // ============================================================================

  const [locations, setLocations] = useState<SellerLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SellerLocation | null>(
    null,
  );
  const [locationFormData, setLocationFormData] = useState<LocationFormData>({
    location_name: "",
    state: "",
    city: "",
    address_line1: "",
    address_line2: "",
    zip: "",
    phone: "",
    contact_name: "",
    is_active: true,
  });

  // ============================================================================
  // STATE MANAGEMENT — SHIPPING BOXES
  // ============================================================================

  const [shippingBoxes, setShippingBoxes] = useState<ShippingBox[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [editingBox, setEditingBox] = useState<ShippingBox | null>(null);
  const [boxFormData, setBoxFormData] = useState<ShippingBoxFormData>({
    box_name: "",
    length_in: "",
    width_in: "",
    height_in: "",
    box_type: "box",
    location_id: "",
    is_active: true,
  });

  // Drag state — tracks which box is being dragged
  const [draggedBox, setDraggedBox] = useState<ShippingBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ============================================================================
  // STATE MANAGEMENT — FILTERS
  // ============================================================================

  const [boxStatusFilter, setBoxStatusFilter] = useState<string>("all");
  const [boxTypeFilter, setBoxTypeFilter] = useState<string>("all");
  const [boxLocationFilter, setBoxLocationFilter] = useState<string>("all");

  // Confirmation modal
  const deleteConfirmation = useConfirmationModal();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Load locations once on mount
  useEffect(() => {
    loadLocations();
  }, []);

  // Reload shipping boxes whenever any box filter changes
  useEffect(() => {
    loadShippingBoxes();
  }, [boxStatusFilter, boxTypeFilter, boxLocationFilter]);

  // Fetches all locations (active and inactive)
  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      const data = await fetchLocations(null);
      setLocations(data);
    } catch (error) {
      console.error("Error loading locations:", error);
      showMessage("Failed to load locations", "error");
    } finally {
      setLoadingLocations(false);
    }
  };

  // Fetches shipping boxes applying the active status, type, and location filters
  const loadShippingBoxes = async () => {
    try {
      setLoadingBoxes(true);
      const activeFilter = boxStatusFilter === "all" ? null : boxStatusFilter;
      const typeFilter = boxTypeFilter === "all" ? null : boxTypeFilter;
      const locFilter = boxLocationFilter === "all" ? null : boxLocationFilter;
      const data = await fetchShippingBoxes(
        activeFilter,
        locFilter,
        typeFilter,
      );
      setShippingBoxes(data);
    } catch (error) {
      console.error("Error loading shipping boxes:", error);
      showMessage("Failed to load shipping boxes", "error");
    } finally {
      setLoadingBoxes(false);
    }
  };

  // ============================================================================
  // LOCATION HANDLERS
  // ============================================================================

  // Opens the location modal, pre-populating the form when editing an existing location
  const handleOpenLocationModal = (location?: SellerLocation) => {
    if (location) {
      setEditingLocation(location);
      setLocationFormData({
        location_name: location.location_name,
        state: location.state,
        city: location.city,
        address_line1: location.address_line1,
        address_line2: location.address_line2 || "",
        zip: location.zip,
        phone: location.phone || "",
        contact_name: location.contact_name || "",
        is_active: location.is_active,
      });
    } else {
      setEditingLocation(null);
      setLocationFormData({
        location_name: "",
        state: "",
        city: "",
        address_line1: "",
        address_line2: "",
        zip: "",
        phone: "",
        contact_name: "",
        is_active: true,
      });
    }
    setShowLocationModal(true);
  };

  // Closes the location modal and clears the editing state
  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    setEditingLocation(null);
  };

  // Validates the address with Shippo before saving; stores pending data and shows the validation modal
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: CreateLocationPayload = {
        location_name: locationFormData.location_name,
        state: locationFormData.state,
        city: locationFormData.city,
        address_line1: locationFormData.address_line1,
        address_line2: locationFormData.address_line2 || undefined,
        zip: locationFormData.zip,
        phone: locationFormData.phone || undefined,
        contact_name: locationFormData.contact_name || undefined,
        is_active: locationFormData.is_active,
      };

      // Run address validation before persisting to the database
      const validation = await validateAddress({
        address_name: payload.location_name,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2,
        city: payload.city,
        state: payload.state,
        zip: payload.zip,
        country: "US",
      });

      // Hold the payload until the user accepts or corrects the validated address
      setPendingLocationData(payload);
      setValidationResult(validation);
    } catch (error: any) {
      showMessage(error.message || "Failed to validate address", "error");
    }
  };

  // Creates or updates the location in the database after address validation is accepted
  const saveLocation = async (locationData: CreateLocationPayload) => {
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.location_id, locationData);
        showMessage("Location updated successfully!", "success");
      } else {
        await createLocation(locationData);
        showMessage("Location created successfully!", "success");
      }

      handleCloseLocationModal();
      setValidationResult(null);
      setPendingLocationData(null);
      loadLocations();
    } catch (error: any) {
      showMessage(error.message || "Failed to save location", "error");
    }
  };

  // Saves the address exactly as the user entered it, bypassing the USPS suggestion
  const handleAcceptOriginalAddress = () => {
    if (pendingLocationData) {
      saveLocation(pendingLocationData);
    }
  };

  // Saves the USPS-corrected address returned by the validation API
  const handleAcceptCorrectedAddress = () => {
    if (validationResult?.validated_address && pendingLocationData) {
      const correctedLocation: CreateLocationPayload = {
        ...pendingLocationData,
        address_line1: validationResult.validated_address.street1,
        address_line2: validationResult.validated_address.street2 || undefined,
        city: validationResult.validated_address.city,
        state: validationResult.validated_address.state,
        zip: validationResult.validated_address.zip,
      };
      saveLocation(correctedLocation);
    }
  };

  // Closes the validation modal and discards the pending location data
  const handleCancelValidation = () => {
    setValidationResult(null);
    setPendingLocationData(null);
  };

  // Flips the location's active state and reloads the list
  const handleToggleLocationStatus = async (
    locationId: number,
    currentStatus: boolean,
  ) => {
    try {
      await toggleLocationStatus(locationId, !currentStatus);
      showMessage(
        `Location ${!currentStatus ? "activated" : "deactivated"} successfully!`,
        "success",
      );
      loadLocations();
    } catch (error: any) {
      showMessage(error.message || "Failed to toggle location status", "error");
    }
  };

  // ============================================================================
  // SHIPPING BOX HANDLERS
  // ============================================================================

  // Opens the box modal, pre-populating the form when editing an existing box;
  // defaults location_id to the active filter when creating a new box
  const handleOpenBoxModal = (box?: ShippingBox) => {
    if (box) {
      setEditingBox(box);
      setBoxFormData({
        box_name: box.box_name,
        length_in: box.length_in.toString(),
        width_in: box.width_in.toString(),
        height_in: box.height_in.toString(),
        box_type: box.box_type,
        location_id: box.location_id?.toString() || "",
        is_active: box.is_active,
      });
    } else {
      setEditingBox(null);
      setBoxFormData({
        box_name: "",
        length_in: "",
        width_in: "",
        height_in: "",
        box_type: "box",
        // Pre-select the active location filter to save a step for the user
        location_id: boxLocationFilter !== "all" ? boxLocationFilter : "",
        is_active: true,
      });
    }
    setShowBoxModal(true);
  };

  // Closes the box modal and clears the editing state
  const handleCloseBoxModal = () => {
    setShowBoxModal(false);
    setEditingBox(null);
  };

  // Creates or updates the shipping box after validating that a location is selected
  const handleBoxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!boxFormData.location_id || boxFormData.location_id === "") {
      showMessage("Please select a location", "error");
      return;
    }

    try {
      const payload: CreateShippingBoxPayload = {
        box_name: boxFormData.box_name,
        length_in: parseFloat(boxFormData.length_in),
        width_in: parseFloat(boxFormData.width_in),
        height_in: parseFloat(boxFormData.height_in),
        box_type: boxFormData.box_type,
        location_id: parseInt(boxFormData.location_id, 10),
        is_active: boxFormData.is_active,
      };

      if (editingBox) {
        await updateShippingBox(editingBox.box_id, payload);
        showMessage("Shipping box updated successfully!", "success");
      } else {
        await createShippingBox(payload);
        showMessage("Shipping box created successfully!", "success");
      }

      handleCloseBoxModal();
      loadShippingBoxes();
    } catch (error: any) {
      showMessage(error.message || "Failed to save shipping box", "error");
    }
  };

  // Opens the delete confirmation modal; deletes on confirm and reloads the list
  const handleDeleteBox = (boxId: number) => {
    deleteConfirmation.showConfirmation({
      title: "Delete Shipping Box?",
      message:
        "This shipping box will be permanently deleted. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deleteShippingBox(boxId);
          showMessage("Shipping box deleted successfully!", "success");
          loadShippingBoxes();
        } catch (error: any) {
          showMessage(
            error.message || "Failed to delete shipping box",
            "error",
          );
        }
      },
    });
  };

  // Flips the box's active state and reloads the list
  const handleToggleBoxStatus = async (
    boxId: number,
    currentStatus: boolean,
  ) => {
    try {
      await toggleShippingBoxStatus(boxId, !currentStatus);
      showMessage(
        `Shipping box ${!currentStatus ? "activated" : "deactivated"} successfully!`,
        "success",
      );
      loadShippingBoxes();
    } catch (error: any) {
      showMessage(error.message || "Failed to toggle box status", "error");
    }
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS (native HTML drag API)
  // ============================================================================

  // Records the dragged box and sets the drag effect
  const handleDragStart = (e: React.DragEvent, box: ShippingBox) => {
    setDraggedBox(box);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  // Allows the drop by preventing the default browser behaviour
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Reorders the box array, updates box_size_order for all affected rows,
  // optimistically updates the UI, then persists the new order to the API
  const handleDrop = async (e: React.DragEvent, targetBox: ShippingBox) => {
    e.preventDefault();

    if (!draggedBox || draggedBox.box_id === targetBox.box_id) {
      setDraggedBox(null);
      setIsDragging(false);
      return;
    }

    const reorderedBoxes = [...shippingBoxes];
    const draggedIndex = reorderedBoxes.findIndex(
      (b) => b.box_id === draggedBox.box_id,
    );
    const targetIndex = reorderedBoxes.findIndex(
      (b) => b.box_id === targetBox.box_id,
    );

    // Remove dragged box and insert it at the drop target's position
    const [removed] = reorderedBoxes.splice(draggedIndex, 1);
    reorderedBoxes.splice(targetIndex, 0, removed);

    // Recalculate display order for every box after the move
    const updatedBoxes = reorderedBoxes.map((box, index) => ({
      ...box,
      box_size_order: index + 1,
    }));

    // Optimistically update the UI before the API responds
    setShippingBoxes(updatedBoxes);
    setDraggedBox(null);
    setIsDragging(false);

    try {
      await reorderShippingBoxes(
        updatedBoxes.map((box) => ({
          box_id: box.box_id,
          box_size_order: box.box_size_order,
        })),
      );
      showMessage("Box order updated successfully", "success");
    } catch (error) {
      showMessage("Failed to update box order", "error");
      // Reload from server to discard the optimistic update on failure
      loadShippingBoxes();
    }
  };

  // Clears drag state when the drag operation ends without a valid drop
  const handleDragEnd = () => {
    setDraggedBox(null);
    setIsDragging(false);
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Active/inactive status pill shared by the location cards and the box table
  const renderStatusPill = (isActive: boolean) => (
    <span
      className={`settings-pill settings-pill--status ${
        isActive ? "settings-pill--active" : "settings-pill--inactive"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  const renderLocationsTab = () => {
    return (
      <>
        <div className="settings-section-heading">
          <h2 className="settings-section-title">Seller locations</h2>
          <p className="settings-section-desc">
            Warehouses that products ship from. Shipping boxes are set up per
            location.
          </p>
        </div>

        {loadingLocations ? (
          <div className="settings-loading">
            <LoadingSpinner message="Loading locations..." />
          </div>
        ) : locations.length === 0 ? (
          <div className="settings-empty">
            <div className="settings-empty-icon" aria-hidden="true">
              <MapPin size={26} />
            </div>
            <p className="settings-empty-title">No locations found</p>
            <p className="settings-empty-hint">
              Seller locations will appear here once they have been added.
            </p>
          </div>
        ) : (
          /* Location cards */
          <div className="settings-location-grid">
            {locations.map((location) => (
              <article
                key={location.location_id}
                className={`settings-location-card${
                  location.is_active ? "" : " settings-location-card--inactive"
                }`}
              >
                <div className="settings-location-top">
                  <div className="settings-tile" aria-hidden="true">
                    <Building2 size={20} />
                  </div>
                  <div className="settings-location-head">
                    <h3
                      className="settings-location-name"
                      title={location.location_name}
                    >
                      {location.location_name}
                    </h3>
                    {renderStatusPill(location.is_active)}
                  </div>
                </div>

                <div className="settings-location-body">
                  {/* Address — address_line2 is optional */}
                  <div className="settings-detail">
                    <MapPin size={16} aria-hidden="true" />
                    <div>
                      <span className="settings-address-line">
                        {location.address_line1}
                      </span>
                      {location.address_line2 && (
                        <span className="settings-address-line">
                          {location.address_line2}
                        </span>
                      )}
                      <span className="settings-address-line settings-detail-muted">
                        {location.city}, {location.state} {location.zip}
                      </span>
                    </div>
                  </div>

                  {/* Contact name and phone */}
                  {location.contact_name && (
                    <div className="settings-detail">
                      <User size={16} aria-hidden="true" />
                      {location.contact_name}
                    </div>
                  )}
                  {location.phone && (
                    <div className="settings-detail">
                      <Phone size={16} aria-hidden="true" />
                      {location.phone}
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="settings-location-footer">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleLocationStatus(
                        location.location_id,
                        location.is_active,
                      )
                    }
                    className="settings-btn settings-btn--ghost settings-btn--sm"
                  >
                    <Power size={14} aria-hidden="true" />
                    {location.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenLocationModal(location)}
                    className="settings-btn settings-btn--secondary settings-btn--sm"
                  >
                    <Edit size={14} aria-hidden="true" />
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderShippingTab = () => {
    // A location must be selected before boxes can be viewed or created
    const isLocationSelected = boxLocationFilter !== "all";
    return (
      <>
        {/* Filter bar and Add Box button */}
        <div className="settings-toolbar">
          <div className="settings-filters">
            {/* Location filter */}
            <div className="settings-filter">
              <label
                className="settings-field-label"
                htmlFor="settings-box-location"
              >
                Location
              </label>
              <select
                id="settings-box-location"
                className="settings-select"
                value={boxLocationFilter}
                onChange={(e) => setBoxLocationFilter(e.target.value)}
              >
                <option value="all">-- Select Location --</option>
                {locations
                  .filter((loc) => loc.is_active)
                  .map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.location_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Type and status filters */}
            <div className="settings-filter">
              <label
                className="settings-field-label"
                htmlFor="settings-box-type"
              >
                Type
              </label>
              <select
                id="settings-box-type"
                className="settings-select"
                value={boxTypeFilter}
                onChange={(e) => setBoxTypeFilter(e.target.value)}
                disabled={!isLocationSelected}
              >
                <option value="all">All Types</option>
                <option value="box">Box</option>
                <option value="envelope">Envelope</option>
              </select>
            </div>

            <div className="settings-filter">
              <label
                className="settings-field-label"
                htmlFor="settings-box-status"
              >
                Status
              </label>
              <select
                id="settings-box-status"
                className="settings-select"
                value={boxStatusFilter}
                onChange={(e) => setBoxStatusFilter(e.target.value)}
                disabled={!isLocationSelected}
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenBoxModal()}
            className="settings-btn settings-btn--primary"
            disabled={!isLocationSelected}
          >
            <Plus size={16} aria-hidden="true" />
            Add Box/Envelope
          </button>
        </div>

        {/* Content states */}
        {!isLocationSelected ? (
          <div className="settings-empty">
            <div className="settings-empty-icon" aria-hidden="true">
              <MapPin size={26} />
            </div>
            <p className="settings-empty-title">Select a location</p>
            <p className="settings-empty-hint">
              Choose a location above to view and manage its shipping boxes.
            </p>
          </div>
        ) : loadingBoxes ? (
          <div className="settings-loading">
            <LoadingSpinner message="Loading shipping boxes..." />
          </div>
        ) : shippingBoxes.length === 0 ? (
          <div className="settings-empty">
            <div className="settings-empty-icon" aria-hidden="true">
              <Package size={26} />
            </div>
            <p className="settings-empty-title">No shipping boxes found</p>
            <p className="settings-empty-hint">
              Add a box or envelope to get started.
            </p>
          </div>
        ) : (
          /* Shipping boxes table */
          <div className="settings-table-card">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Dimensions</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="settings-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shippingBoxes.map((box) => (
                  <tr
                    key={box.box_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, box)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, box)}
                    onDragEnd={handleDragEnd}
                    // Dims the row while it is being dragged
                    className={`settings-draggable-row${
                      isDragging && draggedBox?.box_id === box.box_id
                        ? " dragging"
                        : ""
                    }`}
                  >
                    <td>
                      {/* Drag handle, box icon, name, and sort order badge */}
                      <div className="settings-box-name">
                        <GripVertical
                          size={18}
                          className="drag-handle"
                          aria-hidden="true"
                        />
                        <Package size={18} aria-hidden="true" />
                        <span>{box.box_name}</span>
                        <span className="box-order-badge">
                          #{box.box_size_order}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`settings-pill ${
                          box.box_type === "box"
                            ? "settings-pill--box"
                            : "settings-pill--envelope"
                        }`}
                      >
                        {box.box_type}
                      </span>
                    </td>
                    <td>
                      <span className="settings-cell-inline">
                        <Ruler size={14} aria-hidden="true" />
                        {box.length_in}" × {box.width_in}" × {box.height_in}"
                      </span>
                    </td>
                    <td>
                      {box.location_id ? (
                        /* Resolve location_id to its display name */
                        <span className="settings-cell-inline">
                          <MapPin size={14} aria-hidden="true" />
                          {
                            locations.find(
                              (loc) => loc.location_id === box.location_id,
                            )?.location_name
                          }
                        </span>
                      ) : (
                        <span className="settings-no-location">
                          No specific location
                        </span>
                      )}
                    </td>
                    <td>{renderStatusPill(box.is_active)}</td>
                    <td>
                      {/* Row actions */}
                      <div className="settings-row-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleBoxStatus(box.box_id, box.is_active)
                          }
                          className={`settings-icon-btn ${
                            box.is_active
                              ? "settings-icon-btn--on"
                              : "settings-icon-btn--off"
                          }`}
                          title={
                            box.is_active ? "Deactivate box" : "Activate box"
                          }
                          aria-label={
                            box.is_active ? "Deactivate box" : "Activate box"
                          }
                        >
                          <Power size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenBoxModal(box)}
                          className="settings-icon-btn"
                          title="Edit box"
                          aria-label="Edit box"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBox(box.box_id)}
                          className="settings-icon-btn settings-icon-btn--danger"
                          title="Delete box"
                          aria-label="Delete box"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <div className="settings-container">
          <Link to="/manager" className="settings-back-link">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <p className="settings-eyebrow">Manager</p>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Manage seller locations and shipping boxes
          </p>

          {/* Tab navigation */}
          <div className="settings-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "locations"}
              onClick={() => setActiveTab("locations")}
              className={`settings-tab ${activeTab === "locations" ? "settings-tab--active" : ""}`}
            >
              <MapPin size={16} aria-hidden="true" />
              Seller Locations
              {!loadingLocations && (
                <span className="settings-tab-count">{locations.length}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "shipping"}
              onClick={() => setActiveTab("shipping")}
              className={`settings-tab ${activeTab === "shipping" ? "settings-tab--active" : ""}`}
            >
              <Package size={16} aria-hidden="true" />
              Shipping Boxes
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="settings-container settings-main" role="tabpanel">
        {activeTab === "locations" && renderLocationsTab()}
        {activeTab === "shipping" && renderShippingTab()}
      </main>

      {/* Toast Notifications */}
      {message && (
        <ToastNotification message={message.text} type={message.type} />
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div
          className="settings-modal-overlay"
          onClick={handleCloseLocationModal}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-location-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="settings-modal-form"
              onSubmit={handleLocationSubmit}
            >
              <div className="settings-modal-header">
                <div>
                  <h2
                    id="settings-location-modal-title"
                    className="settings-modal-title"
                  >
                    {editingLocation ? "Edit Location" : "Add New Location"}
                  </h2>
                  <p className="settings-modal-subtitle">
                    The address is checked before it is saved.
                  </p>
                </div>
                <button
                  type="button"
                  className="settings-modal-close"
                  onClick={handleCloseLocationModal}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="settings-modal-body">
                <div className="settings-form-grid">
                  {/* Location name */}
                  <div className="settings-field settings-field--full">
                    <label className="settings-label" htmlFor="loc-name">
                      Location Name <span className="settings-required">*</span>
                    </label>
                    <input
                      id="loc-name"
                      type="text"
                      className="settings-input"
                      value={locationFormData.location_name}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          location_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Address fields */}
                  <h3 className="settings-form-section-title">Address</h3>

                  <div className="settings-field">
                    <label className="settings-label" htmlFor="loc-address1">
                      Address Line 1 <span className="settings-required">*</span>
                    </label>
                    <input
                      id="loc-address1"
                      type="text"
                      className="settings-input"
                      value={locationFormData.address_line1}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          address_line1: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label" htmlFor="loc-address2">
                      Address Line 2
                    </label>
                    <input
                      id="loc-address2"
                      type="text"
                      className="settings-input"
                      value={locationFormData.address_line2}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          address_line2: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="settings-field settings-field--third">
                    <label className="settings-label" htmlFor="loc-city">
                      City <span className="settings-required">*</span>
                    </label>
                    <input
                      id="loc-city"
                      type="text"
                      className="settings-input"
                      value={locationFormData.city}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          city: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="settings-field settings-field--third">
                    <label className="settings-label" htmlFor="loc-state">
                      State <span className="settings-required">*</span>
                    </label>
                    <input
                      id="loc-state"
                      type="text"
                      className="settings-input"
                      value={locationFormData.state}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          state: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="settings-field settings-field--third">
                    <label className="settings-label" htmlFor="loc-zip">
                      ZIP Code <span className="settings-required">*</span>
                    </label>
                    <input
                      id="loc-zip"
                      type="text"
                      className="settings-input"
                      value={locationFormData.zip}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          zip: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Optional contact fields */}
                  <h3 className="settings-form-section-title">Contact</h3>

                  <div className="settings-field">
                    <label className="settings-label" htmlFor="loc-phone">
                      Phone
                    </label>
                    <input
                      id="loc-phone"
                      type="tel"
                      className="settings-input"
                      value={locationFormData.phone}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label" htmlFor="loc-contact">
                      Contact Name
                    </label>
                    <input
                      id="loc-contact"
                      type="text"
                      className="settings-input"
                      value={locationFormData.contact_name}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          contact_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Active toggle */}
                  <h3 className="settings-form-section-title">Status</h3>

                  <div className="settings-field settings-field--full">
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        className="settings-switch-input"
                        checked={locationFormData.is_active}
                        onChange={(e) =>
                          setLocationFormData({
                            ...locationFormData,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <span className="settings-switch-track" aria-hidden="true" />
                      <span className="settings-switch-text">
                        <span className="settings-switch-label">Active</span>
                        <span className="settings-switch-hint">
                          Inactive locations are hidden from shipping box
                          setup.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="settings-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseLocationModal}
                  className="settings-btn settings-btn--secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="settings-btn settings-btn--primary">
                  {editingLocation ? "Update" : "Create"} Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Box Modal */}
      {showBoxModal && (
        <div className="settings-modal-overlay" onClick={handleCloseBoxModal}>
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-box-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <form className="settings-modal-form" onSubmit={handleBoxSubmit}>
              <div className="settings-modal-header">
                <div>
                  <h2
                    id="settings-box-modal-title"
                    className="settings-modal-title"
                  >
                    {editingBox ? "Edit Shipping Box" : "Add New Shipping Box"}
                  </h2>
                  <p className="settings-modal-subtitle">
                    Interior dimensions in inches.
                  </p>
                </div>
                <button
                  type="button"
                  className="settings-modal-close"
                  onClick={handleCloseBoxModal}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="settings-modal-body">
                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label className="settings-label" htmlFor="box-name">
                      Box/Envelope Name{" "}
                      <span className="settings-required">*</span>
                    </label>
                    <input
                      id="box-name"
                      type="text"
                      className="settings-input"
                      value={boxFormData.box_name}
                      onChange={(e) =>
                        setBoxFormData({
                          ...boxFormData,
                          box_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label" htmlFor="box-type">
                      Type <span className="settings-required">*</span>
                    </label>
                    <select
                      id="box-type"
                      className="settings-select"
                      value={boxFormData.box_type}
                      onChange={(e) =>
                        setBoxFormData({
                          ...boxFormData,
                          box_type: e.target.value as "box" | "envelope",
                        })
                      }
                      required
                    >
                      <option value="box">Box</option>
                      <option value="envelope">Envelope</option>
                    </select>
                  </div>

                  {/* Location assignment */}
                  <div className="settings-field settings-field--full">
                    <label className="settings-label" htmlFor="box-location">
                      Location <span className="settings-required">*</span>
                    </label>
                    <select
                      id="box-location"
                      className="settings-select"
                      value={boxFormData.location_id}
                      onChange={(e) =>
                        setBoxFormData({
                          ...boxFormData,
                          location_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">-- Select --</option>
                      {locations
                        .filter((loc) => loc.is_active)
                        .map((loc) => (
                          <option
                            key={loc.location_id}
                            value={loc.location_id.toString()}
                          >
                            {loc.location_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Dimension inputs */}
                  <h3 className="settings-form-section-title">Dimensions</h3>

                  <div className="settings-field settings-field--third">
                    <label className="settings-label" htmlFor="box-length">
                      Length (in) <span className="settings-required">*</span>
                    </label>
                    <input
                      id="box-length"
                      type="number"
                      step="0.01"
                      className="settings-input"
                      value={boxFormData.length_in}
                      onChange={(e) =>
                        setBoxFormData({
                          ...boxFormData,
                          length_in: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="settings-field settings-field--third">
                    <label className="settings-label" htmlFor="box-width">
                      Width (in) <span className="settings-required">*</span>
                    </label>
                    <input
                      id="box-width"
                      type="number"
                      step="0.01"
                      className="settings-input"
                      value={boxFormData.width_in}
                      onChange={(e) =>
                        setBoxFormData({
                          ...boxFormData,
                          width_in: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="settings-field settings-field--third">
                    <label className="settings-label" htmlFor="box-height">
                      Height (in) <span className="settings-required">*</span>
                    </label>
                    <input
                      id="box-height"
                      type="number"
                      step="0.01"
                      className="settings-input"
                      value={boxFormData.height_in}
                      onChange={(e) =>
                        setBoxFormData({
                          ...boxFormData,
                          height_in: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Active toggle */}
                  <h3 className="settings-form-section-title">Status</h3>

                  <div className="settings-field settings-field--full">
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        className="settings-switch-input"
                        checked={boxFormData.is_active}
                        onChange={(e) =>
                          setBoxFormData({
                            ...boxFormData,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <span className="settings-switch-track" aria-hidden="true" />
                      <span className="settings-switch-text">
                        <span className="settings-switch-label">Active</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="settings-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseBoxModal}
                  className="settings-btn settings-btn--secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="settings-btn settings-btn--primary">
                  {editingBox ? "Update" : "Create"} Box/Envelope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address Validation Modal */}
      {validationResult && (
        <AddressValidationModal
          validationResult={validationResult}
          onAcceptOriginal={handleAcceptOriginalAddress}
          onAcceptCorrected={handleAcceptCorrectedAddress}
          onCancel={handleCancelValidation}
        />
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

export default Settings;
