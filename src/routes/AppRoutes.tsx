import { Routes, Route, Navigate, useLocation } from "react-router";

import ProtectedRoute from "./ProtectedRoute";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";


// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";


// Customer

// - Account
import Profile from "../pages/customer/account/Profile";
import OrderHistory from "../pages/customer/account/OrderHistory";
import Wishlist from "../pages/customer/account/Wishlist";

// - Storefront
import Home from "../pages/customer/storefront/Home";
import About from "../pages/customer/storefront/About";
import ReviewsComingSoon from "../pages/customer/storefront/ReviewsComingSoon";
import ProductCatalog from "../pages/customer/storefront/ProductCatalog";
import ProductDetail from "../pages/customer/storefront/ProductDetail";

// - Checkout
import Cart from "../pages/customer/checkout/Cart";
import Checkout from "../pages/customer/checkout/Checkout";
import GuestOrderLookup, {
  GuestOrderResult,
} from "../pages/customer/checkout/GuestOrderLookup";
import OrderConfirmation from "../pages/customer/checkout/OrderConfirmation";


// Manager
import ManagerDashboard from "../pages/manager/ManagerDashboard";

// - Coupons
import Coupons from "../pages/manager/coupons/Coupons";

// - Inventory
import InventoryHub from "../pages/manager/inventory/InventoryHub";
import InventoryList from "../pages/manager/inventory/InventoryList";
import CreateProduct from "../pages/manager/inventory/CreateProduct";
import ProductTypes from "../pages/manager/inventory/ProductTypes";
import Categories from "../pages/manager/inventory/Categories";

// - Orders
import OrderStatus from "../pages/manager/orders/OrderStatus";

// - Settings
import Settings from "../pages/manager/settings/Settings";


// Footer / Legal
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

      {/* Public — Storefront */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/reviews" element={<ReviewsComingSoon />} />
      <Route path="/items" element={<ProductCatalog />} />
      <Route
        path="/items/:variantId"
        element={<ProductDetail key={location.pathname} />}
      />

      {/* Public — Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Public — Shopping */}
      <Route path="/cart" element={<Cart />} />
      <Route path="/saved" element={<Wishlist />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/:step" element={<Checkout />} />
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
            <OrderHistory />
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
            <InventoryHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory/edit"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <InventoryList />
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
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory/types"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <ProductTypes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/orders"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <OrderStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/coupons"
        element={
          <ProtectedRoute requiredRoles={["manager", "admin"]}>
            <Coupons />
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