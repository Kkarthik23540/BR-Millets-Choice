import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import BrandLoader from '../../components/BrandLoader';
import { api, money } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

function compressImageFile(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) return resolve(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function VariantRow({ variant, onUpdate, onDelete }) {
  const { showToast } = useToast();
  const [sku, setSku] = useState(variant.sku || '');
  const [packSize, setPackSize] = useState(variant.packSize || '');
  const [priceRupees, setPriceRupees] = useState((Number(variant.pricePaise) / 100).toFixed(2));
  const [stockQuantity, setStockQuantity] = useState(variant.stockQuantity || 0);
  const [lowStockThreshold, setLowStockThreshold] = useState(variant.lowStockThreshold ?? 5);
  const [active, setActive] = useState(Boolean(variant.active));
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [movements, setMovements] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/admin/variants/${encodeURIComponent(variant.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sku,
          packSize,
          priceRupees: Number(priceRupees),
          stockQuantity: Number(stockQuantity),
          lowStockThreshold: Number(lowStockThreshold),
          active,
        }),
      });
      showToast(`✓ Option "${packSize}" updated.`);
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHistory = async () => {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    setHistoryOpen(true);
    if (!movements) {
      setLoadingHistory(true);
      try {
        const data = await api(`/api/admin/inventory/${encodeURIComponent(variant.id)}/movements`);
        setMovements(data.movements || []);
      } catch (err) {
        showToast(err.message, true);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  return (
    <form className="admin-variant-form border-top pt-3 mb-3" onSubmit={handleSave}>
      <div>
        <label className="form-label small">SKU</label>
        <input
          className="form-control form-control-sm"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
          maxLength={60}
        />
      </div>
      <div>
        <label className="form-label small">Pack size</label>
        <input
          className="form-control form-control-sm"
          value={packSize}
          onChange={(e) => setPackSize(e.target.value)}
          required
          maxLength={30}
        />
      </div>
      <div>
        <label className="form-label small">Price (₹)</label>
        <input
          className="form-control form-control-sm"
          type="number"
          step="0.01"
          min="0"
          value={priceRupees}
          onChange={(e) => setPriceRupees(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="form-label small">Stock</label>
        <input
          className="form-control form-control-sm"
          type="number"
          min="0"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="form-label small">Low-stock alert</label>
        <input
          className="form-control form-control-sm"
          type="number"
          min="0"
          value={lowStockThreshold}
          onChange={(e) => setLowStockThreshold(e.target.value)}
          required
        />
      </div>
      <div className="admin-variant-active">
        <span className="form-label small">Availability</span>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id={`var-active-${variant.id}`}
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor={`var-active-${variant.id}`}>
            Active
          </label>
        </div>
      </div>
      <div className="admin-variant-save">
        <span className="form-label small d-none d-sm-block">&nbsp;</span>
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-brand" type="submit" disabled={saving}>
            {saving ? '…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(variant.id, variant.packSize)}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="admin-variant-history">
        <button
          className="btn btn-link btn-sm p-0 text-decoration-none"
          type="button"
          onClick={handleToggleHistory}
        >
          {historyOpen ? 'Hide inventory history' : 'View inventory history'}
        </button>
        {historyOpen && (
          <div className="small mt-2 p-2 bg-light rounded border">
            {loadingHistory && <div className="text-secondary">Loading history…</div>}
            {!loadingHistory && movements && movements.length === 0 && (
              <div className="text-secondary">No movement records.</div>
            )}
            {!loadingHistory && movements && movements.length > 0 && (
              <div className="d-flex flex-column gap-1">
                {movements.map((m) => (
                  <div key={m.id || Math.random()}>
                    {new Date(m.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} ·{' '}
                    <strong className={m.quantityChange > 0 ? 'text-success' : 'text-danger'}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </strong>{' '}
                    · {m.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

function ProductCard({ product, onReload }) {
  const { showToast } = useToast();
  const { refreshConfig } = useAuth();

  const [name, setName] = useState(product.name || '');
  const [category, setCategory] = useState(product.category || '');
  const [description, setDescription] = useState(product.description || '');
  const [ingredients, setIngredients] = useState(product.ingredients || '');
  const [storageInstructions, setStorageInstructions] = useState(product.storageInstructions || '');
  const [active, setActive] = useState(Boolean(product.active));
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(product.imageUrl || '');
  const [savingDetails, setSavingDetails] = useState(false);

  // New variant row state
  const [newSku, setNewSku] = useState('');
  const [newPackSize, setNewPackSize] = useState('');
  const [newPriceRupees, setNewPriceRupees] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newThreshold, setNewThreshold] = useState('5');
  const [newActive, setNewActive] = useState(true);
  const [addingVariant, setAddingVariant] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      let imageUrl = undefined;
      if (editImageFile) {
        const compressed = await compressImageFile(editImageFile);
        const fd = new FormData();
        fd.append('image', compressed);
        const imgRes = await api('/api/admin/product-images', { method: 'POST', body: fd });
        imageUrl = imgRes.image?.url;
      }

      await api(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          category,
          description,
          ingredients,
          storageInstructions,
          active,
          ...(imageUrl ? { images: [{ url: imageUrl, altText: name }] } : {}),
        }),
      });

      showToast(`✓ "${name}" details updated.`);
      await onReload();
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${product.name}" and all its pack options?`)) {
      return;
    }
    try {
      await api(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      showToast(`✓ "${product.name}" deleted.`);
      await onReload();
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteVariant = async (variantId, packName) => {
    if (!window.confirm(`Are you sure you want to delete pack option "${packName}"?`)) {
      return;
    }
    try {
      await api(`/api/admin/variants/${encodeURIComponent(variantId)}`, { method: 'DELETE' });
      showToast(`✓ Pack option "${packName}" deleted.`);
      await onReload();
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    setAddingVariant(true);
    try {
      const skuVal = newSku || `${product.slug}-${newPackSize.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      await api(`/api/admin/products/${encodeURIComponent(product.id)}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          sku: skuVal,
          packSize: newPackSize,
          priceRupees: Number(newPriceRupees),
          stockQuantity: Number(newStock),
          lowStockThreshold: Number(newThreshold),
          active: newActive,
        }),
      });

      showToast(`✓ Added pack option "${newPackSize}".`);
      setNewSku('');
      setNewPackSize('');
      setNewPriceRupees('');
      setNewStock('');
      setNewThreshold('5');
      setNewActive(true);
      await onReload();
      await refreshConfig();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setAddingVariant(false);
    }
  };

  return (
    <article className="address-card mb-4">
      {/* Product Details Form */}
      <form onSubmit={handleSaveDetails}>
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h3 className="h5 mb-1">{product.name}</h3>
            <span className="small text-secondary">
              /{product.slug} ·{' '}
              <span className={product.active ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                {product.active ? 'Active' : 'Inactive'}
              </span>
            </span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`active-${product.id}`}
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`active-${product.id}`}>
                Active
              </label>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleDeleteProduct}
            >
              Delete product
            </button>
          </div>
        </div>

        <div className="row g-2 mt-2">
          <div className="col-md-6">
            <label className="form-label small">Product name</label>
            <input
              className="form-control form-control-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Category</label>
            <input
              className="form-control form-control-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="col-12">
            <label className="form-label small">Description</label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Ingredients</label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              maxLength={1000}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Storage instructions</label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              maxLength={1000}
              value={storageInstructions}
              onChange={(e) => setStorageInstructions(e.target.value)}
            />
          </div>
          <div className="col-12">
            <label className="form-label small">Product image</label>
            <input
              className="form-control form-control-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImageChange}
            />
            {editImagePreview && (
              <img
                className="admin-image-preview mt-2 border rounded-3"
                src={editImagePreview}
                alt={name}
                style={{ maxHeight: '110px', objectFit: 'cover' }}
              />
            )}
          </div>
          <div className="col-12 mt-2">
            <button className="btn btn-sm btn-brand" type="submit" disabled={savingDetails}>
              {savingDetails ? 'Saving details…' : 'Save details'}
            </button>
          </div>
        </div>
      </form>

      {/* Pack Options & Pricing */}
      <h4 className="h6 mt-4 pt-3 border-top fw-bold text-forest">Pack options &amp; pricing</h4>
      {product.variants && product.variants.length > 0 ? (
        product.variants.map((v) => (
          <VariantRow
            key={v.id}
            variant={v}
            onUpdate={onReload}
            onDelete={handleDeleteVariant}
          />
        ))
      ) : (
        <p className="small text-secondary">No pack options have been added.</p>
      )}

      {/* Add New Pack Option Form */}
      <form onSubmit={handleAddVariant} className="admin-variant-form border-top pt-3 mt-3">
        <div>
          <label className="form-label small">New SKU</label>
          <input
            className="form-control form-control-sm"
            placeholder="Auto if empty"
            value={newSku}
            onChange={(e) => setNewSku(e.target.value)}
            maxLength={60}
          />
        </div>
        <div>
          <label className="form-label small">Pack size</label>
          <input
            className="form-control form-control-sm"
            placeholder="e.g. 500g"
            value={newPackSize}
            onChange={(e) => setNewPackSize(e.target.value)}
            required
            maxLength={30}
          />
        </div>
        <div>
          <label className="form-label small">Price (₹)</label>
          <input
            className="form-control form-control-sm"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 180"
            value={newPriceRupees}
            onChange={(e) => setNewPriceRupees(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label small">Stock</label>
          <input
            className="form-control form-control-sm"
            type="number"
            min="0"
            placeholder="e.g. 20"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label small">Threshold</label>
          <input
            className="form-control form-control-sm"
            type="number"
            min="0"
            value={newThreshold}
            onChange={(e) => setNewThreshold(e.target.value)}
            required
          />
        </div>
        <div className="admin-variant-active">
          <span className="form-label small">Availability</span>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={`new-var-active-${product.id}`}
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor={`new-var-active-${product.id}`}>
              Active
            </label>
          </div>
        </div>
        <div className="admin-variant-save">
          <span className="form-label small d-none d-sm-block">&nbsp;</span>
          <button className="btn btn-sm btn-outline-brand" type="submit" disabled={addingVariant}>
            {addingVariant ? '…' : 'Add'}
          </button>
        </div>
      </form>
    </article>
  );
}

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
        const compressed = await compressImageFile(imageFile);
        const formData = new FormData();
        formData.append('image', compressed);
        const imgRes = await api('/api/admin/product-images', {
          method: 'POST',
          body: formData,
        });
        imageUrl = imgRes.image?.url;
      }

      const priceRupees = parseFloat(form.priceRupees) || 0;
      const stockQuantity = parseInt(form.stockQuantity, 10) || 0;
      const autoSku = form.sku || `${form.slug}-${(form.packSize || 'pack').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          category: form.category,
          ingredients: form.ingredients,
          storageInstructions: form.storageInstructions,
          active: form.active,
          images: imageUrl ? [{ url: imageUrl, altText: form.name }] : [],
          variants: [
            {
              sku: autoSku,
              packSize: form.packSize,
              priceRupees,
              stockQuantity,
              lowStockThreshold: 5,
              active: form.active,
            },
          ],
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

  if (loading) {
    return <BrandLoader message="Loading products and catalogue…" />;
  }

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

          {/* Existing Products List & Editors */}
          {!isAddView && (
            <div className="col-12">
              <h2 className="h4 mb-3">
                Products and inventory <span className="small text-secondary">({products.length})</span>
              </h2>
              {products.length === 0 ? (
                <p className="text-secondary">No products in the catalogue.</p>
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onReload={loadProducts}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
