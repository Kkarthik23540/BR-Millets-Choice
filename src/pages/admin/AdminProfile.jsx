import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { api, formatTime12 } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminProfile() {
  const { user, refreshUser, refreshConfig } = useAuth();
  const { showToast } = useToast();

  const [adminName, setAdminName] = useState(user?.fullName || '');
  const [businessDetails, setBusinessDetails] = useState({
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    daysOpen: 'Monday to Saturday',
    openTime: '09:00',
    closeTime: '21:00',
    autoSchedule: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.fullName) setAdminName(user.fullName);
    api('/api/admin/business-details')
      .then((data) => {
        const d = data.details || {};
        setBusinessDetails({
          address: d.address || '',
          phone: d.phone || '',
          email: d.email || '',
          whatsapp: d.whatsapp || '',
          daysOpen: d.daysOpen || 'Monday to Saturday',
          openTime: d.openTime || '09:00',
          closeTime: d.closeTime || '21:00',
          autoSchedule: d.autoSchedule ?? false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaveAdminName = async (e) => {
    e.preventDefault();
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: adminName }),
      });
      await refreshUser();
      showToast('✓ Administrator name updated.');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleSaveBusinessDetails = async (e) => {
    e.preventDefault();
    const formattedHours = `${businessDetails.daysOpen}, ${formatTime12(businessDetails.openTime)} – ${formatTime12(businessDetails.closeTime)}`;
    try {
      await api('/api/admin/business-details', {
        method: 'PUT',
        body: JSON.stringify({
          address: businessDetails.address,
          phone: businessDetails.phone,
          email: businessDetails.email,
          whatsapp: businessDetails.whatsapp,
          hours: formattedHours,
          openTime: businessDetails.openTime,
          closeTime: businessDetails.closeTime,
          daysOpen: businessDetails.daysOpen,
          autoSchedule: businessDetails.autoSchedule,
        }),
      });
      showToast('✓ Public business details and operating hours saved!');
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const initials = user?.fullName ? user.fullName.trim().slice(0, 1).toUpperCase() : 'A';

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Admin Profile &amp; Store Setup"
        description="Manage your administrator account, contact info, working hours, and store settings."
      />

      <section className="container section-space py-4">
        <div className="row g-4 justify-content-center">
          <div className="col-lg-8">
            {/* Admin Name Card */}
            <div className="p-4 bg-white rounded-4 border shadow-xs mb-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="profile-avatar mb-0" style={{ width: '3.5rem', height: '3.5rem', fontSize: '1.5rem' }}>
                  {initials}
                </div>
                <div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle mb-1">
                    Store Administrator
                  </span>
                  <h2 className="h5 fw-bold text-dark mb-0">{user?.fullName}</h2>
                  <small className="text-secondary">{user?.email}</small>
                </div>
              </div>

              <form onSubmit={handleSaveAdminName}>
                <div className="row g-2 align-items-end">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Administrator Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <button type="submit" className="btn btn-sm btn-brand rounded-pill w-100">
                      Save Name
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Public Business Details & Hours */}
            <div className="p-4 bg-white rounded-4 border shadow-xs">
              <h3 className="h5 fw-bold text-dark mb-1">Public Business Details</h3>
              <p className="small text-secondary mb-4">
                These contact details and hours appear on the storefront Contact page for customer enquiries.
              </p>

              <form onSubmit={handleSaveBusinessDetails}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Store Address</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      value={businessDetails.address}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, address: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Contact Phone</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={businessDetails.phone}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, phone: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Contact Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      value={businessDetails.email}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, email: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">WhatsApp Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={businessDetails.whatsapp}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, whatsapp: e.target.value })}
                    />
                  </div>

                  {/* Business Hours */}
                  <div className="col-12">
                    <hr className="my-2" />
                    <h4 className="h6 fw-bold mb-3">Operating Hours &amp; Schedule</h4>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Working Days</label>
                    <select
                      className="form-select form-select-sm"
                      value={businessDetails.daysOpen}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, daysOpen: e.target.value })}
                    >
                      <option value="Monday to Saturday">Monday to Saturday (6 days)</option>
                      <option value="Monday to Sunday">Monday to Sunday (All 7 days)</option>
                      <option value="Monday to Friday">Monday to Friday (5 days)</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Opening Time</label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={businessDetails.openTime}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, openTime: e.target.value })}
                    />
                    <small className="text-secondary">{formatTime12(businessDetails.openTime)}</small>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Closing Time</label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={businessDetails.closeTime}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, closeTime: e.target.value })}
                    />
                    <small className="text-secondary">{formatTime12(businessDetails.closeTime)}</small>
                  </div>
                </div>

                <button type="submit" className="btn btn-brand rounded-pill px-5 py-2 mt-4 fw-bold">
                  Save Business Details
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
