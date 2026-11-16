import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { api, money } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api('/api/admin/orders');
      setOrders(data.orders || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast('✓ Order status updated.');
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleUpdatePayment = async (orderId, newPaymentStatus) => {
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      showToast('✓ Payment status updated.');
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o)));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (paymentFilter && o.paymentStatus !== paymentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchNum = (o.orderNumber || '').toLowerCase().includes(q);
      const matchName = (o.recipientName || '').toLowerCase().includes(q);
      const matchPhone = (o.phone || '').includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="Order fulfillment"
        title="Manage Orders"
        description="Review customer requests, dispatch batches, and update COD payments."
      />

      <section className="container section-space py-4">
        {/* Filters Panel */}
        <div className="p-3 bg-white rounded-4 border shadow-xs mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Search order #, customer, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="awaiting_confirmation">Awaiting confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_dispatch">Ready for dispatch</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="">All payments</option>
                <option value="unpaid">Unpaid (COD)</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="col-12 col-md-2 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 rounded-pill"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPaymentFilter('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading orders…</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {filteredOrders.map((order) => {
              const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
              const waText = `Hi ${order.recipientName}, this is BR Millet Choice regarding your Order #${order.orderNumber}.`;
              return (
                <article key={order.id} className="p-3 p-md-4 rounded-4 bg-white border shadow-xs">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3 pb-2 border-bottom">
                    <div>
                      <strong className="fs-6 text-dark d-block">{order.orderNumber}</strong>
                      <span className="small text-secondary">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <strong className="fs-5 text-forest">{money(order.totalPaise)}</strong>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-5">
                      <strong className="d-block text-dark small">{order.recipientName}</strong>
                      <span className="small text-secondary d-block">
                        {order.deliveryLine1} {order.deliveryLine2 || ''}, {order.deliveryCity}, {order.deliveryState} {order.deliveryPostalCode}
                      </span>
                      <span className="small text-muted d-block mt-1">📞 {order.phone}</span>

                      {cleanPhone && (
                        <a
                          href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 mt-2 d-inline-flex align-items-center gap-1"
                        >
                          💬 WhatsApp Customer
                        </a>
                      )}
                    </div>

                    <div className="col-md-7">
                      <div className="row g-2 align-items-center">
                        <div className="col-sm-6">
                          <label className="form-label small fw-semibold">Order Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          >
                            <option value="awaiting_confirmation">Awaiting confirmation</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready_for_dispatch">Ready for dispatch</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="col-sm-6">
                          <label className="form-label small fw-semibold">Payment Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={order.paymentStatus}
                            onChange={(e) => handleUpdatePayment(order.id, e.target.value)}
                          >
                            <option value="unpaid">Unpaid (COD)</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 border p-4">
            <span className="fs-1 d-block mb-2">📦</span>
            <h3 className="h5 fw-bold text-dark">No orders found</h3>
            <p className="small text-secondary mb-0">No order requests match the selected filters.</p>
          </div>
        )}
      </section>
    </>
  );
}
