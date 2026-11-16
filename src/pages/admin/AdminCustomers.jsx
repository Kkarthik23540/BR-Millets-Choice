import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { api, money } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api('/api/admin/customers')
      .then((data) => setCustomers(data.customers || []))
      .catch((err) => showToast(err.message, true))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Customers"
        description="Review customer accounts, verification status, and order totals."
      />

      <section className="container section-space py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading customers…</p>
          </div>
        ) : customers.length > 0 ? (
          <div className="table-responsive bg-white rounded-4 border shadow-xs">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Customer</th>
                  <th>Verification</th>
                  <th>Total Orders</th>
                  <th>Total Spend</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong className="d-block text-forest fs-6">{c.fullName}</strong>
                      <small className="text-muted">{c.email}</small>
                    </td>
                    <td>
                      <span className={`badge ${c.emailVerifiedAt ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {c.emailVerifiedAt ? '✓ Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td>
                      <strong>{c.orderCount || 0}</strong> orders
                    </td>
                    <td>
                      <strong className="text-forest">{money(c.totalOrderPaise || 0)}</strong>
                    </td>
                    <td>
                      <small className="text-secondary">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                        })}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 border p-4">
            <span className="fs-1 d-block mb-2">👥</span>
            <h3 className="h5 fw-bold text-dark">No customers yet</h3>
            <p className="small text-secondary mb-0">Registered customer accounts will appear here.</p>
          </div>
        )}
      </section>
    </>
  );
}
