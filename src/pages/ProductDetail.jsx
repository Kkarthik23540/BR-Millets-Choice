import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { api, money } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    api(`/api/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        setProduct(data.product);
        if (data.product?.variants?.length) {
          setSelectedVariantId(data.product.variants[0].id);
        }
      })
      .catch((err) => showToast(err.message, true))
      .finally(() => setLoading(false));

    api(`/api/reviews?productSlug=${encodeURIComponent(slug)}`)
      .then((data) => setReviews(data.reviews || []))
      .catch(() => {});
  }, [slug, showToast]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-forest" role="status" />
        <p className="mt-2 text-secondary">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h2 className="h4">Product Not Found</h2>
        <p className="text-secondary">The requested product could not be found.</p>
        <Link to="/shop" className="btn btn-brand btn-sm">
          Return to Shop
        </Link>
      </div>
    );
  }

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0];
  const isOutOfStock = !selectedVariant || Number(selectedVariant.stockQuantity) <= 0;

  const handleAdd = () => {
    if (selectedVariant) {
      addToCart(selectedVariant.id, quantity);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to leave a review.', true);
      return;
    }
    setSubmittingReview(true);
    try {
      await api('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          rating: Number(reviewForm.rating),
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });
      showToast('✓ Thank you! Your review has been submitted for moderation.');
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Pure millets &bull; Healthy living"
        title={product.name}
        description={product.description || 'Natural stone-ground millet blend prepared in Hyderabad.'}
      />

      <section className="container section-space py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/shop" className="text-decoration-none">Shop</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="row g-4 mb-5">
          {/* Product Image */}
          <div className="col-lg-6">
            <div className="product-detail-visual bg-white rounded-4 border p-4 text-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="img-fluid rounded-3"
                  style={{ maxHeight: '420px', objectFit: 'contain' }}
                />
              ) : (
                <div className="py-5 fs-1 text-forest">🌾</div>
              )}
            </div>
          </div>

          {/* Product Details & Actions */}
          <div className="col-lg-6">
            <div className="product-detail-content">
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill mb-2">
                {product.category || 'Special Blend'}
              </span>
              <h1 className="h3 fw-bold text-forest mb-2">{product.name}</h1>
              <p className="text-secondary mb-4">{product.description}</p>

              {/* Pack Selector */}
              {product.variants?.length > 0 && (
                <div className="mb-4">
                  <label className="form-label fw-bold small text-dark d-block">Choose Pack Size</label>
                  <div className="d-flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`btn ${v.id === selectedVariantId ? 'btn-brand' : 'btn-outline-brand'} px-3 py-2`}
                        onClick={() => setSelectedVariantId(v.id)}
                      >
                        <strong>{v.packSize}</strong> — {money(v.pricePaise)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Stock */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <span className="h2 fw-bold text-forest mb-0">
                  {selectedVariant ? money(selectedVariant.pricePaise) : '—'}
                </span>
                <span className={`status-pill ${isOutOfStock ? 'status-out_of_stock' : 'status-in_stock'}`}>
                  {isOutOfStock ? 'Out of stock' : `${selectedVariant?.stockQuantity || 0} in stock`}
                </span>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="input-group" style={{ width: '130px' }}>
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    className="form-control text-center"
                    value={quantity}
                    readOnly
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock || quantity >= (selectedVariant?.stockQuantity || 10)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-brand btn-lg flex-grow-1"
                  disabled={isOutOfStock}
                  onClick={handleAdd}
                >
                  {isOutOfStock ? 'Currently Unavailable' : 'Add to Shopping Cart'}
                </button>
              </div>

              <div className="alert alert-light border small text-secondary mb-4">
                🚚 <strong>100% Cash on Delivery across India.</strong> Pay conveniently when your pack arrives.
              </div>

              {/* Ingredients & Storage Instructions */}
              {product.ingredients && (
                <div className="mb-3">
                  <h3 className="h6 fw-bold mb-1">Ingredients:</h3>
                  <p className="small text-secondary mb-0">{product.ingredients}</p>
                </div>
              )}
              {product.storageInstructions && (
                <div className="mb-3">
                  <h3 className="h6 fw-bold mb-1">Storage Instructions:</h3>
                  <p className="small text-secondary mb-0">{product.storageInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <section className="pt-4 border-top">
          <h2 className="h4 fw-bold mb-3">Customer Reviews</h2>
          {reviews.length > 0 ? (
            <div className="row g-3 mb-4">
              {reviews.map((r) => (
                <div className="col-md-6" key={r.id}>
                  <div className="feature-card p-3 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-dark">{r.customerName}</strong>
                      <span className="text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <h3 className="h6 fw-bold mb-1">{r.title}</h3>
                    <p className="small text-secondary mb-0">{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary small mb-4">No reviews yet for this product. Be the first to review!</p>
          )}

          {/* Leave a review form */}
          <div className="card border p-4 bg-white rounded-4" style={{ maxWidth: '640px' }}>
            <h3 className="h5 fw-bold mb-3">Write a Customer Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Rating</label>
                <select
                  className="form-select form-select-sm"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                >
                  <option value="5">★★★★★ (5 Stars - Excellent)</option>
                  <option value="4">★★★★☆ (4 Stars - Good)</option>
                  <option value="3">★★★☆☆ (3 Stars - Average)</option>
                  <option value="2">★★☆☆☆ (2 Stars - Poor)</option>
                  <option value="1">★☆☆☆☆ (1 Star - Terrible)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Review Headline</label>
                <input
                  className="form-control form-control-sm"
                  required
                  placeholder="e.g. Delicious healthy blend!"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Comments</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  required
                  placeholder="Share your experience with taste, texture, and preparation..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
              </div>
              <button className="btn btn-brand btn-sm" type="submit" disabled={submittingReview}>
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>
        </section>
      </section>
    </>
  );
}
