import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

// Customer Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import About from './pages/About';
import Millets from './pages/Millets';
import Contact from './pages/Contact';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminManageProduct from './pages/admin/AdminManageProduct';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import AdminEnquiries from './pages/admin/AdminEnquiries';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminProfile from './pages/admin/AdminProfile';

import NotFound from './pages/NotFound';

export default function App() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Scroll to top on route change (unless hash navigation)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <Layout>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Profile initialTab="orders" />} />
        <Route path="/orders/:id" element={<OrderDetail />} />

        {/* Profile & Account Tabs */}
        <Route path="/profile" element={isAdmin ? <AdminProfile /> : <Profile initialTab="profile" />} />
        <Route path="/account" element={<Profile initialTab="overview" />} />
        <Route path="/preferences" element={<Profile initialTab="preferences" />} />
        <Route path="/email-preferences" element={<Profile initialTab="preferences" />} />
        <Route path="/addresses" element={<Profile initialTab="addresses" />} />
        <Route path="/notifications" element={<Profile initialTab="notifications" />} />

        {/* Information Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/millets" element={<Millets />} />
        <Route path="/contact" element={<Contact />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify" element={<VerifyEmail />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/manage-products" element={<AdminManageProduct />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/enquiries" element={<AdminEnquiries />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/profile" element={<AdminProfile />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
