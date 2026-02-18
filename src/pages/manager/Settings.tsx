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

import { ToastNotification } from "../../components/managerInterface/universal/ToastNotifications";
import AddressValidationModal from "../../components/universalComponents/AddressValidationModal";

import "../../styles/pages/manager/Settings.css";

type TabType = "locations" | "shipping";

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

interface ShippingBoxFormData {
  box_name: string;
  length_in: string;
  width_in: string;
  height_in: string;
  box_type: "box" | "envelope";
  location_id: string;
  is_active: boolean;
}

interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("locations");

  // Toast notification state
  const [message, setMessage] = useState<Message | null>(null);

  // Address validation state
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);
  const [pendingLocationData, setPendingLocationData] =
    useState<CreateLocationPayload | null>(null);

  // Locations state
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

  // Shipping boxes state
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

  const [draggedBox, setDraggedBox] = useState<ShippingBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filters
  const [boxStatusFilter, setBoxStatusFilter] = useState<string>("all");
  const [boxTypeFilter, setBoxTypeFilter] = useState<string>("all");
  const [boxLocationFilter, setBoxLocationFilter] = useState<string>("all");

  // Load locations
  useEffect(() => {
    loadLocations();
  }, []);

  // Load shipping boxes
  useEffect(() => {
    loadShippingBoxes();
  }, [boxStatusFilter, boxTypeFilter, boxLocationFilter]);

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

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

  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    setEditingLocation(null);
  };

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

      // Validate the address with Shippo (using CreateAddressPayload format)
      const validation = await validateAddress({
        address_name: payload.location_name,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2,
        city: payload.city,
        state: payload.state,
        zip: payload.zip,
        country: "US",
      });

      // Store the pending data and show validation modal
      setPendingLocationData(payload);
      setValidationResult(validation);
    } catch (error: any) {
      showMessage(error.message || "Failed to validate address", "error");
    }
  };

  // Actually save the location to the database
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

  // Validation modal handlers
  const handleAcceptOriginalAddress = () => {
    if (pendingLocationData) {
      saveLocation(pendingLocationData);
    }
  };

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

  const handleCancelValidation = () => {
    setValidationResult(null);
    setPendingLocationData(null);
  };

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
        location_id: boxLocationFilter !== "all" ? boxLocationFilter : "", // Pre-fill with selected location
        is_active: true,
      });
    }
    setShowBoxModal(true);
  };

  const handleCloseBoxModal = () => {
    setShowBoxModal(false);
    setEditingBox(null);
  };

  const handleBoxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that location is selected
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

  const handleDeleteBox = async (boxId: number) => {
    if (!window.confirm("Are you sure you want to delete this box?")) return;

    try {
      await deleteShippingBox(boxId);
      showMessage("Shipping box deleted successfully!", "success");
      loadShippingBoxes();
    } catch (error: any) {
      showMessage(error.message || "Failed to delete shipping box", "error");
    }
  };

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

  const handleDragStart = (e: React.DragEvent, box: ShippingBox) => {
    setDraggedBox(box);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetBox: ShippingBox) => {
    e.preventDefault();

    if (!draggedBox || draggedBox.box_id === targetBox.box_id) {
      setDraggedBox(null);
      setIsDragging(false);
      return;
    }

    // Reorder the boxes array
    const reorderedBoxes = [...shippingBoxes];
    const draggedIndex = reorderedBoxes.findIndex(
      (b) => b.box_id === draggedBox.box_id,
    );
    const targetIndex = reorderedBoxes.findIndex(
      (b) => b.box_id === targetBox.box_id,
    );

    // Remove dragged box and insert at target position
    const [removed] = reorderedBoxes.splice(draggedIndex, 1);
    reorderedBoxes.splice(targetIndex, 0, removed);

    // Update box_size_order for all affected boxes
    const updatedBoxes = reorderedBoxes.map((box, index) => ({
      ...box,
      box_size_order: index + 1,
    }));

    // Optimistically update UI
    setShippingBoxes(updatedBoxes);
    setDraggedBox(null);
    setIsDragging(false);

    // Save to backend
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
      // Reload boxes on error
      loadShippingBoxes();
    }
  };

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
          <div className="settings-loading">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="settings-empty">No locations found.</div>
        ) : (
          <div className="settings-table-wrapper">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="settings-table-actions-header">Actions</th>
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
                        className={`settings-badge ${
                          location.is_active
                            ? "settings-badge-success"
                            : "settings-badge-secondary"
                        }`}
                      >
                        {location.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="settings-table-actions">
                        <button
                          onClick={() =>
                            handleToggleLocationStatus(
                              location.location_id,
                              location.is_active,
                            )
                          }
                          className="settings-action-button settings-action-toggle"
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
                          className="settings-action-button settings-action-edit"
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
    // Check if a location is selected
    const isLocationSelected = boxLocationFilter !== "all";

    return (
      <>
        <div className="settings-actions-bar">
          <div className="settings-filters">
            <select
              className="settings-filter-select"
              value={boxLocationFilter}
              onChange={(e) => setBoxLocationFilter(e.target.value)}
              style={{ fontWeight: "600" }}
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
            className="settings-btn settings-btn-primary"
            disabled={!isLocationSelected}
          >
            <Plus size={20} />
            Add Box/Envelope
          </button>
        </div>

        {!isLocationSelected ? (
          <div className="settings-empty">
            Please select a location to view shipping boxes.
          </div>
        ) : loadingBoxes ? (
          <div className="settings-loading">Loading shipping boxes...</div>
        ) : shippingBoxes.length === 0 ? (
          <div className="settings-empty">
            No shipping boxes found for this location. Add a box or envelope to
            get started.
          </div>
        ) : (
          <div className="settings-table-wrapper">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Dimensions</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="settings-table-actions-header">Actions</th>
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
                    className={`${isDragging && draggedBox?.box_id === box.box_id ? "dragging" : ""}`}
                    style={{ cursor: "grab" }}
                  >
                    <td>
                      <div className="settings-box-name-with-handle">
                        <GripVertical
                          size={18}
                          className="drag-handle"
                          style={{ cursor: "grab", color: "#999" }}
                        />
                        <Package size={18} />
                        <span>{box.box_name}</span>
                        <span className="box-order-badge">
                          #{box.box_size_order}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`settings-badge ${
                          box.box_type === "box"
                            ? "settings-badge-success"
                            : "settings-badge-warning"
                        }`}
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
                        className={`settings-badge ${
                          box.is_active
                            ? "settings-badge-success"
                            : "settings-badge-secondary"
                        }`}
                      >
                        {box.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="settings-table-actions">
                        <button
                          onClick={() =>
                            handleToggleBoxStatus(box.box_id, box.is_active)
                          }
                          className="settings-action-button settings-action-toggle"
                          title={
                            box.is_active ? "Deactivate box" : "Activate box"
                          }
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenBoxModal(box)}
                          className="settings-action-button settings-action-edit"
                          title="Edit box"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBox(box.box_id)}
                          className="settings-action-button settings-action-delete"
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

  return (
    <div className="settings-page-container">
      {/* Header */}
      <div className="settings-dashboard-header">
        <div className="container">
          <button
            onClick={() => navigate("/manager")}
            className="settings-back-button"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="settings-header-content">
            <div>
              <h1 className="settings-dashboard-title">Settings</h1>
              <p className="settings-dashboard-subtitle">
                Manage seller locations and shipping boxes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container settings-container-spacing">
        {/* Tabs */}
        <div className="settings-tabs">
          <button
            onClick={() => setActiveTab("locations")}
            className={`settings-tab ${activeTab === "locations" ? "settings-tab-active" : ""}`}
          >
            <MapPin size={20} />
            Seller Locations
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`settings-tab ${activeTab === "shipping" ? "settings-tab-active" : ""}`}
          >
            <Package size={20} />
            Shipping Boxes
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-tab-content">
          {activeTab === "locations" && renderLocationsTab()}
          {activeTab === "shipping" && renderShippingTab()}
        </div>
      </div>

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
            className="settings-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingLocation ? "Edit Location" : "Add New Location"}</h2>
            <form onSubmit={handleLocationSubmit}>
              <div className="settings-form-grid">
                <div className="settings-form-group settings-form-group-full">
                  <label className="settings-form-label">Location Name *</label>
                  <input
                    type="text"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">Address Line 2</label>
                  <input
                    type="text"
                    className="settings-form-input"
                    value={locationFormData.address_line2}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        address_line2: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">City *</label>
                  <input
                    type="text"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">State *</label>
                  <input
                    type="text"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">ZIP Code *</label>
                  <input
                    type="text"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">Phone</label>
                  <input
                    type="tel"
                    className="settings-form-input"
                    value={locationFormData.phone}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Contact Name</label>
                  <input
                    type="text"
                    className="settings-form-input"
                    value={locationFormData.contact_name}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        contact_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="settings-form-group settings-form-group-full">
                  <label className="settings-checkbox-label">
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

              <div className="settings-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseLocationModal}
                  className="settings-btn settings-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-btn settings-btn-primary"
                >
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
            className="settings-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingBox ? "Edit Shipping Box" : "Add New Shipping Box"}</h2>
            <form onSubmit={handleBoxSubmit}>
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Box/Envelope Name *
                  </label>
                  <input
                    type="text"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">Type *</label>
                  <select
                    className="settings-form-select"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Length (inches) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Width (inches) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Height (inches) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="settings-form-input"
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

                <div className="settings-form-group">
                  <label className="settings-form-label">Location *</label>
                  <select
                    className="settings-form-select"
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

                <div className="settings-form-group settings-form-group-full">
                  <label className="settings-checkbox-label">
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

              <div className="settings-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseBoxModal}
                  className="settings-btn settings-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-btn settings-btn-primary"
                >
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
    </div>
  );
};

export default Settings;
