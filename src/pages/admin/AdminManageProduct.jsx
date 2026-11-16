import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminManageProduct() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { refreshConfig } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Millet Blends');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [storageInstructions, setStorageInstructions] = useState('');
  const [active, setActive] = useState(true);

  // Variant fields
  const [packSize, setPackSize] = useState('500g');
  const [priceRupees, setPriceRupees] = useState('');
  const [stockQuantity, setStockQuantity] = useState('25');
  const [sku, setSku] = useState('');

  // Image upload
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const autoSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api('/api/admin/product-images', {
        method: 'POST',
        body: formData,
      });
      setImageUrl(res.imageUrl);
      showToast('✓ Image uploaded successfully.');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!priceRupees || isNaN(Number(priceRupees))) {
      showToast('Please enter a valid selling price.', true);
      return;
    }
    setIsSubmitting(true);
    try {
      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug,
          category,
          description,
          ingredients,
          storageInstructions,
          active,
          imageUrl,
          sku: sku || undefined,
          packSize,
          priceRupees: Number(priceRupees),
          stockQuantity: parseInt(stockQuantity, 10) || 0,
        }),
      });
      showToast('✓ Product created and published successfully!');
      await refreshConfig();
      navigate('/admin/products');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Add New Product"
        description="Publish a new stone-ground millet pack to the storefront."
      />

      <section className="container section-space py-4">
        <div className="p-4 bg-white rounded-4 border shadow-xs mx-auto" style={{ maxWidth: '800px' }}>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Product Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Pure Foxtail Millet Powder"
                  value={name}
                  onChange={handleNameChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Web Link Slug</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="auto-generated-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Product Category</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Millet Blends, Flours"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Upload Photo</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageFileChange}
                />
                {isUploading && <small className="text-secondary">Uploading image…</small>}
                {imageUrl && (
                  <div className="mt-2">
                    <img src={imageUrl} alt="Preview" className="rounded-3 border" height="80" />
                  </div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold">Description &amp; Health Benefits</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe the grain source, grinding method, and nutritional advantages…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Ingredients List</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g. 100% Whole Foxtail Millet"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Storage Instructions</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Store in an airtight container in a cool, dry place."
                  value={storageInstructions}
                  onChange={(e) => setStorageInstructions(e.target.value)}
                />
              </div>
            </div>

            <hr className="my-4" />
            <h3 className="h6 fw-bold mb-3">Initial Pack Option &amp; Pricing</h3>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Pack Size / Weight</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. 500g, 1 kg"
                  value={packSize}
                  onChange={(e) => setPackSize(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  required
                  placeholder="e.g. 180"
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Available Stock (Packs)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  required
                  placeholder="e.g. 25"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="form-check my-4">
              <input
                type="checkbox"
                className="form-check-input"
                id="active-check"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label className="form-check-label fw-semibold text-success small" htmlFor="active-check">
                ✓ Publish immediately (Visible to customers on storefront)
              </label>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-brand rounded-pill px-5 fw-bold"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? 'Creating Product…' : 'Publish Product'}
              </button>
              <Link to="/admin/products" className="btn btn-outline-secondary rounded-pill px-4">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
