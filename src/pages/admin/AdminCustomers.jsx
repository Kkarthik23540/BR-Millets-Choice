import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import BrandLoader from '../../components/BrandLoader';
import { api, money } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminCustomers() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    from: '',
    to: '',
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/customers');
      setCustomers(res.customers || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const isVerified = customer.emailVerifiedAt ? 'verified' : 'unverified';
      if (filters.status && isVerified !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = `${customer.fullName} ${customer.email}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (filters.from) {
        const itemDate = new Date(customer.createdAt).toISOString().slice(0, 10);
        if (itemDate < filters.from) return false;
      }
      if (filters.to) {
        const itemDate = new Date(customer.createdAt).toISOString().slice(0, 10);
        if (itemDate > filters.to) return false;
      }
      return true;
    });
  }, [customers, filters]);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Customers"
        description="Review customer accounts, verification, and order summaries."
      />

      <section className="container section-space">
        <p className="small text-secondary">
          Customer contact and order summary only; private delivery addresses are not displayed here.
        </p>

        {/* Filters */}
        <form className="admin-filter-panel mb-3" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="admin-filter-grid">
            <div>
              <label className="form-label small" htmlFor="customers-search">Search</label>
              <input
                className="form-control"
                id="customers-search"
                name="search"
                type="search"
                placeholder="Customer name or email"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label small" htmlFor="customers-status">Email status</label>
              <select
                className="form-select"
                id="customers-status"
                name="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Not verified</option>
              </select>
            </div>
            <div>
              <label className="form-label small" htmlFor="customers-from">From</label>
              <input
                className="form-control"
                id="customers-from"
                name="from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label small" htmlFor="customers-to">To</label>
              <input
                className="form-control"
                id="customers-to"
                name="to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
          </div>
          <p className="small text-secondary mt-2 mb-0">
            {filteredCustomers.length} result{filteredCustomers.length === 1 ? '' : 's'}
          </p>
        </form>

        {/* Customer list */}
        {loading ? (
          <BrandLoader message="Loading customers directory…" />
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const isVerified = Boolean(customer.emailVerifiedAt);
            const initial = customer.fullName ? customer.fullName.trim().slice(0, 1).toUpperCase() : 'U';

            return (
              <article key={customer.id} className="customer-card-elevated mb-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <div className="customer-avatar">{initial}</div>
                    <div>
                      <h3 className="h6 mb-0 fw-bold text-dark">{customer.fullName}</h3>
                      <a className="small text-secondary text-decoration-none" href={`mailto:${encodeURIComponent(customer.email)}`}>
                        {customer.email}
                      </a>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      isVerified
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-warning-subtle text-warning border border-warning-subtle'
                    } px-2 py-1 rounded-pill`}
                  >
                    {isVerified ? '✓ Email Verified' : '⚠️ Unverified'}
                  </span>
                </div>

                <div className="row g-2 mt-2">
                  <div className="col-sm-4">
                    <div className="stat-pill">
                      <span className="label">Joined</span>
                      <strong>{new Date(customer.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="stat-pill">
                      <span className="label">Order Requests</span>
                      <strong className="text-success">{customer.orderCount}</strong>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="stat-pill">
                      <span className="label">Lifetime Spend</span>
                      <strong className="text-primary">{money(customer.totalOrderPaise)}</strong>
                    </div>
                  </div>
                </div>

                <details className="customer-activity-details mt-3">
                  <summary className="fw-semibold text-secondary" style={{ cursor: 'pointer' }}>
                    Recent order activity ({customer.recentOrders?.length || 0})
                  </summary>
                  {customer.recentOrders?.length ? (
                    <ul className="small mt-3 mb-0">
                      {customer.recentOrders.map((order) => (
                        <li key={order.orderNumber}>
                          <strong>{order.orderNumber}</strong> ·{' '}
                          <span className="badge bg-secondary">{order.status.replaceAll('_', ' ')}</span> · payment{' '}
                          {order.paymentStatus} · <strong>{money(order.totalPaise)}</strong> ·{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="small text-secondary mt-3 mb-0">No orders placed yet.</p>
                  )}
                </details>
              </article>
            );
          })
        ) : (
          <p className="empty-state mt-3">No customers match these filters.</p>
        )}
      </section>
    </>
  );
}
