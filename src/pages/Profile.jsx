import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, money } from '../services/api';

const VALID_TABS = ['profile', 'preferences', 'addresses', 'orders', 'notifications', 'overview'];

export default function Profile({ initialTab = null }) {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  const resolveTab = useCallback(() => {
    const p = location.pathname;
    const h = (location.hash || '').replace('#', '').replace('account-', '');
    if (p === '/orders' || h === 'orders') return 'orders';
    if (p === '/addresses' || h === 'addresses') return 'addresses';
    if (p === '/notifications' || h === 'notifications') return 'notifications';
    if (p === '/account' || h === 'overview') return 'overview';
    if (p === '/preferences' || p === '/email-preferences' || h === 'preferences') return 'preferences';
    if (p === '/profile' || h === 'profile') return 'profile';
    if (initialTab && VALID_TABS.includes(initialTab)) return initialTab;
    return 'profile';
  }, [location.pathname, location.hash, initialTab]);

  const [activeTab, setActiveTab] = useState(resolveTab);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [emailPreferences, setEmailPreferences] = useState({
    orderUpdates: true,
    enquiryAcknowledgements: true,
    backInStock: true,
    promotions: false,
  });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);

  // Add address state
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    recipientName: user?.fullName || '',
    phone: '',
    line1: '',
    line2: '',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '',
    isDefault: false,
  });

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Sync tab on URL / hash changes
  useEffect(() => {
    setActiveTab(resolveTab());
  }, [resolveTab]);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user || user.role === 'admin') return;
    setLoading(true);
    try {
      const [addrRes, orderRes, notifRes, prefRes] = await Promise.all([
        api('/api/addresses').then((r) => r.addresses).catch(() => []),
        api('/api/orders').then((r) => r.orders).catch(() => []),
        api('/api/notifications').catch(() => ({ notifications: [], unreadCount: 0 })),
        api('/api/profile/email-preferences').then((r) => r.preferences).catch(() => ({
          orderUpdates: true,
          enquiryAcknowledgements: true,
          backInStock: true,
          promotions: false,
        })),
      ]);
      setAddresses(addrRes || []);
      setOrders(orderRes || []);
      setNotifications(notifRes || { notifications: [], unreadCount: 0 });
      if (prefRes) setEmailPreferences(prefRes);
    } catch (err) {
      console.warn('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // If user is admin, redirect to Admin Profile
  if (user?.role === 'admin') {
    return <Navigate to="/admin/profile" replace />;
  }

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Your account" title="Sign in required" />
        <section className="container section-space py-5 text-center">
          <p className="text-secondary mb-4">Please sign in to view your profile.</p>
          <Link to="/login" className="btn btn-brand">Sign In</Link>
        </section>
      </>
    );
  }

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `/profile#${tab}`);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName }),
      });
      showToast('✓ Profile updated successfully.');
      await refreshUser();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      await api('/api/profile/email-preferences', {
        method: 'PUT',
        body: JSON.stringify(emailPreferences),
      });
      showToast('✓ Email preferences saved.');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/auth/verification/resend', {
        method: 'POST',
        body: JSON.stringify({ email: user.email }),
      });
      showToast(res.message || 'Verification email resent.');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      });
      showToast('✓ Address saved successfully.');
      setNewAddress({
        label: 'Home',
        recipientName: user.fullName,
        phone: '',
        line1: '',
        line2: '',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '',
        isDefault: false,
      });
      const data = await api('/api/addresses');
      setAddresses(data.addresses || []);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api(`/api/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast('Address deleted.');
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Cancel this order request?')) return;
    try {
      await api(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      showToast('✓ Order cancelled.');
      await loadData();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleMarkNotification = async (id) => {
    try {
      await api(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
      setNotifications((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
      }));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE') {
      showToast('Please type DELETE to confirm.', true);
      return;
    }
    if (!window.confirm('Are you absolutely sure? This will delete your account permanently.')) return;
    try {
      await api('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({
          ...(deletePassword ? { currentPassword: deletePassword } : {}),
          confirm: 'DELETE',
        }),
      });
      showToast('Account deleted.');
      logout();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const initialLetter = user.fullName
    ? user.fullName.trim().slice(0, 1).toUpperCase()
    : 'U';

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="My profile"
        description="Manage your personal details, saved addresses, order history, and account settings."
      />

      <section className="container profile-section">
        <div className="profile-layout">
          {/* Left Sidebar inside page (Side-by-side on laptop, compact & horizontal scrollable on mobile) */}
          <aside className="profile-sidebar feature-card">
            <div className="profile-avatar" aria-hidden="true">
              {initialLetter}
            </div>
            <h2 className="h4 text-break mb-1 fw-bold">{user.fullName}</h2>
            <p className="profile-email text-break mb-2 small">{user.email}</p>
            <span className={`profile-status ${user.emailVerified ? 'is-verified' : 'is-unverified'}`}>
              {user.emailVerified ? '✓ Email verified' : '⚠️ Email unverified'}
            </span>

            <nav className="profile-nav mt-4" aria-label="Profile navigation">
              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('profile')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                </svg>
                <span>Profile details</span>
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('preferences')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Email preferences</span>
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'addresses' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('addresses')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>Delivery addresses</span>
                {addresses.length > 0 && <span className="profile-tab-count">{addresses.length}</span>}
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('orders')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m9 12 2 2 4-4" />
                </svg>
                <span>Order history</span>
                {orders.length > 0 && <span className="profile-tab-count">{orders.length}</span>}
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('notifications')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Notifications</span>
                {notifications.unreadCount > 0 && (
                  <span className="profile-tab-count is-alert">{notifications.unreadCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('overview')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
                <span>Account overview</span>
              </button>
            </nav>
          </aside>

          {/* Right Main: All panels contained in one page side-by-side */}
          <div className="profile-main">
            {/* 1. Profile Details Tab (shows Details + Email Preferences + Verification on same page!) */}
            <div className={`profile-panel ${activeTab === 'profile' ? 'active-tab-panel' : ''}`}>
              <div className="feature-card">
                <p className="eyebrow mb-1">PERSONAL INFORMATION</p>
                <h2 className="h4 mb-3">Profile details</h2>
                <form onSubmit={handleSaveProfile}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="profile-name">Full name</label>
                    <input
                      className="form-control"
                      id="profile-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="profile-email">Email address</label>
                    <input className="form-control" id="profile-email" type="email" value={user.email} readOnly />
                    <div className="form-text">Your sign-in email can’t be changed here.</div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand" type="submit">Save changes</button>
                    <button className="btn btn-outline-brand" type="button" onClick={() => handleTabSwitch('overview')}>
                      Back to account
                    </button>
                  </div>
                </form>
              </div>

              <div className="feature-card mt-3">
                <h2 className="h5 mb-2">Email verification</h2>
                <p className="small text-secondary mb-0">
                  {user.emailVerified
                    ? 'Your email address is confirmed and ready for account updates.'
                    : 'Confirm your email address to unlock all account features.'}
                </p>
                {!user.emailVerified && (
                  <form onSubmit={handleResendVerification} className="mt-3">
                    <button className="btn btn-outline-brand btn-sm" type="submit">
                      Resend verification email
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* 2. Email Preferences Tab (Stand-alone tab view with side layout) */}
            <div className={`profile-panel ${activeTab === 'preferences' ? 'active-tab-panel' : ''}`}>
              <div className="feature-card">
                <p className="eyebrow mb-1">YOUR CHOICES</p>
                <h2 className="h4 mb-2">Email preferences</h2>
                <p className="small text-secondary mb-3">
                  Choose which optional account emails you receive. Security emails for verification and password changes are always sent.
                </p>
                <form onSubmit={handleSavePreferences} className="email-preferences-form">
                  <label className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={emailPreferences.orderUpdates}
                      onChange={(e) => setEmailPreferences({ ...emailPreferences, orderUpdates: e.target.checked })}
                    />
                    <span className="form-check-label">Order and payment updates</span>
                  </label>
                  <label className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={emailPreferences.enquiryAcknowledgements}
                      onChange={(e) => setEmailPreferences({ ...emailPreferences, enquiryAcknowledgements: e.target.checked })}
                    />
                    <span className="form-check-label">Enquiry acknowledgements</span>
                  </label>
                  <label className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={emailPreferences.backInStock}
                      onChange={(e) => setEmailPreferences({ ...emailPreferences, backInStock: e.target.checked })}
                    />
                    <span className="form-check-label">Back-in-stock alerts</span>
                  </label>
                  <label className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={emailPreferences.promotions}
                      onChange={(e) => setEmailPreferences({ ...emailPreferences, promotions: e.target.checked })}
                    />
                    <span className="form-check-label">News and promotions</span>
                  </label>
                  <button className="btn btn-brand mt-3" type="submit">
                    Save email preferences
                  </button>
                </form>
              </div>
            </div>

            {/* 3. Delivery Addresses Tab */}
            <div className={`profile-panel ${activeTab === 'addresses' ? 'active-tab-panel' : ''}`}>
              <div className="feature-card">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                  <div>
                    <p className="eyebrow mb-1">Delivery information</p>
                    <h2 className="h4 mb-0">Saved delivery addresses</h2>
                  </div>
                  <span className="account-count">{addresses.length}</span>
                </div>

                {addresses.length > 0 ? (
                  <div className="account-address-list">
                    {addresses.map((addr) => (
                      <article key={addr.id} className="address-card account-address-card mb-3">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <h3 className="h6 mb-2 fw-bold text-forest">
                            {addr.label} {addr.isDefault && <span className="status-pill ms-2">Default</span>}
                          </h3>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            Delete
                          </button>
                        </div>
                        <p className="small text-secondary mb-0">
                          {addr.recipientName} · {addr.phone}
                          <br />
                          {addr.line1} {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} {addr.postalCode}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary mb-3">No saved addresses yet. Add one below to use it at checkout.</p>
                )}

                <details className="address-form-disclosure mt-3" open={addresses.length === 0}>
                  <summary className="fw-semibold text-forest" style={{ cursor: 'pointer' }}>
                    + Add new delivery address
                  </summary>
                  <form onSubmit={handleAddAddress} className="mt-3">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small">Label (e.g. Home, Office)</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small">Recipient Name</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.recipientName}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small">Contact Phone Number</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          type="tel"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small">Address Line 1</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.line1}
                          onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">City</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">State</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">Postal Code (PIN)</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        />
                      </div>
                    </div>
                    <button className="btn btn-brand btn-sm mt-3" type="submit">
                      Save delivery address
                    </button>
                  </form>
                </details>
              </div>
            </div>

            {/* 3. Order History Tab */}
            <div className={`profile-panel ${activeTab === 'orders' ? 'active-tab-panel' : ''}`}>
              <div className="feature-card">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                  <div>
                    <p className="eyebrow mb-1">Purchases</p>
                    <h2 className="h4 mb-0">My orders</h2>
                  </div>
                  <span className="account-count">{orders.length}</span>
                </div>

                {orders.length > 0 ? (
                  <div className="account-order-list">
                    {orders.map((o) => (
                      <article key={o.id} className="account-order-card mb-3 p-3 rounded-3 bg-white border">
                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                          <div>
                            <strong className="text-dark">{o.orderNumber}</strong>
                            <p className="small text-secondary mb-1">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}
                            </p>
                          </div>
                          <span className="status-pill">{o.status.replaceAll('_', ' ')}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center gap-2 mt-2">
                          <span className="small text-secondary">Payment: <strong className="text-capitalize">{o.paymentStatus}</strong> (COD)</span>
                          <strong className="text-forest fs-5">{money(o.totalPaise)}</strong>
                        </div>
                        <div className="d-flex gap-2 mt-3 pt-2 border-top">
                          <Link className="btn btn-sm btn-outline-brand" to={`/orders/${o.id}`}>
                            View order receipt
                          </Link>
                          {['awaiting_confirmation', 'confirmed'].includes(o.status) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleCancelOrder(o.id)}
                            >
                              Cancel request
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-secondary mb-3">You have not submitted any order requests yet.</p>
                    <Link to="/shop" className="btn btn-brand btn-sm">
                      Browse Millets &amp; Shop
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Notifications Tab */}
            <div className={`profile-panel ${activeTab === 'notifications' ? 'active-tab-panel' : ''}`}>
              <div className="feature-card">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                  <div>
                    <p className="eyebrow mb-1">Updates</p>
                    <h2 className="h4 mb-0">Notifications</h2>
                  </div>
                  {notifications.unreadCount > 0 && (
                    <span className="profile-tab-count is-alert">{notifications.unreadCount}</span>
                  )}
                </div>

                {notifications.notifications?.length > 0 ? (
                  notifications.notifications.map((n) => (
                    <article key={n.id} className={`account-notification ${n.readAt ? '' : 'is-unread'} mb-2 p-3 rounded-3 border`}>
                      <div className="d-flex justify-content-between gap-2">
                        <strong className="h6 mb-1 text-dark">{n.title}</strong>
                        <span className="small text-secondary">
                          {new Date(n.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      </div>
                      <p className="small text-secondary mb-2">{n.body}</p>
                      {!n.readAt && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-success fw-semibold text-decoration-none"
                          onClick={() => handleMarkNotification(n.id)}
                        >
                          ✓ Mark as read
                        </button>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="text-secondary mb-0">No notifications yet.</p>
                )}
              </div>
            </div>

            {/* 5. Account Overview Tab */}
            <div className={`profile-panel ${activeTab === 'overview' ? 'active-tab-panel' : ''}`}>
              <div className="feature-card">
                <p className="eyebrow mb-1">Account settings</p>
                <h2 className="h4 mb-3">Security &amp; Account Overview</h2>
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <span className="d-block small text-secondary">Total Orders</span>
                      <strong className="fs-4 text-forest">{orders.length}</strong>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <span className="d-block small text-secondary">Saved Addresses</span>
                      <strong className="fs-4 text-forest">{addresses.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="h6 fw-bold mb-2">Password Management</h3>
                  <Link to="/forgot-password" className="btn btn-outline-brand btn-sm">
                    Reset or change password
                  </Link>
                </div>

                <div className="border-top pt-4" id="account-delete">
                  <h3 className="h6 fw-bold text-danger mb-2">Delete Account</h3>
                  <p className="small text-secondary mb-3">
                    Permanently delete your profile and personal data. This cannot be undone.
                  </p>
                  <form onSubmit={handleDeleteAccount} style={{ maxWidth: '400px' }}>
                    <div className="mb-2">
                      <label className="form-label small">Type DELETE to confirm</label>
                      <input
                        className="form-control form-control-sm"
                        required
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                      />
                    </div>
                    {user.hasPassword && (
                      <div className="mb-2">
                        <label className="form-label small">Current password</label>
                        <input
                          type="password"
                          className="form-control form-control-sm"
                          required
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                        />
                      </div>
                    )}
                    <button type="submit" className="btn btn-outline-danger btn-sm">
                      Permanently Delete Account
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
