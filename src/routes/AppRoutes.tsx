import { Routes, Route, Navigate, useLocation } from "react-router";

import Home from "../pages/main/Home";
import About from "../pages/main/About";
import Reviews from "../pages/main/Reviews";
import Items from "../pages/main/Items";
import Listing from "../pages/main/Listing";
import Profile from "../pages/main/Profile";

import Login from "../pages/signin/Login";
import Register from "../pages/signin/Register";
import VerifyEmail from "../pages/signin/VerifyEmail";
import ForgotPassword from "../pages/signin/ForgotPassword";
import ResetPassword from "../pages/signin/ResetPassword";

import Cart from "../pages/customer/Cart";
import WishList from "../pages/customer/Saved";
import CheckoutPage from "../pages/customer/CheckoutPage";
import GuestOrderLookup, {
  GuestOrderResult,
} from "../pages/customer/GuestOrderLookup";
import OrderConfirmation from "../pages/customer/OrderConfirmation";
import Orders from "../pages/customer/Orders";

import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ProductManagementDirectory from "../pages/manager/Inventory/ProductManagementDirectory";
import CreateProduct from "../pages/manager/Inventory/CreateNewProduct";
import ManageProducts from "../pages/manager/Inventory/ManageInventory";
import ManageCategories from "../pages/manager/Inventory/ManageCategories";
import ManageProductTypes from "../pages/manager/Inventory/MangeProductTypes";
import CouponsPage from "../pages/manager/CouponsPage";
import OrderStatusPage from "../pages/manager/OrderStatus";
import Settings from "../pages/manager/Settings";

import AdminDashboard from "../pages/admin/AdminDashboard";

import ProtectedRoute from "./ProtectedRoute";

import PrivacyPolicy from "../footer/PrivacyPolicy";
import ShippingPolicy from "../footer/ShippingPolicy";
import ReturnPolicy from "../footer/ReturnPolicy";
import TermsAndConditions from "../footer/TermsConditions";

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Routes>
      {/* Footer / Legal */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/return-policy" element={<ReturnPolicy />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />

      {/* Public — Main */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/items" element={<Items />} />
      <Route
        path="/items/:variantId"
        element={<Listing key={location.pathname} />}
      />

      {/* Public — Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Public — Shopping */}
      <Route path="/cart" element={<Cart />} />
      <Route path="/saved" element={<WishList />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/:step" element={<CheckoutPage />} />
      <Route path="/order-lookup" element={<GuestOrderLookup />} />
      <Route path="/order-lookup/:orderNumber" element={<GuestOrderResult />} />
      <Route
        path="/order-confirmation/:orderNumber"
        element={<OrderConfirmation />}
      />

      {/* Protected — Customer */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Protected — Manager */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <ProductManagementDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory/edit"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <ManageProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory/create"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <CreateProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory/categories"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <ManageCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory/types"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <ManageProductTypes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/orders"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <OrderStatusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/coupons"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <CouponsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/settings"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/analytics"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <h2>Analytics Dashboard</h2>
              <p>Coming soon...</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Protected — Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
