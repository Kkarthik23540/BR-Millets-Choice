import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VisitCounter from '../../components/VisitCounter';
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
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-forest" role="status" />
        <p className="mt-2 text-secondary">Loading admin dashboard…</p>
      </div>
    );
  }

  const s = summary || {};

  return (
    <section className="container section-space py-4">
      {/* 8 Metric KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-dark d-block">{s.productCount || 0}</strong>
            <span className="small text-secondary">Products</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-dark d-block">{s.orderCount || 0}</strong>
            <span className="small text-secondary">Order requests</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-dark d-block">{s.customerCount || 0}</strong>
            <span className="small text-secondary">Customers</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-dark d-block">{s.newEnquiries || 0}</strong>
            <span className="small text-secondary">New enquiries</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-warning d-block">{s.lowStock || 0}</strong>
            <span className="small text-secondary">Low-stock options</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-danger d-block">{s.outOfStock || 0}</strong>
            <span className="small text-secondary">Out of stock</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-primary d-block">{s.pendingReviews || 0}</strong>
            <span className="small text-secondary">Pending reviews</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat p-3 bg-white rounded-3 border">
            <strong className="fs-3 text-dark d-block">{s.reviewCount || 0}</strong>
            <span className="small text-secondary">Total reviews</span>
          </div>
        </div>
      </div>

      {/* 6 Quick Action Cards */}
      <div className="row g-3 mb-5">
        <div className="col-sm-6 col-lg-4">
          <Link className="admin-shortcut d-block p-3 rounded-4 bg-white border text-decoration-none shadow-xs" to="/admin/products">
            <strong className="d-block text-dark fs-6 mb-1">Products and inventory</strong>
            <span className="small text-secondary d-block mb-2">{s.productCount || 0} products in your catalogue</span>
            <span className="admin-shortcut-action small text-forest fw-semibold">
              Manage products <span className="admin-shortcut-arrow">→</span>
            </span>
          </Link>
        </div>

        <div className="col-sm-6 col-lg-4">
          <Link className="admin-shortcut d-block p-3 rounded-4 bg-white border text-decoration-none shadow-xs" to="/admin/orders">
            <strong className="d-block text-dark fs-6 mb-1">Orders</strong>
            <span className="small text-secondary d-block mb-2">Search requests and update status or payment</span>
            <span className="admin-shortcut-action small text-forest fw-semibold">
              Manage orders <span className="admin-shortcut-arrow">→</span>
            </span>
          </Link>
        </div>

        <div className="col-sm-6 col-lg-4">
          <Link className="admin-shortcut d-block p-3 rounded-4 bg-white border text-decoration-none shadow-xs" to="/admin/reviews">
            <strong className="d-block text-dark fs-6 mb-1">Customer Reviews</strong>
            <span className="small text-secondary d-block mb-2">
              {s.reviewCount || 0} reviews ({s.pendingReviews || 0} pending)
            </span>
            <span className="admin-shortcut-action small text-forest fw-semibold">
              Moderate reviews <span className="admin-shortcut-arrow">→</span>
            </span>
          </Link>
        </div>

        <div className="col-sm-6 col-lg-4">
          <Link className="admin-shortcut d-block p-3 rounded-4 bg-white border text-decoration-none shadow-xs" to="/admin/enquiries">
            <strong className="d-block text-dark fs-6 mb-1">Enquiries</strong>
            <span className="small text-secondary d-block mb-2">Filter, respond to, or delete messages</span>
            <span className="admin-shortcut-action small text-forest fw-semibold">
              Manage enquiries <span className="admin-shortcut-arrow">→</span>
            </span>
          </Link>
        </div>

        <div className="col-sm-6 col-lg-4">
          <Link className="admin-shortcut d-block p-3 rounded-4 bg-white border text-decoration-none shadow-xs" to="/admin/customers">
            <strong className="d-block text-dark fs-6 mb-1">Customers</strong>
            <span className="small text-secondary d-block mb-2">Review customer accounts and order summaries</span>
            <span className="admin-shortcut-action small text-forest fw-semibold">
              View customers <span className="admin-shortcut-arrow">→</span>
            </span>
          </Link>
        </div>

        <div className="col-sm-6 col-lg-4">
          <Link className="admin-shortcut d-block p-3 rounded-4 bg-white border text-decoration-none shadow-xs" to="/profile">
            <strong className="d-block text-dark fs-6 mb-1">My profile</strong>
            <span className="small text-secondary d-block mb-2">Public address, phone, WhatsApp &amp; working hours</span>
            <span className="admin-shortcut-action small text-forest fw-semibold">
              Manage profile <span className="admin-shortcut-arrow">→</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Visitor Counter Odometer Box at bottom of dashboard */}
      <div className="admin-visit-counter-card text-center p-4 bg-white rounded-4 border shadow-xs mt-2">
        <VisitCounter count={s.pageVisits} dark={false} label="Page Visits" />
      </div>
    </section>
  );
}
