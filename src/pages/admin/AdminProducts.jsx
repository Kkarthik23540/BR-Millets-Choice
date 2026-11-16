import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { api, money } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { refreshConfig } = useAuth();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api('/api/products');
      setProducts(data.products || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" and all its pack options?`)) {
      return;
    }
    try {
      await api(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast(`✓ "${name}" deleted.`);
      await loadProducts();
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products &amp; Inventory"
        description="Manage your stone-ground millet packs, pricing, and stock levels."
        actions={
          <Link to="/admin/manage-products" className="btn btn-brand rounded-pill px-4">
            + Add New Product
          </Link>
        }
      />

      <section className="container section-space py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading products…</p>
          </div>
        ) : products.length > 0 ? (
          <div className="table-responsive bg-white rounded-4 border shadow-xs">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '80px' }}>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Pack Options &amp; Stock</th>
                  <th>Status</th>
                  <th className="text-end" style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const variants = p.variants || [];
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="rounded-3 object-fit-cover"
                            width="52"
                            height="52"
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center bg-light rounded-3 text-forest fs-4"
                            style={{ width: '52px', height: '52px' }}
                          >
                            🌾
                          </div>
                        )}
                      </td>
                      <td>
                        <strong className="d-block text-forest fs-6">{p.name}</strong>
                        <small className="text-muted">Slug: /{p.slug}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{p.category || 'Millet'}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {variants.map((v) => (
                            <span key={v.id} className="small">
                              <strong>{v.packSize}</strong>: {money(v.pricePaise)} (
                              <span className={v.stockQuantity < 5 ? 'text-danger fw-bold' : 'text-success'}>
                                {v.stockQuantity} in stock
                              </span>
                              )
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                          {p.active ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-3"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Delete product"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 border p-4">
            <span className="fs-1 d-block mb-2">🌾</span>
            <h3 className="h5 fw-bold text-dark">No products yet</h3>
            <p className="small text-secondary mb-3">Add your first millet product to publish it to the store.</p>
            <Link to="/admin/manage-products" className="btn btn-brand rounded-pill px-4">
              + Add Product
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
