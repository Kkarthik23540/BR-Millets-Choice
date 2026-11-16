import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const data = await api('/api/admin/enquiries');
      setEnquiries(data.enquiries || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer enquiry?')) return;
    try {
      await api(`/api/admin/enquiries/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast('Enquiry deleted.');
      setEnquiries(enquiries.filter((e) => e.id !== id));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Customer Messages"
        title="Enquiries"
        description="Filter, respond to, or archive questions from prospective customers."
      />

      <section className="container section-space py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading enquiries…</p>
          </div>
        ) : enquiries.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {enquiries.map((item) => {
              const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
              const waText = `Hi ${item.name}, thank you for reaching out to BR Millet Choice.`;
              return (
                <article key={item.id} className="p-3 p-md-4 rounded-4 bg-white border shadow-xs">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2 pb-2 border-bottom">
                    <div>
                      <strong className="fs-6 text-dark d-block">{item.name}</strong>
                      <span className="small text-secondary">{item.email} · {item.phone}</span>
                    </div>
                    <span className="small text-muted">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                      })}
                    </span>
                  </div>

                  <strong className="d-block text-forest small mb-1">Subject: {item.subject || 'General Enquiry'}</strong>
                  <p className="small text-secondary mb-3" style={{ whiteSpace: 'pre-wrap' }}>{item.message}</p>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    {cleanPhone ? (
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                      >
                        💬 Reply via WhatsApp
                      </a>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-3"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 border p-4">
            <span className="fs-1 d-block mb-2">✉️</span>
            <h3 className="h5 fw-bold text-dark">No enquiries yet</h3>
            <p className="small text-secondary mb-0">Customer messages sent via the contact page will appear here.</p>
          </div>
        )}
      </section>
    </>
  );
}
