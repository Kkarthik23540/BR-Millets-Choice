import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminReviews() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/reviews');
      setReviews(res.reviews || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleApprove = async (id, currentApproved) => {
    try {
      await api(`/api/admin/reviews/${encodeURIComponent(id)}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ isApproved: !currentApproved }),
      });
      showToast(`✓ Review ${!currentApproved ? 'approved and made public' : 'hidden from public'}.`);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: !currentApproved } : r))
      );
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await api(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast('✓ Review deleted.');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Customer reviews"
        description="Moderate customer feedback and approve ratings to appear on product pages."
      />

      <section className="container section-space">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="small text-secondary mb-0">
            Manage customer ratings and reviews. Approved reviews appear publicly on product pages.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading reviews…</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="row g-3">
            {reviews.map((r) => (
              <div key={r.id} className="col-12">
                <article className="address-card">
                  <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                    <div>
                      <h3 className="h5 mb-1">{r.title}</h3>
                      <div className="small text-secondary">
                        By <strong>{r.customerName}</strong> on <strong>{r.productName}</strong> ·{' '}
                        {new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${r.isApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {r.isApproved ? 'Approved & Public' : 'Pending Approval'}
                      </span>
                      <span className="text-warning fw-bold">
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 mb-3">{r.comment}</p>

                  <div className="d-flex gap-2">
                    <button
                      className={`btn btn-sm ${r.isApproved ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      type="button"
                      onClick={() => handleToggleApprove(r.id, r.isApproved)}
                    >
                      {r.isApproved ? 'Hide from public' : 'Approve for public'}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      type="button"
                      onClick={() => handleDeleteReview(r.id)}
                    >
                      Delete review
                    </button>
                  </div>
                </article>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No reviews submitted yet</h2>
            <p className="text-secondary">Customer reviews submitted on product pages will appear here for moderation.</p>
          </div>
        )}
      </section>
    </>
  );
}
