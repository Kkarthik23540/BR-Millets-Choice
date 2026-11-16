import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '../../components/PageHeader';
import { api, money } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../services/modal';

export default function AdminOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment: '',
    from: '',
    to: '',
  });

  const loadOrders = useCallback(async ({ append = false } = {}) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      offsetRef.current = 0;
    }

    try {
      const query = new URLSearchParams({ offset: String(offsetRef.current) });
      if (filters.search.trim()) query.set('q', filters.search.trim());
      if (filters.status) query.set('status', filters.status);
      if (filters.payment) query.set('payment', filters.payment);
      if (filters.from) query.set('from', filters.from);
      if (filters.to) query.set('to', filters.to);

      const res = await api(`/api/admin/orders?${query}`);
      const newOrders = res.orders || [];

      if (append) {
        setOrders((prev) => [...prev, ...newOrders]);
        offsetRef.current += newOrders.length;
      } else {
        setOrders(newOrders);
        offsetRef.current = newOrders.length;
      }

      setTotal(res.total || 0);
      setHasMore(Boolean(res.hasMore));
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders({ append: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      payment: '',
      from: '',
      to: '',
    });
  };

  const handleUpdateOrderStatus = async (e, orderId) => {
    e.preventDefault();
    const statusVal = e.target.elements.status?.value;
    if (!statusVal) return;
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusVal }),
      });
      showToast(`✓ Order status updated to ${statusVal.replaceAll('_', ' ')}.`);
      loadOrders({ append: false });
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleUpdatePayment = async (e, orderId) => {
    e.preventDefault();
    const statusVal = e.target.elements.status?.value;
    const refVal = e.target.elements.providerReference?.value;
    if (!statusVal) return;
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusVal,
          providerReference: refVal || undefined,
        }),
      });
      showToast('✓ Payment status updated.');
      loadOrders({ append: false });
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteOrder = async (orderId, orderNum) => {
    const confirmed = await confirmAction({
      title: 'Delete Order Record',
      message: `Are you sure you want to permanently delete order "${orderNum}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete Order',
      cancelText: 'No, Keep Order',
      isDanger: true,
    });
    if (!confirmed) return;
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
      showToast('✓ Order deleted successfully.');
      loadOrders({ append: false });
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleQuickMarkPaid = async (orderId, existingRef) => {
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'paid',
          providerReference: existingRef || 'CASH_VERIFIED',
        }),
      });
      showToast('✓ Marked as verified paid.');
      loadOrders({ append: false });
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Order management"
        description="Search and filter requests, then update order or payment status."
      />

      <section className="container section-space">
        {/* Filter Panel */}
        <form className="admin-filter-panel mb-3" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="admin-filter-grid">
            <div>
              <label className="form-label small" htmlFor="orders-search">Search</label>
              <input
                className="form-control"
                id="orders-search"
                name="search"
                type="search"
                placeholder="Order, name, or email"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label small" htmlFor="orders-status">Status</label>
              <select
                className="form-select"
                id="orders-status"
                name="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="awaiting_confirmation">Awaiting confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_dispatch">Ready for dispatch</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="form-label small" htmlFor="orders-payment">Payment status</label>
              <select
                className="form-select"
                id="orders-payment"
                name="payment"
                value={filters.payment}
                onChange={(e) => setFilters({ ...filters, payment: e.target.value })}
              >
                <option value="">All payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="form-label small" htmlFor="orders-from">From</label>
              <input
                className="form-control"
                id="orders-from"
                name="from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label small" htmlFor="orders-to">To</label>
              <input
                className="form-control"
                id="orders-to"
                name="to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
          </div>
        </form>

        {/* Toolbar */}
        <div className="admin-order-toolbar">
          <p className="small text-secondary mb-0" aria-live="polite">
            {loading ? 'Loading orders…' : total > 0 ? `Showing ${orders.length} of ${total} order${total === 1 ? '' : 's'}` : '0 orders'}
          </p>
          <button className="btn btn-sm btn-outline-brand" type="button" onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>

        {/* Table */}
        <div className="admin-order-table">
          <div className="admin-order-header" aria-hidden="true">
            <span>Order / customer</span>
            <span>Date</span>
            <span>Total</span>
            <span>Order status</span>
            <span>Payment</span>
            <span>Update order</span>
            <span>Update payment</span>
          </div>

          <div>
            {orders.map((order) => {
              const date = new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
              let phone = String(order.phone ?? '').replace(/\D/g, '');
              if (phone.length === 10) phone = `91${phone}`;

              const message = [
                `Hello ${order.fullName}, your order ${order.orderNumber} is confirmed.`,
                ...(order.items ?? []).map((item) => `${item.productName} (${item.packSize}) × ${item.quantity}`),
                `Total: ${money(order.totalPaise)}.`,
                'Thank you for choosing BR Millet Choice.',
              ].join('\n');

              const hasWhatsapp = order.status === 'confirmed' && phone.length >= 10 && phone.length <= 15;

              return (
                <article key={order.id} className="admin-order-row">
                  <div className="admin-order-customer" data-label="Order / customer">
                    <strong>{order.orderNumber}</strong>
                    <span>{order.fullName} · {order.email}</span>
                    {order.paymentReference && (
                      <div className="mt-1 small">
                        <span className="badge bg-light text-dark border">Ref: {order.paymentReference}</span>
                      </div>
                    )}
                  </div>

                  <div data-label="Date">{date}</div>
                  <div data-label="Total">{money(order.totalPaise)}</div>

                  <div data-label="Order status">
                    <span className="status-pill">{order.status.replaceAll('_', ' ')}</span>
                    {hasWhatsapp && (
                      <a
                        className="admin-order-whatsapp"
                        href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Prepare WhatsApp message
                      </a>
                    )}
                  </div>

                  <div data-label="Payment">
                    <span className="status-pill">{order.paymentStatus}</span>
                    {order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' && (
                      <button
                        className="btn btn-sm btn-success mt-1 py-0 px-2"
                        style={{ fontSize: '0.75rem' }}
                        type="button"
                        onClick={() => handleQuickMarkPaid(order.id, order.paymentReference)}
                      >
                        ✓ Quick Mark Paid
                      </button>
                    )}
                  </div>

                  <form className="admin-order-control" onSubmit={(e) => handleUpdateOrderStatus(e, order.id)}>
                    <label className="visually-hidden" htmlFor={`order-status-${order.id}`}>
                      Update order status for {order.orderNumber}
                    </label>
                    <select className="form-select form-select-sm" id={`order-status-${order.id}`} name="status" defaultValue="">
                      <option value="">Update order…</option>
                      <option value="confirmed">Confirm</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready_for_dispatch">Ready for dispatch</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="rejected">Reject</option>
                      <option value="cancelled">Cancel</option>
                    </select>
                    <button className="btn btn-sm btn-outline-brand" type="submit">Save</button>
                  </form>

                  <form className="admin-order-control admin-payment-control" onSubmit={(e) => handleUpdatePayment(e, order.id)}>
                    <label className="visually-hidden" htmlFor={`payment-status-${order.id}`}>
                      Update payment status for {order.orderNumber}
                    </label>
                    <select className="form-select form-select-sm" id={`payment-status-${order.id}`} name="status" defaultValue="">
                      <option value="">Update payment…</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Verified paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <input
                      className="form-control form-control-sm"
                      name="providerReference"
                      aria-label="Payment reference"
                      placeholder="Reference"
                      defaultValue={order.paymentReference || ''}
                      maxLength={200}
                    />
                    <button className="btn btn-sm btn-outline-brand" type="submit">Save</button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger ms-1"
                      onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                      title="Delete order record"
                    >
                      Delete
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        </div>

        {!loading && orders.length === 0 && (
          <p className="empty-state mt-3">No orders match these filters.</p>
        )}

        {hasMore && (
          <div className="text-center mt-3">
            <button
              className="btn btn-outline-brand"
              type="button"
              disabled={loadingMore}
              onClick={() => loadOrders({ append: true })}
            >
              {loadingMore ? 'Loading…' : 'Load more orders'}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
