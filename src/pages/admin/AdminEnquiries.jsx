import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import BrandLoader from '../../components/BrandLoader';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminEnquiries() {
  const { showToast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [emailJobs, setEmailJobs] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    from: '',
    to: '',
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [enqRes, mailRes, auditRes] = await Promise.all([
        api('/api/admin/enquiries'),
        api('/api/admin/email-jobs').catch(() => ({ emailJobs: [] })),
        api('/api/admin/audit').catch(() => ({ events: [] })),
      ]);
      setEnquiries(enqRes.enquiries || []);
      setEmailJobs(mailRes.emailJobs || []);
      setAuditEvents(auditRes.events || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = `${item.subject} ${item.name} ${item.email} ${item.message}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (filters.from) {
        const itemDate = new Date(item.createdAt).toISOString().slice(0, 10);
        if (itemDate < filters.from) return false;
      }
      if (filters.to) {
        const itemDate = new Date(item.createdAt).toISOString().slice(0, 10);
        if (itemDate > filters.to) return false;
      }
      return true;
    });
  }, [enquiries, filters]);

  const handleUpdateStatus = async (e, id) => {
    e.preventDefault();
    const newStatus = e.target.elements.status.value;
    try {
      await api(`/api/admin/enquiries/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`✓ Status updated to ${newStatus.replaceAll('_', ' ')}.`);
      setEnquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Delete this customer enquiry?')) return;
    try {
      await api(`/api/admin/enquiries/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast('✓ Enquiry deleted.');
      setEnquiries((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleTestEmail = async () => {
    try {
      await api('/api/admin/test-email', { method: 'POST' });
      showToast('✓ Test email triggered.');
      const mailRes = await api('/api/admin/email-jobs');
      setEmailJobs(mailRes.emailJobs || []);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Customer enquiries"
        description="Search, filter, update, or delete customer messages."
      />

      <section className="container section-space">
        {/* Filter Panel */}
        <form className="admin-filter-panel mb-3" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="admin-filter-grid">
            <div>
              <label className="form-label small" htmlFor="enquiries-search">Search</label>
              <input
                className="form-control"
                id="enquiries-search"
                name="search"
                type="search"
                placeholder="Name, email, subject, or message"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label small" htmlFor="enquiries-status">Status</label>
              <select
                className="form-select"
                id="enquiries-status"
                name="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="form-label small" htmlFor="enquiries-from">From</label>
              <input
                className="form-control"
                id="enquiries-from"
                name="from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label small" htmlFor="enquiries-to">To</label>
              <input
                className="form-control"
                id="enquiries-to"
                name="to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
          </div>
          <p className="small text-secondary mt-2 mb-0">
            {filteredEnquiries.length} result{filteredEnquiries.length === 1 ? '' : 's'}
          </p>
        </form>

        {/* Enquiry Cards */}
        {loading ? (
          <BrandLoader message="Loading customer enquiries…" />
        ) : filteredEnquiries.length > 0 ? (
          filteredEnquiries.map((item) => (
            <article key={item.id} className="enquiry-card-elevated mb-3">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="enquiry-avatar">
                    {item.name ? item.name.trim().slice(0, 1).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="h6 mb-0 text-dark fw-bold">{item.subject}</h3>
                    <span className="small text-secondary">
                      {item.name} ·{' '}
                      <a href={`mailto:${encodeURIComponent(item.email)}`} className="text-decoration-none text-forest">
                        {item.email}
                      </a>
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`enquiry-status-badge status-${item.status}`}>
                    {item.status.replaceAll('_', ' ')}
                  </span>
                  <span className="small text-secondary text-nowrap">
                    {new Date(item.createdAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <div className="enquiry-body my-3">
                <p className="enquiry-message mb-0">{item.message}</p>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
                <form className="d-flex align-items-center gap-2" onSubmit={(e) => handleUpdateStatus(e, item.id)}>
                  <select
                    className="form-select form-select-sm"
                    name="status"
                    defaultValue={item.status}
                    style={{ width: 'auto' }}
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button className="btn btn-sm btn-brand-soft" type="submit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Save Status
                  </button>
                </form>

                <button
                  type="button"
                  className="btn btn-sm btn-danger-soft"
                  onClick={() => handleDeleteEnquiry(item.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Enquiry
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state mt-3">No enquiries match these filters.</p>
        )}

        {/* Email Jobs & Recent Activity */}
        <div className="row g-4 mt-4">
          <div className="col-lg-6">
            <div className="feature-card h-100 p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h5 mb-0 fw-bold">Email Notifications</h2>
                <button className="btn btn-sm btn-outline-brand" type="button" onClick={handleTestEmail}>
                  ⚡ Send test email
                </button>
              </div>
              <p className="small text-secondary mb-3">
                Delivery log for customer order confirmations, receipts, and admin alerts.
              </p>
              <ul className="small ps-3 mb-0">
                {emailJobs.length > 0 ? (
                  emailJobs.map((job) => (
                    <li key={job.id}>
                      {job.template} → {job.recipient} · {job.status}
                      {job.lastError ? ` · ${job.lastError}` : ''}
                    </li>
                  ))
                ) : (
                  <li>No email jobs recorded.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="feature-card h-100 p-3">
              <h2 className="h5 mb-2 fw-bold">Recent Admin Activity</h2>
              <ul className="small ps-3 mb-0">
                {auditEvents.length > 0 ? (
                  auditEvents.map((event) => (
                    <li key={event.id}>
                      {event.action} · {event.entityType} {event.entityId ?? ''} ·{' '}
                      {new Date(event.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </li>
                  ))
                ) : (
                  <li>No audit events yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
