import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { showToast } = useToast();

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await api('/api/admin/reviews');
      setReviews(data.reviews || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api(`/api/admin/reviews/${encodeURIComponent(id)}/approve`, { method: 'PATCH' });
      showToast('✓ Review approved and published.');
      setReviews(reviews.map((r) => (r.id === id ? { ...r, isApproved: true } : r)));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer review?')) return;
    try {
      await api(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast('Review deleted.');
      setReviews(reviews.filter((r) => r.id !== id));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="Feedback"
        title="Customer Reviews"
        description="Moderate customer ratings and reviews. Approved reviews appear publicly."
      />

      <section className="container section-space py-4">
        <div className="d-flex gap-2 mb-4">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${filter === 'all' ? 'btn-brand' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${filter === 'pending' ? 'btn-brand' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({reviews.filter((r) => !r.isApproved).length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${filter === 'approved' ? 'btn-brand' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({reviews.filter((r) => r.isApproved).length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading reviews…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {filtered.map((r) => (
              <article key={r.id} className="p-3 p-md-4 rounded-4 bg-white border shadow-xs">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-warning small">
                      {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                    </span>
                    <strong className="text-dark">{r.customerName || 'Anonymous Customer'}</strong>
                    <span className="small text-muted">on {r.productName || 'Millet Pack'}</span>
                  </div>
                  <span className={`badge ${r.isApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {r.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>

                {r.title && <h3 className="h6 fw-bold mb-1 text-dark">{r.title}</h3>}
                <p className="small text-secondary mb-3">{r.comment}</p>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span className="small text-muted">
                    {new Date(r.createdAt).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                    })}
                  </span>
                  <div className="d-flex gap-2">
                    {!r.isApproved && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success rounded-pill px-3"
                        onClick={() => handleApprove(r.id)}
                      >
                        ✓ Approve
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-3"
                      onClick={() => handleDelete(r.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 border p-4">
            <span className="fs-1 d-block mb-2">⭐</span>
            <h3 className="h5 fw-bold text-dark">No reviews found</h3>
            <p className="small text-secondary mb-0">No reviews matching the selected filter.</p>
          </div>
        )}
      </section>
    </>
  );
}
