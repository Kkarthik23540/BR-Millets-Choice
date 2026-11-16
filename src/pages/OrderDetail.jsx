import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { api, money } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function OrderDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setLoading(true);
    api(`/api/orders/${encodeURIComponent(id)}`)
      .then((data) => setOrder(data.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order request?')) return;
    setIsCancelling(true);
    try {
      await api(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      showToast('Order has been cancelled.');
      const data = await api(`/api/orders/${encodeURIComponent(id)}`);
      setOrder(data.order);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-forest" role="status" />
        <p className="mt-2 text-secondary">Loading order receipt…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <h2 className="h4 fw-bold">Order not found</h2>
        <p className="text-secondary">Could not find the requested order receipt.</p>
        <Link to="/orders" className="btn btn-brand rounded-pill px-4 mt-2">
          View all orders
        </Link>
      </div>
    );
  }

  const canCancel = ['awaiting_confirmation', 'confirmed'].includes(order.status);

  return (
    <>
      <PageHeader
        eyebrow="Order Confirmation"
        title={`Order ${order.orderNumber}`}
        description="Thank you for shopping with BR Millet Choice."
      />

      <section className="container section-space">
        <div className="row g-4 justify-content-center">
          <div className="col-lg-8">
            <div className="p-4 bg-white rounded-4 border shadow-xs mb-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-3 border-bottom">
                <div>
                  <span className="small text-secondary d-block">Placed on</span>
                  <strong className="text-dark">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                    })}
                  </strong>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="status-pill text-capitalize">{order.status.replaceAll('_', ' ')}</span>
                  <span className="badge bg-light text-dark border">{order.paymentStatus}</span>
                </div>
              </div>

              {/* Items List */}
              <h3 className="h6 fw-bold mb-3 text-dark">Items Ordered</h3>
              <div className="d-flex flex-column gap-3 mb-4">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border">
                    <div>
                      <strong className="d-block text-forest">{item.productName}</strong>
                      <span className="small text-secondary">{item.packSize} × {item.quantity}</span>
                    </div>
                    <strong className="text-dark">{money(Number(item.pricePaise) * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              <div className="p-3 rounded-3 border mb-4 bg-white">
                <h4 className="h6 fw-bold mb-2 text-dark">Delivery Address</h4>
                <p className="small text-secondary mb-0">
                  <strong>{order.recipientName}</strong> · {order.phone}
                  <br />
                  {order.deliveryLine1} {order.deliveryLine2 || ''}
                  <br />
                  {order.deliveryCity}, {order.deliveryState} {order.deliveryPostalCode}
                </p>
              </div>

              {/* Total Breakdown */}
              <div className="pt-2 border-top">
                <div className="d-flex justify-content-between mb-1 small text-secondary">
                  <span>Delivery Method</span>
                  <span className="text-success fw-semibold">Doorstep Handover (Cash on Delivery)</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-top border-bottom mb-3">
                  <strong className="fs-5 text-dark">Total Payable Amount</strong>
                  <strong className="fs-3 text-forest">{money(order.totalPaise)}</strong>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 pt-2">
                <Link to="/orders" className="btn btn-outline-brand rounded-pill px-4">
                  ← Back to My Orders
                </Link>
                {canCancel && (
                  <button
                    type="button"
                    className="btn btn-outline-danger rounded-pill px-3"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling…' : 'Cancel Order Request'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
