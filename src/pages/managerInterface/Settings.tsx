import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "../../api/settings";
import {
  validateAddress,
  type AddressValidationResult,
} from "../../api/checkout";

import AddressValidationModal from "../../components/universalComponents/AddressValidationModal";
import LoadingSpinner from "../../components/universalComponents/LoadingSpinner";
import { ToastNotification } from "../../components/managerInterface/universal/ToastNotifications";
import ConfirmationModal from "../../components/managerInterface/universal/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { useToastMessage } from "../../hooks/useToastMessage";

import "../../styles/pages/managerInterface/Tokens.css";
import "../../styles/pages/managerInterface/Components.css";
import "../../styles/pages/managerInterface/ManagerShared.css";
import "../../styles/pages/managerInterface/Settings.css";

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
  const navigate = useNavigate();
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

  const renderLocationsTab = () => {
    return (
      <>
        {loadingLocations ? (
          <LoadingSpinner message="Loading locations..." />
        ) : locations.length === 0 ? (
          <div className="mgr-empty">No locations found.</div>
        ) : (
          /* Locations table */
          <div className="mgr-table-wrapper">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="mgr-table-actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location.location_id}>
                    <td>
                      <div className="settings-location-name">
                        <Building2 size={18} />
                        {location.location_name}
                      </div>
                    </td>
                    <td>
                      <div className="settings-address-cell">
                        {location.address_line1}
                        {/* address_line2 is optional */}
                        {location.address_line2 && (
                          <>
                            <br />
                            {location.address_line2}
                          </>
                        )}
                        <div className="settings-city-state">
                          {location.city}, {location.state} {location.zip}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="settings-contact-cell">
                        {/* Contact name and phone */}
                        {location.contact_name && (
                          <div className="settings-contact-item">
                            <User size={14} />
                            {location.contact_name}
                          </div>
                        )}
                        {location.phone && (
                          <div className="settings-contact-item">
                            <Phone size={14} />
                            {location.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`mgr-badge ${location.is_active ? "mgr-badge-success" : "mgr-badge-secondary"}`}
                      >
                        {location.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {/* Row actions */}
                      <div className="mgr-table-actions">
                        <button
                          onClick={() =>
                            handleToggleLocationStatus(
                              location.location_id,
                              location.is_active,
                            )
                          }
                          className="mgr-action-btn mgr-action-btn-toggle"
                          title={
                            location.is_active
                              ? "Deactivate location"
                              : "Activate location"
                          }
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenLocationModal(location)}
                          className="mgr-action-btn mgr-action-btn-edit"
                          title="Edit location"
                        >
                          <Edit size={16} />
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

  const renderShippingTab = () => {
    // A location must be selected before boxes can be viewed or created
    const isLocationSelected = boxLocationFilter !== "all";
    return (
      <>
        {/* Filter bar and Add Box button */}
        <div className="settings-actions-bar">
          <div className="settings-filters">
            {/* Location filter */}
            <select
              className="settings-filter-select"
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
            {/* Type and status filters */}
            <select
              className="settings-filter-select"
              value={boxTypeFilter}
              onChange={(e) => setBoxTypeFilter(e.target.value)}
              disabled={!isLocationSelected}
            >
              <option value="all">All Types</option>
              <option value="box">Box</option>
              <option value="envelope">Envelope</option>
            </select>
            <select
              className="settings-filter-select"
              value={boxStatusFilter}
              onChange={(e) => setBoxStatusFilter(e.target.value)}
              disabled={!isLocationSelected}
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenBoxModal()}
            className="mgr-btn mgr-btn-primary"
            disabled={!isLocationSelected}
          >
            <Plus size={20} />
            Add Box/Envelope
          </button>
        </div>

        {/* Content states */}
        {!isLocationSelected ? (
          <div className="mgr-empty">
            Please select a location to view shipping boxes.
          </div>
        ) : loadingBoxes ? (
          <LoadingSpinner message="Loading shipping boxes..." />
        ) : shippingBoxes.length === 0 ? (
          <div className="mgr-empty">
            No shipping boxes found for this location. Add a box or envelope to
            get started.
          </div>
        ) : (
          /* Shipping boxes table */
          <div className="mgr-table-wrapper">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Dimensions</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="mgr-table-actions-header">Actions</th>
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
                    className={
                      isDragging && draggedBox?.box_id === box.box_id
                        ? "dragging"
                        : ""
                    }
                    style={{ cursor: "grab" }}
                  >
                    <td>
                      {/* Drag handle, box icon, name, and sort order badge */}
                      <div className="settings-box-name-with-handle">
                        <GripVertical size={18} className="drag-handle" />
                        <Package size={18} />
                        <span>{box.box_name}</span>
                        <span className="box-order-badge">
                          #{box.box_size_order}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`mgr-badge ${box.box_type === "box" ? "mgr-badge-success" : "mgr-badge-warning"}`}
                      >
                        {box.box_type}
                      </span>
                    </td>
                    <td>
                      <div className="settings-dimensions">
                        <Ruler size={14} />
                        {box.length_in}" × {box.width_in}" × {box.height_in}"
                      </div>
                    </td>
                    <td>
                      {box.location_id ? (
                        /* Resolve location_id to its display name */
                        <div className="settings-location-badge">
                          <MapPin size={14} />
                          {
                            locations.find(
                              (loc) => loc.location_id === box.location_id,
                            )?.location_name
                          }
                        </div>
                      ) : (
                        <span className="settings-no-location">
                          No specific location
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`mgr-badge ${box.is_active ? "mgr-badge-success" : "mgr-badge-secondary"}`}
                      >
                        {box.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {/* Row actions */}
                      <div className="mgr-table-actions">
                        <button
                          onClick={() =>
                            handleToggleBoxStatus(box.box_id, box.is_active)
                          }
                          className="mgr-action-btn mgr-action-btn-toggle"
                          title={
                            box.is_active ? "Deactivate box" : "Activate box"
                          }
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenBoxModal(box)}
                          className="mgr-action-btn mgr-action-btn-edit"
                          title="Edit box"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBox(box.box_id)}
                          className="mgr-action-btn mgr-action-btn-delete"
                          title="Delete box"
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
    <div className="manager-page accent-settings">
      {/* Header */}
      <div className="mgr-header">
        <div className="mgr-container">
          <button
            onClick={() => navigate("/manager")}
            className="mgr-back-button"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="mgr-header-title">Settings</h1>
          <p className="mgr-header-subtitle">
            Manage seller locations and shipping boxes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mgr-container">
        <div className="mgr-body">
          {/* Tab navigation  */}
          <div className="mgr-tabs">
            <button
              onClick={() => setActiveTab("locations")}
              className={`mgr-tab ${activeTab === "locations" ? "mgr-tab-active" : ""}`}
            >
              <MapPin size={20} />
              Seller Locations
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`mgr-tab ${activeTab === "shipping" ? "mgr-tab-active" : ""}`}
            >
              <Package size={20} />
              Shipping Boxes
            </button>
          </div>

          {/* Tab Content */}
          <div className="mgr-tab-content">
            {activeTab === "locations" && renderLocationsTab()}
            {activeTab === "shipping" && renderShippingTab()}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {message && (
        <ToastNotification message={message.text} type={message.type} />
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="mgr-modal-overlay" onClick={handleCloseLocationModal}>
          <div
            className="mgr-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingLocation ? "Edit Location" : "Add New Location"}</h2>
            <form onSubmit={handleLocationSubmit}>
              <div className="mgr-form-grid">
                {/* Location name */}
                <div className="mgr-form-group mgr-form-group-full">
                  <label className="mgr-form-label">Location Name *</label>
                  <input
                    type="text"
                    className="mgr-form-input"
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
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Address Line 1 *</label>
                  <input
                    type="text"
                    className="mgr-form-input"
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

                <div className="mgr-form-group">
                  <label className="mgr-form-label">Address Line 2</label>
                  <input
                    type="text"
                    className="mgr-form-input"
                    value={locationFormData.address_line2}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        address_line2: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mgr-form-group">
                  <label className="mgr-form-label">City *</label>
                  <input
                    type="text"
                    className="mgr-form-input"
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

                <div className="mgr-form-group">
                  <label className="mgr-form-label">State *</label>
                  <input
                    type="text"
                    className="mgr-form-input"
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

                <div className="mgr-form-group">
                  <label className="mgr-form-label">ZIP Code *</label>
                  <input
                    type="text"
                    className="mgr-form-input"
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
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Phone</label>
                  <input
                    type="tel"
                    className="mgr-form-input"
                    value={locationFormData.phone}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mgr-form-group">
                  <label className="mgr-form-label">Contact Name</label>
                  <input
                    type="text"
                    className="mgr-form-input"
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
                <div className="mgr-form-group mgr-form-group-full">
                  <label className="mgr-checkbox-label">
                    <input
                      type="checkbox"
                      checked={locationFormData.is_active}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          is_active: e.target.checked,
                        })
                      }
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Modal footer */}
              <div className="mgr-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseLocationModal}
                  className="mgr-btn mgr-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="mgr-btn mgr-btn-primary">
                  {editingLocation ? "Update" : "Create"} Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Box Modal */}
      {showBoxModal && (
        <div className="mgr-modal-overlay" onClick={handleCloseBoxModal}>
          <div
            className="mgr-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingBox ? "Edit Shipping Box" : "Add New Shipping Box"}</h2>
            <form onSubmit={handleBoxSubmit}>
              <div className="mgr-form-grid">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Box/Envelope Name *</label>
                  <input
                    type="text"
                    className="mgr-form-input"
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

                <div className="mgr-form-group">
                  <label className="mgr-form-label">Type *</label>
                  <select
                    className="mgr-form-select"
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

                {/* Dimension inputs */}
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Length (inches) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mgr-form-input"
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

                <div className="mgr-form-group">
                  <label className="mgr-form-label">Width (inches) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mgr-form-input"
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

                <div className="mgr-form-group">
                  <label className="mgr-form-label">Height (inches) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mgr-form-input"
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

                {/* Location assignment */}
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Location *</label>
                  <select
                    className="mgr-form-select"
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

                {/* Active toggle */}
                <div className="mgr-form-group mgr-form-group-full">
                  <label className="mgr-checkbox-label">
                    <input
                      type="checkbox"
                      checked={boxFormData.is_active}
                      onChange={(e) =>
                        setBoxFormData({
                          ...boxFormData,
                          is_active: e.target.checked,
                        })
                      }
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Modal footer */}
              <div className="mgr-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseBoxModal}
                  className="mgr-btn mgr-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="mgr-btn mgr-btn-primary">
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
