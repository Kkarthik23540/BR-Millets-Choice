import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import BrandLoader from '../components/BrandLoader';
import { api, money } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();

  const loadOrder = async () => {
    try {
      const data = await api(`/api/orders/${encodeURIComponent(id)}`);
      setOrder(data.order);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order request?')) return;
    setCancelling(true);
    try {
      await api(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      showToast('✓ Order cancelled.');
      await loadOrder();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <BrandLoader message="Loading order details…" />;
  }

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <h2 className="h4 fw-bold">Order Not Found</h2>
        <p className="text-secondary">We could not locate this order request.</p>
        <Link to="/orders" className="btn btn-brand btn-sm">
          View All Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'awaiting_confirmation', label: 'Requested' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'shipped', label: 'Dispatched' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === order.status);

  return (
    <>
      <PageHeader
        eyebrow="Order request tracker"
        title={`Order ${order.orderNumber}`}
        description={`Submitted on ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' })}`}
      />

      <section className="container section-space py-4">
        {/* Timeline */}
        <div className="bg-white rounded-4 border p-4 shadow-xs mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold mb-0">Order Status</h2>
            <span className="status-pill status-in_stock">
              {order.status.replaceAll('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="order-timeline-track d-flex justify-content-between position-relative py-3">
            {steps.map((st, i) => {
              const isPast = currentIdx >= i;
              const isCurrent = currentIdx === i;
              return (
                <div key={st.key} className="text-center position-relative" style={{ flex: 1 }}>
                  <div
                    className={`rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2 ${
                      isPast ? 'bg-success text-white' : 'bg-light text-muted border'
                    }`}
                    style={{ width: '36px', height: '36px', fontWeight: 'bold' }}
                  >
                    {isPast ? '✓' : i + 1}
                  </div>
                  <span className={`small d-block ${isCurrent ? 'fw-bold text-forest' : 'text-secondary'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="row g-4">
          {/* Order Items */}
          <div className="col-lg-8">
            <div className="bg-white rounded-4 border p-4 shadow-xs">
              <h3 className="h5 fw-bold mb-3">Packs in this Order</h3>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Product &amp; Pack Size</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{it.productName}</strong>
                          <span className="d-block small text-secondary">{it.packSize}</span>
                        </td>
                        <td className="text-center">{it.quantity}</td>
                        <td className="text-end">{money(it.pricePaise)}</td>
                        <td className="text-end fw-bold text-forest">{money(it.lineTotalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end text-secondary">Delivery:</td>
                      <td className="text-end text-success fw-bold">FREE (Cash on Delivery)</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end fs-6 fw-bold">Total Amount:</td>
                      <td className="text-end fs-5 fw-bold text-forest">{money(order.totalPaise)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Delivery & Actions */}
          <div className="col-lg-4">
            <div className="feature-card p-4 bg-white rounded-4 border shadow-xs">
              <h3 className="h6 fw-bold mb-3">Delivery Information</h3>
              <p className="small text-secondary mb-3">
                <strong>{order.recipientName}</strong> · {order.phone}
                <br />
                {order.addressLine1} {order.addressLine2 ? `${order.addressLine2}, ` : ''}
                <br />
                {order.city}, {order.state} {order.postalCode}
              </p>

              <div className="mb-4">
                <span className="badge bg-light text-dark border p-2 d-block text-center">
                  Payment: <strong>Cash on Delivery (COD)</strong>
                </span>
              </div>

              {['awaiting_confirmation', 'confirmed'].includes(order.status) && (
                <button
                  type="button"
                  className="btn btn-outline-danger w-100 btn-sm"
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel Order Request'}
                </button>
              )}

              <Link to="/orders" className="btn btn-outline-brand w-100 btn-sm mt-2">
                ← View All Orders
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
