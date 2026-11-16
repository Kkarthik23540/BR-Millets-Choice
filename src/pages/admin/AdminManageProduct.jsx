import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { api, money } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminManageProduct() {
  const location = useLocation();
  const isAddView = location.pathname === '/admin/products';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();
  const { refreshConfig } = useAuth();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    ingredients: '',
    storageInstructions: '',
    sku: '',
    packSize: '',
    priceRupees: '',
    stockQuantity: '',
    active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadProducts = async () => {
    try {
      const data = await api('/api/admin/products');
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

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const imgRes = await api('/api/admin/product-images', {
          method: 'POST',
          body: formData,
        });
        imageUrl = imgRes.imageUrl;
      }

      const pricePaise = Math.round(parseFloat(form.priceRupees) * 100);
      const stockQuantity = parseInt(form.stockQuantity, 10);

      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          category: form.category,
          ingredients: form.ingredients,
          storageInstructions: form.storageInstructions,
          imageUrl,
          active: form.active,
          variant: {
            sku: form.sku || `${form.slug}-${form.packSize.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            packSize: form.packSize,
            pricePaise,
            stockQuantity,
            active: true,
          },
        }),
      });

      showToast(`✓ "${form.name}" created and published!`);
      setForm({
        name: '',
        slug: '',
        description: '',
        category: '',
        ingredients: '',
        storageInstructions: '',
        sku: '',
        packSize: '',
        priceRupees: '',
        stockQuantity: '',
        active: true,
      });
      setImageFile(null);
      setImagePreview('');
      await loadProducts();
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
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
        eyebrow="Administration"
        title={isAddView ? 'Add products' : 'Manage products'}
        description={
          isAddView
            ? 'Create a new product and its first pack option.'
            : 'Update catalogue details, pack options and inventory.'
        }
        actions={
          isAddView ? (
            <Link to="/admin/manage-products" className="btn btn-sm btn-outline-brand">
              Manage catalogue →
            </Link>
          ) : (
            <Link to="/admin/products" className="btn btn-sm btn-brand">
              + Add product
            </Link>
          )
        }
      />

      <section className="container section-space">
        <div className="row g-4">
          {/* Add Product Form */}
          {isAddView && (
            <div className="col-12">
              <form className="address-card" onSubmit={handleCreateProduct}>
              <p className="eyebrow mb-1">Catalogue management</p>
              <h2 className="h4">Add product</h2>
              <p className="small text-secondary">
                Add the product details and its initial pack option. Published products appear immediately on the storefront for customers to order.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="product-name">Product Name</label>
                  <input
                    className="form-control"
                    id="product-name"
                    required
                    maxLength={120}
                    placeholder="e.g. Pure Foxtail Millet Powder"
                    value={form.name}
                    onChange={handleNameChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="product-slug">Web Link Identifier (Slug)</label>
                  <input
                    className="form-control"
                    id="product-slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    placeholder="Auto-generated from product name"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="product-description">Description &amp; Health Benefits</label>
                  <textarea
                    className="form-control"
                    id="product-description"
                    rows="3"
                    maxLength={5000}
                    placeholder="Describe the health benefits, grain source, or preparation method..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="product-category">Product Category</label>
                  <input
                    className="form-control"
                    id="product-category"
                    maxLength={80}
                    placeholder="e.g. Whole Millets, Flours, Health Mixes"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="ingredients">Ingredients List</label>
                  <textarea
                    className="form-control"
                    id="ingredients"
                    rows="2"
                    maxLength={1000}
                    placeholder="e.g. 100% Whole Foxtail Millet (No preservatives)"
                    value={form.ingredients}
                    onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="storage-instructions">Storage Instructions</label>
                  <textarea
                    className="form-control"
                    id="storage-instructions"
                    rows="2"
                    maxLength={1000}
                    placeholder="e.g. Store in an airtight container in a cool, dry place."
                    value={form.storageInstructions}
                    onChange={(e) => setForm({ ...form, storageInstructions: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="product-image-new">Product Image (Photo)</label>
                  <input
                    className="form-control"
                    id="product-image-new"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageChange}
                  />
                  <div className="form-text">JPG, PNG, or WebP. Automatically optimized for fast mobile loading.</div>
                  {imagePreview && (
                    <img
                      className="admin-image-preview mt-2 border rounded-3"
                      src={imagePreview}
                      alt="Selected preview"
                      style={{ maxHeight: '160px', objectFit: 'cover' }}
                    />
                  )}
                </div>
              </div>

              <hr />
              <h3 className="h5">First Pack Option &amp; Pricing</h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="variant-sku">Product Code / SKU (Optional)</label>
                  <input
                    className="form-control"
                    id="variant-sku"
                    maxLength={60}
                    placeholder="Auto-generated if left blank"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pack-size">Pack Size / Weight</label>
                  <input
                    className="form-control"
                    id="pack-size"
                    required
                    maxLength={30}
                    placeholder="e.g. 500g, 1 kg"
                    value={form.packSize}
                    onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="price">Selling Price (₹)</label>
                  <input
                    className="form-control"
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 180"
                    required
                    value={form.priceRupees}
                    onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="stock">Available Stock (Packets)</label>
                  <input
                    className="form-control"
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="e.g. 20"
                    required
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-check my-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <label className="form-check-label fw-bold text-success" htmlFor="active">
                  ✓ Publish immediately (Visible to customers)
                </label>
                <div className="form-text">When checked, customers can immediately see and purchase this product on the shop page.</div>
              </div>

              <button className="btn btn-brand btn-lg" type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create and Publish Product'}
              </button>
            </form>
          </div>
        )}

        {/* Existing Products List */}
        {!isAddView && (
          <div className="col-12">
            <h2 className="h4">Products and inventory <span className="small text-secondary">({products.length})</span></h2>
            {products.map((product) => (
              <article key={product.id} className="address-card mb-3">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <h3 className="h5">{product.name}</h3>
                    <span className="small text-secondary">/{product.slug} · {product.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                  >
                    Delete product
                  </button>
                </div>
                <div className="row g-2 mt-2">
                  {product.imageUrl && (
                    <div className="col-12">
                      <img className="admin-image-preview" src={product.imageUrl} alt={product.name} style={{ maxHeight: '100px' }} />
                    </div>
                  )}
                  <div className="col-12">
                    <p className="small text-secondary mb-1">{product.description}</p>
                  </div>
                </div>

                <h4 className="h6 mt-3">Pack options and inventory</h4>
                {product.variants?.map((v) => (
                  <div key={v.id} className="p-2 bg-light rounded-2 border d-flex justify-content-between align-items-center mb-1 small">
                    <span>
                      <strong>{v.packSize}</strong> ({v.sku}) — {money(v.pricePaise)}
                    </span>
                    <span className={v.stockQuantity < 5 ? 'text-danger fw-bold' : 'text-success'}>
                      {v.stockQuantity} in stock
                    </span>
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}
        </div>
      </section>
    </>
  );
}
