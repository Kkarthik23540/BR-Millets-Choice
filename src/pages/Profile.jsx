import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, money } from '../services/api';

const VALID_TABS = ['profile', 'preferences', 'addresses', 'orders', 'notifications', 'overview'];

export default function Profile({ initialTab = null }) {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL hash or prop
  const hashTab = (location.hash || '').replace('#', '').replace('account-', '');
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab && VALID_TABS.includes(initialTab)) return initialTab;
    if (hashTab && VALID_TABS.includes(hashTab)) return hashTab;
    return 'profile';
  });

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
  const [restock, setRestock] = useState({ subscriptions: [] });
  const [loading, setLoading] = useState(true);

  // Address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
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

  // Account delete form state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user]);

  useEffect(() => {
    if (hashTab && VALID_TABS.includes(hashTab)) {
      setActiveTab(hashTab);
    }
  }, [hashTab]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [addrRes, orderRes, notifRes, restockRes, prefRes] = await Promise.all([
        api('/api/addresses').then((r) => r.addresses).catch(() => []),
        api('/api/orders').then((r) => r.orders).catch(() => []),
        api('/api/notifications').catch(() => ({ notifications: [], unreadCount: 0 })),
        api('/api/restock-subscriptions').catch(() => ({ subscriptions: [] })),
        api('/api/profile/email-preferences').then((r) => r.preferences).catch(() => ({
          orderUpdates: true,
          enquiryAcknowledgements: true,
          backInStock: true,
          promotions: false,
        })),
      ]);
      setAddresses(addrRes);
      setOrders(orderRes);
      setNotifications(notifRes);
      setRestock(restockRes);
      setEmailPreferences(prefRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Your account" title="Sign in required" />
        <section className="container section-space text-center py-5">
          <div className="p-4 bg-white rounded-4 border mx-auto" style={{ maxWidth: '440px' }}>
            <span className="fs-1 d-block mb-2">🔐</span>
            <h2 className="h5 fw-bold text-dark mb-2">This page is private</h2>
            <p className="small text-secondary mb-3">Sign in to access your profile details and orders.</p>
            <Link to="/login" className="btn btn-brand rounded-pill px-4">
              Sign in
            </Link>
          </div>
        </section>
      </>
    );
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `${location.pathname}#${tab}`);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName }),
      });
      await refreshUser();
      showToast('✓ Profile updated successfully.');
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

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(addressForm),
      });
      showToast('✓ Address saved successfully.');
      setIsAddingAddress(false);
      setAddressForm({
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

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api(`/api/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE' });
      showToast('Address deleted.');
      setAddresses(addresses.filter((a) => a.id !== addressId));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleMarkNotificationRead = async (id) => {
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

  const handleRemoveRestock = async (variantId) => {
    try {
      await api(`/api/restock-subscriptions/${encodeURIComponent(variantId)}`, { method: 'DELETE' });
      showToast('Subscription removed.');
      setRestock((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.variantId !== variantId),
      }));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm.', true);
      return;
    }
    if (!window.confirm('Are you absolutely sure? This action is permanent and irreversible.')) return;
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

  const initials = user.fullName ? user.fullName.trim().slice(0, 1).toUpperCase() : 'U';

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="My profile"
        description="Manage your personal details, email preferences, saved addresses, order history, and account settings."
      />

      <section className="container profile-section py-4">
        <div className="profile-layout">
          {/* Left Sidebar inside Profile Page */}
          <aside className="profile-sidebar feature-card p-3 p-md-4">
            <div className="profile-avatar" aria-hidden="true">
              {initials}
            </div>
            <h2 className="h5 text-break mb-1 fw-bold text-center text-md-start">{user.fullName}</h2>
            <p className="profile-email text-break mb-2 small text-center text-md-start">{user.email}</p>
            <div className="text-center text-md-start mb-3">
              <span className={`profile-status ${user.emailVerified ? 'is-verified' : 'is-unverified'}`}>
                {user.emailVerified ? '✓ Email verified' : '⚠️ Email unverified'}
              </span>
            </div>

            <nav className="profile-nav mt-3" aria-label="Profile navigation">
              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabClick('profile')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                </svg>
                <span>Profile details</span>
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => handleTabClick('preferences')}
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
                onClick={() => handleTabClick('addresses')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Delivery addresses</span>
                {addresses.length > 0 && <span className="profile-tab-count">{addresses.length}</span>}
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => handleTabClick('orders')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Order history</span>
                {orders.length > 0 && <span className="profile-tab-count">{orders.length}</span>}
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabClick('notifications')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Notifications</span>
                {notifications.unreadCount > 0 && (
                  <span className="profile-tab-count is-alert">{notifications.unreadCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`profile-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabClick('overview')}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
                <span>Account overview</span>
              </button>
            </nav>
          </aside>

          {/* Right Main Panels */}
          <div className="profile-main">
            {/* 1. Profile Details Panel */}
            {activeTab === 'profile' && (
              <div className="profile-panel active-tab-panel">
                <div className="feature-card p-4">
                  <p className="eyebrow mb-1">Personal information</p>
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
                    <button className="btn btn-brand rounded-pill px-4" type="submit">
                      Save changes
                    </button>
                  </form>
                </div>

                <div className="feature-card p-4 mt-3">
                  <h3 className="h5 mb-2">Email verification</h3>
                  <p className="small text-secondary mb-0">
                    {user.emailVerified
                      ? 'Your email address is confirmed and ready for account updates.'
                      : 'Confirm your email address to unlock all account features.'}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Email Preferences Panel (Separate Panel) */}
            {activeTab === 'preferences' && (
              <div className="profile-panel active-tab-panel">
                <div className="feature-card p-4">
                  <p className="eyebrow mb-1">Your choices</p>
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

                    <button className="btn btn-brand rounded-pill px-4 mt-3 align-self-start" type="submit">
                      Save email preferences
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 3. Delivery Addresses Panel */}
            {activeTab === 'addresses' && (
              <div className="profile-panel active-tab-panel">
                <div className="feature-card p-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                    <div>
                      <p className="eyebrow mb-1">Delivery information</p>
                      <h2 className="h4 mb-0">Saved delivery addresses</h2>
                    </div>
                    <span className="account-count">{addresses.length}</span>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {addresses.map((address) => (
                        <article key={address.id} className="p-3 rounded-3 border bg-light">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <h3 className="h6 mb-2 fw-bold text-forest">
                              {address.label} {address.isDefault && <span className="status-pill ms-2">Default</span>}
                            </h3>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-pill px-3"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              Delete
                            </button>
                          </div>
                          <p className="small text-secondary mb-0">
                            {address.recipientName} · {address.phone}
                            <br />
                            {address.line1} {address.line2 || ''}
                            <br />
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary mb-3">No saved addresses yet. Add one below to use it at checkout.</p>
                  )}

                  {/* Add New Address Accordion */}
                  <div className="mt-4 pt-3 border-top">
                    {!isAddingAddress ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-brand rounded-pill px-3"
                        onClick={() => setIsAddingAddress(true)}
                      >
                        + Add new delivery address
                      </button>
                    ) : (
                      <form onSubmit={handleAddAddress} className="mt-2">
                        <h4 className="h6 fw-bold mb-3">New Delivery Address</h4>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Label (e.g. Home, Office)</label>
                            <input
                              className="form-control form-control-sm"
                              value={addressForm.label}
                              onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Recipient Name</label>
                            <input
                              className="form-control form-control-sm"
                              required
                              value={addressForm.recipientName}
                              onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">Phone Number</label>
                            <input
                              className="form-control form-control-sm"
                              required
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">Address Line 1</label>
                            <input
                              className="form-control form-control-sm"
                              required
                              value={addressForm.line1}
                              onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">Address Line 2 (optional)</label>
                            <input
                              className="form-control form-control-sm"
                              value={addressForm.line2}
                              onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">City</label>
                            <input
                              className="form-control form-control-sm"
                              required
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">State</label>
                            <input
                              className="form-control form-control-sm"
                              required
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Postal Code</label>
                            <input
                              className="form-control form-control-sm"
                              required
                              value={addressForm.postalCode}
                              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                          <button type="submit" className="btn btn-sm btn-brand rounded-pill px-4">
                            Save Address
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                            onClick={() => setIsAddingAddress(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Order History Panel */}
            {activeTab === 'orders' && (
              <div className="profile-panel active-tab-panel">
                <div className="feature-card p-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                    <div>
                      <p className="eyebrow mb-1">Purchases</p>
                      <h2 className="h4 mb-0">My orders</h2>
                    </div>
                    <span className="account-count">{orders.length}</span>
                  </div>

                  {orders.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {orders.map((order) => (
                        <article key={order.id} className="p-3 rounded-3 border bg-white shadow-xs">
                          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                            <div>
                              <strong className="text-dark">{order.orderNumber}</strong>
                              <p className="small text-secondary mb-1">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  timeZone: 'Asia/Kolkata',
                                  dateStyle: 'medium',
                                })}
                              </p>
                            </div>
                            <span className="status-pill text-capitalize">{order.status.replaceAll('_', ' ')}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center gap-2 mt-2">
                            <span className="small text-secondary">
                              Payment: <strong className="text-capitalize">{order.paymentStatus}</strong> (COD)
                            </span>
                            <strong className="text-forest fs-5">{money(order.totalPaise)}</strong>
                          </div>
                          <div className="mt-3 pt-2 border-top">
                            <Link to={`/orders/${encodeURIComponent(order.id)}`} className="btn btn-sm btn-outline-brand rounded-pill px-3">
                              View order receipt →
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-secondary mb-3">You have not placed any orders yet.</p>
                      <Link to="/shop" className="btn btn-brand btn-sm rounded-pill px-4">
                        Browse Millets &amp; Shop
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Notifications Panel */}
            {activeTab === 'notifications' && (
              <div className="profile-panel active-tab-panel">
                <div className="feature-card p-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                    <div>
                      <p className="eyebrow mb-1">Account activity</p>
                      <h2 className="h4 mb-0">Notifications</h2>
                    </div>
                    <span className="account-count">{notifications.unreadCount} unread</span>
                  </div>

                  {notifications.notifications && notifications.notifications.length > 0 ? (
                    <div className="d-flex flex-column gap-2 mb-4">
                      {notifications.notifications.map((item) => (
                        <article key={item.id} className={`p-3 rounded-3 border ${item.readAt ? 'bg-light' : 'bg-white'}`}>
                          <div className="d-flex justify-content-between gap-2 mb-1">
                            <h3 className="h6 fw-bold mb-0 text-dark">{item.title}</h3>
                            <time className="small text-secondary">
                              {new Date(item.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </time>
                          </div>
                          <p className="small text-secondary mb-2">{item.body}</p>
                          {!item.readAt && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-success fw-semibold text-decoration-none"
                              onClick={() => handleMarkNotificationRead(item.id)}
                            >
                              ✓ Mark as read
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary mb-4">No notifications yet.</p>
                  )}

                  {/* Restock Subscriptions */}
                  <h3 className="h6 fw-bold text-dark pt-3 border-top mb-3">Restock Subscriptions</h3>
                  {restock.subscriptions && restock.subscriptions.length > 0 ? (
                    <ul className="list-unstyled d-flex flex-column gap-2">
                      {restock.subscriptions.map((s) => (
                        <li key={s.variantId} className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border small">
                          <Link to={`/product/${s.slug}`} className="text-forest fw-semibold text-decoration-none">
                            {s.productName} · {s.packSize}
                          </Link>
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-danger p-0"
                            onClick={() => handleRemoveRestock(s.variantId)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="small text-secondary mb-0">No active restock alerts.</p>
                  )}
                </div>
              </div>
            )}

            {/* 6. Account Overview Panel */}
            {activeTab === 'overview' && (
              <div className="profile-panel active-tab-panel">
                <div className="feature-card p-4">
                  <p className="eyebrow mb-1">Summary</p>
                  <h2 className="h4 mb-3">Account overview</h2>
                  <div className="row g-2 mb-4">
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <span className="small text-secondary d-block">Member since</span>
                        <strong className="text-dark">
                          {new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <span className="small text-secondary d-block">Total orders</span>
                        <strong className="text-success fs-5">{orders.length}</strong>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <span className="small text-secondary d-block">Saved addresses</span>
                        <strong className="text-primary fs-5">{addresses.length}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-top mb-4">
                    <h3 className="h6 fw-bold text-dark mb-2">Password &amp; Security</h3>
                    {user.hasPassword ? (
                      <div>
                        <p className="small text-secondary mb-2">Need to update or change your password?</p>
                        <Link to="/forgot-password" className="btn btn-sm btn-outline-brand rounded-pill px-3">
                          Reset password
                        </Link>
                      </div>
                    ) : (
                      <p className="small text-secondary mb-0">
                        Signed in via Google. Your Google account credentials manage your sign-in security.
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-top mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <h3 className="h6 fw-bold text-dark mb-0">Sign out</h3>
                      <span className="small text-secondary">Sign out of your account on this device.</span>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={logout}>
                      Sign out
                    </button>
                  </div>

                  <div className="pt-3 border-top">
                    <details>
                      <summary className="text-danger fw-semibold small" style={{ cursor: 'pointer' }}>
                        Delete my account
                      </summary>
                      <div className="mt-3 p-3 bg-light border border-danger-subtle rounded-3">
                        <p className="small text-secondary mb-3">
                          Permanently removes your profile, saved addresses, and alerts. Type <strong>DELETE</strong> below to confirm.
                        </p>
                        <form onSubmit={handleDeleteAccount} className="row g-2 align-items-end">
                          {user.hasPassword && (
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold">Current password</label>
                              <input
                                type="password"
                                className="form-control form-control-sm"
                                required
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                              />
                            </div>
                          )}
                          <div className={user.hasPassword ? 'col-md-3' : 'col-md-6'}>
                            <label className="form-label small fw-semibold">Type DELETE</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              required
                              pattern="DELETE"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                            />
                          </div>
                          <div className="col-md-3">
                            <button type="submit" className="btn btn-danger btn-sm rounded-pill w-100">
                              Delete Account
                            </button>
                          </div>
                        </form>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
