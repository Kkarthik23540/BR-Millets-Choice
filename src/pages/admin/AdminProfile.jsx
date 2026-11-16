import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function AdminProfile() {
  const { user, refreshUser, refreshConfig, logout } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [details, setDetails] = useState({
    address: 'Soverign Shelters, lakdi ka pul, Hyderabad',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    whatsapp: '',
    daysOpen: 'Monday to Saturday',
    openTime: '09:00',
    closeTime: '21:00',
  });
  const [loading, setLoading] = useState(true);
  const [mapQuery, setMapQuery] = useState('Soverign Shelters, lakdi ka pul, Hyderabad');

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user]);

  useEffect(() => {
    api('/api/admin/business-details')
      .then((res) => {
        if (res.details) {
          setDetails({
            address: res.details.address || '',
            latitude: res.details.latitude != null ? String(res.details.latitude) : '',
            longitude: res.details.longitude != null ? String(res.details.longitude) : '',
            phone: res.details.phone || '',
            email: res.details.email || '',
            whatsapp: res.details.whatsapp || '',
            daysOpen: res.details.daysOpen || 'Monday to Saturday',
            openTime: res.details.openTime || '09:00',
            closeTime: res.details.closeTime || '21:00',
          });
          const q = res.details.address || (res.details.latitude && res.details.longitude ? `${res.details.latitude},${res.details.longitude}` : 'Soverign Shelters, lakdi ka pul, Hyderabad');
          setMapQuery(q);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveName = async (e) => {
    e.preventDefault();
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName }),
      });
      showToast('✓ Administrator name updated.');
      await refreshUser();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      await api('/api/admin/business-details', {
        method: 'PUT',
        body: JSON.stringify({
          address: details.address,
          latitude: details.latitude ? parseFloat(details.latitude) : null,
          longitude: details.longitude ? parseFloat(details.longitude) : null,
          phone: details.phone,
          email: details.email,
          whatsapp: details.whatsapp,
          daysOpen: details.daysOpen,
          openTime: details.openTime,
          closeTime: details.closeTime,
        }),
      });
      showToast('✓ Public business details saved.');
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setDetails((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setMapQuery(`${lat},${lng}`);
        showToast(`✓ Retrieved location: ${lat}, ${lng}`);
      },
      (err) => {
        showToast(`Could not obtain location: ${err.message}`, true);
      }
    );
  };

  const handleRefreshMap = () => {
    const q = details.address || (details.latitude && details.longitude ? `${details.latitude},${details.longitude}` : 'Soverign Shelters, lakdi ka pul, Hyderabad');
    setMapQuery(q);
  };

  const initial = user?.fullName ? user.fullName.trim().slice(0, 1).toUpperCase() : 'A';

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="My profile"
        description="Manage your administrator account and public store details."
      />

      <section className="container profile-section">
        <div className="profile-layout admin-profile-layout">
          <div className="profile-main">
            {/* Admin Name Card */}
            <section className="feature-card admin-profile-card">
              <div className="admin-profile-heading">
                <div className="profile-avatar" aria-hidden="true">
                  {initial}
                </div>
                <div>
                  <p className="eyebrow mb-1">Administrator</p>
                  <h2 className="h3 mb-1">{user?.fullName}</h2>
                  <p className="profile-email text-break mb-0">{user?.email}</p>
                </div>
              </div>

              <form className="admin-profile-name-form mt-4" onSubmit={handleSaveName}>
                <div>
                  <label className="form-label" htmlFor="profile-name">Administrator name</label>
                  <input
                    className="form-control"
                    id="profile-name"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="profile-email">Sign-in email</label>
                  <input className="form-control" id="profile-email" type="email" value={user?.email || ''} readOnly />
                </div>
                <button className="btn btn-brand align-self-end" type="submit">
                  Save name
                </button>
              </form>
            </section>

            {/* Public Business Details Card */}
            <section className="feature-card mt-3">
              <p className="eyebrow mb-1">Shown to customers</p>
              <h2 className="h4 mb-2">Public business details</h2>
              <p className="small text-secondary mb-3">
                These details appear on the Contact page. Enter your address or click &quot;Use GPS coordinates&quot; to preview your pin on Google Maps.
              </p>

              <form className="admin-business-form" onSubmit={handleSaveDetails}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="business-address">
                    Business address / location
                  </label>
                  <textarea
                    className="form-control"
                    id="business-address"
                    name="address"
                    rows={2}
                    maxLength={500}
                    value={details.address}
                    onChange={(e) => setDetails({ ...details, address: e.target.value })}
                  />
                </div>

                <div className="business-location-picker mb-3">
                  <div className="d-flex flex-wrap gap-2 mb-2 align-items-center justify-content-between">
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-brand" type="button" onClick={handleUseGps}>
                        Use GPS coordinates
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={handleRefreshMap}>
                        Refresh Google Map
                      </button>
                    </div>
                    <a
                      className="btn btn-sm btn-outline-brand"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="me-1" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Open in Google Maps
                    </a>
                  </div>

                  <div className="google-map-container mb-2">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Maps business location"
                    />
                  </div>

                  <p className="small text-secondary mb-0">
                    {details.latitude && details.longitude
                      ? `Google Maps location active: ${Number(details.latitude).toFixed(6)}, ${Number(details.longitude).toFixed(6)}`
                      : 'Google Maps displays your business location based on your address and coordinates.'}
                  </p>
                </div>

                <div className="admin-form-row-3">
                  <div>
                    <label className="form-label" htmlFor="business-phone">Contact phone</label>
                    <input
                      className="form-control"
                      id="business-phone"
                      name="phone"
                      type="tel"
                      maxLength={40}
                      value={details.phone}
                      onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="business-email">Contact email</label>
                    <input
                      className="form-control"
                      id="business-email"
                      name="email"
                      type="email"
                      maxLength={254}
                      value={details.email}
                      onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="business-whatsapp">WhatsApp number</label>
                    <input
                      className="form-control"
                      id="business-whatsapp"
                      name="whatsapp"
                      type="tel"
                      maxLength={40}
                      placeholder="+91..."
                      value={details.whatsapp}
                      onChange={(e) => setDetails({ ...details, whatsapp: e.target.value })}
                    />
                  </div>
                </div>

                <hr className="my-3" />

                <div>
                  <h3 className="h5 fw-bold text-dark mb-1">Store Timings &amp; Working Days</h3>
                  <p className="small text-secondary mb-3">
                    Customers see these operating hours on your storefront Contact page.
                  </p>
                  <div className="admin-form-row-timing">
                    <div>
                      <label className="form-label" htmlFor="business-days">Working days / dates</label>
                      <input
                        className="form-control"
                        id="business-days"
                        name="daysOpen"
                        value={details.daysOpen}
                        onChange={(e) => setDetails({ ...details, daysOpen: e.target.value })}
                        placeholder="e.g. Monday to Saturday"
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="business-open-time">Opening time</label>
                      <input
                        className="form-control"
                        id="business-open-time"
                        name="openTime"
                        type="time"
                        value={details.openTime}
                        onChange={(e) => setDetails({ ...details, openTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="business-close-time">Closing time</label>
                      <input
                        className="form-control"
                        id="business-close-time"
                        name="closeTime"
                        type="time"
                        value={details.closeTime}
                        onChange={(e) => setDetails({ ...details, closeTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-business-save mt-3">
                  <button className="btn btn-brand btn-lg" type="submit">
                    Save public details
                  </button>
                </div>
              </form>
            </section>

            {/* Sign Out Card */}
            <section className="feature-card mt-3">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="eyebrow mb-1">Session</p>
                  <h3 className="h4 mb-1">Sign out</h3>
                  <p className="small text-secondary mb-0">Sign out of your administrator account on this browser.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
                  onClick={logout}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
