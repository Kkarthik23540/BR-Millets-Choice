import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Storefront pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Millets from './pages/Millets';
import Contact from './pages/Contact';
import ContentPage from './pages/ContentPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminManageProduct from './pages/admin/AdminManageProduct';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import AdminEnquiries from './pages/admin/AdminEnquiries';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminProfile from './pages/admin/AdminProfile';

function ScrollToTopAndMeta() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }

    const titles = {
      '/': 'BR Millet Choice | Pure Millets, Healthy Living',
      '/shop': 'Shop Pure Millets | BR Millet Choice',
      '/about': 'Our Story & Customer Feedback | BR Millet Choice',
      '/millets': 'Special Millet, Nuts & Seeds Blend Ingredients | BR Millet Choice',
      '/contact': 'Contact Us | BR Millet Choice',
      '/cart': 'Your Shopping Cart | BR Millet Choice',
      '/checkout': 'Checkout & 100% Cash On Delivery | BR Millet Choice',
      '/account': 'My Account | BR Millet Choice',
      '/profile': 'Profile Details | BR Millet Choice',
      '/addresses': 'Saved Addresses | BR Millet Choice',
      '/orders': 'My Orders | BR Millet Choice',
      '/notifications': 'Notifications | BR Millet Choice',
      '/login': 'Sign In | BR Millet Choice',
      '/signup': 'Create Account | BR Millet Choice',
      '/forgot-password': 'Reset Password | BR Millet Choice',
      '/reset-password': 'Set New Password | BR Millet Choice',
      '/verify': 'Verify Email | BR Millet Choice',
      '/admin': 'Admin Dashboard | BR Millet Choice',
      '/admin/products': 'Manage Products | BR Millet Choice',
      '/admin/manage-products': 'Manage Products | BR Millet Choice',
      '/admin/orders': 'Order Management | BR Millet Choice',
      '/admin/reviews': 'Customer Reviews Moderation | BR Millet Choice',
      '/admin/enquiries': 'Customer Enquiries | BR Millet Choice',
      '/admin/customers': 'Customer Directory | BR Millet Choice',
      '/admin/profile': 'Admin Profile & Store Timings | BR Millet Choice',
    };

    if (titles[pathname]) {
      document.title = titles[pathname];
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTopAndMeta />
      <Routes>
        {/* Storefront */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/millets" element={<Millets />} />
        <Route path="/recipes" element={<Navigate to="/shop" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<ContentPage />} />
        <Route path="/shipping" element={<ContentPage />} />
        <Route path="/refunds" element={<ContentPage />} />
        <Route path="/privacy" element={<ContentPage />} />
        <Route path="/terms" element={<ContentPage />} />

        {/* Customer flows */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Profile initialTab="orders" />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/account" element={<Profile initialTab="overview" />} />
        <Route path="/profile" element={<Profile initialTab="profile" />} />
        <Route path="/addresses" element={<Profile initialTab="addresses" />} />
        <Route path="/notifications" element={<Profile initialTab="notifications" />} />
        <Route path="/preferences" element={<Profile initialTab="preferences" />} />
        <Route path="/email-preferences" element={<Profile initialTab="preferences" />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify" element={<VerifyEmail />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminManageProduct />} />
        <Route path="/admin/manage-products" element={<AdminManageProduct />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/enquiries" element={<AdminEnquiries />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/profile" element={<AdminProfile />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
