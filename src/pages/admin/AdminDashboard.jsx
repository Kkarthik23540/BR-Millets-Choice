import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import BrandLoader from '../../components/BrandLoader';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/admin/summary')
      .then((data) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <BrandLoader message="Loading admin dashboard…" />;
  }

  const s = summary || {};
  const orderTotal = (s.ordersByStatus || []).reduce((acc, row) => acc + Number(row.count || 0), 0);

  const safeVisits = Math.max(0, parseInt(s.pageVisits, 10) || 0);
  const digits = String(safeVisits).padStart(6, '0').split('');

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Your store at a glance, with direct access to every management area."
      />

      <section className="container section-space">
        {/* 8 Metric KPI Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{s.productCount || 0}</strong>
              <span>Products</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{orderTotal}</strong>
              <span>Order requests</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{s.customerCount || 0}</strong>
              <span>Customers</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{s.newEnquiries || 0}</strong>
              <span>New enquiries</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{s.lowStock || 0}</strong>
              <span>Low-stock options</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{s.outOfStock || 0}</strong>
              <span>Out of stock</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{s.pendingReviews || 0}</strong>
              <span>Pending reviews</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <strong>{s.reviewCount || 0}</strong>
              <span>Total reviews</span>
            </div>
          </div>
        </div>

        {/* 6 Shortcut Cards */}
        <div className="row g-3 mb-5">
          <div className="col-sm-6 col-lg-4">
            <Link className="admin-shortcut" to="/admin/manage-products">
              <strong>Products and inventory</strong>
              <span>{s.productCount || 0} products in your catalogue</span>
              <span className="admin-shortcut-action">
                Manage products <span className="admin-shortcut-arrow">→</span>
              </span>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-4">
            <Link className="admin-shortcut" to="/admin/orders">
              <strong>Orders</strong>
              <span>Search requests and update status or payment</span>
              <span className="admin-shortcut-action">
                Manage orders <span className="admin-shortcut-arrow">→</span>
              </span>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-4">
            <Link className="admin-shortcut" to="/admin/reviews">
              <strong>Customer Reviews</strong>
              <span>{s.reviewCount || 0} reviews ({s.pendingReviews || 0} pending)</span>
              <span className="admin-shortcut-action">
                Moderate reviews <span className="admin-shortcut-arrow">→</span>
              </span>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-4">
            <Link className="admin-shortcut" to="/admin/enquiries">
              <strong>Enquiries</strong>
              <span>Filter, respond to, or delete messages</span>
              <span className="admin-shortcut-action">
                Manage enquiries <span className="admin-shortcut-arrow">→</span>
              </span>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-4">
            <Link className="admin-shortcut" to="/admin/customers">
              <strong>Customers</strong>
              <span>Review customer accounts and order summaries</span>
              <span className="admin-shortcut-action">
                View customers <span className="admin-shortcut-arrow">→</span>
              </span>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-4">
            <Link className="admin-shortcut" to="/admin/profile">
              <strong>My profile</strong>
              <span>Public address, phone, WhatsApp &amp; working hours</span>
              <span className="admin-shortcut-action">
                Manage profile <span className="admin-shortcut-arrow">→</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Visitor Counter Odometer Box at bottom of dashboard */}
        <div className="admin-visit-counter-card mt-2">
          <div className="visit-counter-widget is-light">
            <div className="visit-counter-digits" aria-label={`Page Visits: ${safeVisits}`}>
              {digits.map((d, i) => (
                <span key={i} className="visit-digit-box">{d}</span>
              ))}
            </div>
            <span className="visit-counter-label">Page Visits</span>
          </div>
        </div>
      </section>
    </>
  );
}
