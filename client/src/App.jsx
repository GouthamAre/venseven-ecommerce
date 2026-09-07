import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { SearchProvider } from "./context/SearchContext";
import ScrollToTop from "./components/layout/ScrollToTop";
import SearchModal from "./components/common/Search/SearchModal";

import Home from "./pages/Home/Home";
import Shop from "./pages/Shop/Shop";
import Product from "./pages/Product/Product";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import Wishlist from "./pages/Wishlist/Wishlist";
import Collections from "./pages/Collections/Collections";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Account from "./pages/Account/Account";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Orders from "./pages/Orders/Orders";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import Footer from "./components/layout/Footer/Footer";

// Admin Dashboard Components
import AdminProtectedRoute from "./pages/Admin/AdminProtectedRoute";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminOrderDetail from "./pages/Admin/AdminOrderDetail";
import AdminCustomers from "./pages/Admin/AdminCustomers";
import AdminCustomerDetail from "./pages/Admin/AdminCustomerDetail";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminProductForm from "./pages/Admin/AdminProductForm";
import AdminCoupons from "./pages/Admin/AdminCoupons";
import AdminCouponForm from "./pages/Admin/AdminCouponForm";
import NotFound from "./pages/NotFound/NotFound";

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <SearchModal />}
      <Routes>
        {/* Customer Storefront Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Client Portal & Auth Routes */}
        <Route path="/account" element={<Account />} />
        <Route path="/login" element={<Account initialView="login" />} />
        <Route path="/signin" element={<Navigate to="/account" replace />} />
        <Route path="/sign-in" element={<Navigate to="/account" replace />} />
        <Route path="/client-portal" element={<Navigate to="/account" replace />} />
        <Route path="/register" element={<Account initialView="register" />} />
        <Route path="/signup" element={<Account initialView="register" />} />
        <Route path="/sign-up" element={<Account initialView="register" />} />
        <Route path="/forgot-password" element={<Account initialView="forgot" />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Secure Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderNumber" element={<AdminOrderDetail />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="customers/:id" element={<AdminCustomerDetail />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="coupons/new" element={<AdminCouponForm />} />
          <Route path="coupons/:id/edit" element={<AdminCouponForm />} />
        </Route>

        {/* 404 Catch-All Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SearchProvider>
              <AppContent />
            </SearchProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;