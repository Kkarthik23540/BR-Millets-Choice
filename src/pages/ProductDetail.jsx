import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { api, money } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: 5, totalCount: 0 });
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    setLoading(true);
    api(`/api/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        setProduct(data.product);
        const variants = data.product?.variants || [];
        const first = variants.find((v) => v.stockQuantity > 0) || variants[0];
        if (first) setSelectedVariantId(first.id);

        if (data.product?.id) {
          api(`/api/products/${data.product.id}/reviews`)
            .then((rData) => setReviewsData(rData))
            .catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

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
        <h2 className="h4 fw-bold">Product not found</h2>
        <p className="text-secondary">This millet product may have been moved or removed.</p>
        <Link to="/shop" className="btn btn-brand rounded-pill px-4 mt-2">
          Back to Shop
        </Link>
      </div>
    );
  }

  const variants = product.variants || [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const isOutOfStock = !selectedVariant || selectedVariant.stockQuantity < 1;
  const isLowStock = selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity <= (selectedVariant.lowStockThreshold || 5);

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;
    await addToCart(selectedVariant.id, quantity);
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || isOutOfStock) return;
    const ok = await addToCart(selectedVariant.id, quantity);
    if (ok) navigate('/checkout');
  };

  const handleSubscribeRestock = async () => {
    if (!user) {
      showToast('Please sign in to subscribe for restock alerts.', true, '/login');
      return;
    }
    try {
      await api('/api/restock-subscriptions', {
        method: 'POST',
        body: JSON.stringify({ variantId: selectedVariant.id }),
      });
      showToast('✓ You will be emailed as soon as this pack is back in stock!');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to submit a review.', true, '/login');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(reviewForm.rating),
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });
      showToast('✓ Thank you! Your review has been submitted for verification.');
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Product Details"
        title={product.name}
        description="Fresh stone-ground millet flour prepared hygienically in Hyderabad."
      />

      <section className="container section-space">
        <div className="row g-4 justify-content-center">
          {/* Product Media Column */}
          <div className="col-lg-5">
            <div className="product-media-card bg-white p-3 p-md-4 rounded-4 border text-center shadow-xs">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="img-fluid rounded-3 object-fit-contain w-100"
                  style={{ maxHeight: '380px' }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center text-forest display-1 bg-light rounded-3"
                  style={{ height: '320px' }}
                >
                  🌾
                </div>
              )}

              <div className="d-flex justify-content-around mt-3 pt-3 border-top text-center">
                <div>
                  <span className="fs-5 d-block">🌾</span>
                  <small className="text-secondary fw-semibold">100% Unpolished</small>
                </div>
                <div>
                  <span className="fs-5 d-block">⚙️</span>
                  <small className="text-secondary fw-semibold">Cold Stone Ground</small>
                </div>
                <div>
                  <span className="fs-5 d-block">🚚</span>
                  <small className="text-secondary fw-semibold">Cash on Delivery</small>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info & Purchase Column */}
          <div className="col-lg-7">
            <div className="product-summary-card bg-white p-3 p-md-4 rounded-4 border shadow-xs">
              <span className="badge bg-light text-secondary border px-3 py-1 rounded-pill mb-2">
                {product.category || 'Millet Powders'}
              </span>
              <h1 className="h3 fw-bold text-dark mb-2">{product.name}</h1>

              {/* Price & Stock Box */}
              <div className="p-3 bg-light rounded-3 border mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <small className="text-secondary d-block">Price</small>
                  <strong className="fs-3 text-forest">
                    {selectedVariant ? money(selectedVariant.pricePaise) : '—'}
                  </strong>
                  <small className="text-secondary d-block">Inclusive of all taxes</small>
                </div>
                <div>
                  {isOutOfStock ? (
                    <span className="badge bg-danger rounded-pill px-3 py-1.5 fs-6">Out of stock</span>
                  ) : isLowStock ? (
                    <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5 fs-6">
                      Low stock ({selectedVariant.stockQuantity} left)
                    </span>
                  ) : (
                    <span className="badge bg-success rounded-pill px-3 py-1.5 fs-6">✓ In stock</span>
                  )}
                </div>
              </div>

              {/* Pack Size Pills */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-dark d-block">Select Pack Size:</label>
                <div className="d-flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${
                        v.id === selectedVariantId ? 'btn-brand' : 'btn-outline-secondary'
                      }`}
                      onClick={() => setSelectedVariantId(v.id)}
                    >
                      {v.packSize} — {money(v.pricePaise)} {v.stockQuantity < 1 ? '(Out of stock)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper & Actions */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="fw-bold small text-dark">Quantity:</span>
                  <div className="quantity-stepper d-inline-flex align-items-center border rounded-3 bg-white">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-dark px-3 py-1 text-decoration-none"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <input
                      className="form-control text-center border-0 p-0 fw-bold"
                      style={{ width: '44px' }}
                      type="number"
                      readOnly
                      value={quantity}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-dark px-3 py-1 text-decoration-none"
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-brand btn-lg flex-fill fw-bold rounded-pill"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    🛒 Add to Cart
                  </button>
                  <button
                    type="button"
                    className="btn btn-brand btn-lg flex-fill fw-bold rounded-pill"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                  >
                    ⚡ Buy Now
                  </button>
                </div>

                {isOutOfStock && selectedVariant && (
                  <button
                    type="button"
                    className="btn btn-outline-brand w-100 rounded-pill mt-2"
                    onClick={handleSubscribeRestock}
                  >
                    🔔 Notify me when available
                  </button>
                )}
              </div>

              {/* Accordions */}
              <div className="product-info-tabs">
                <details className="border rounded-3 p-3 mb-2 bg-light" open>
                  <summary className="fw-bold text-dark" style={{ cursor: 'pointer' }}>
                    Description &amp; Benefits
                  </summary>
                  <p className="small text-secondary mt-2 mb-0" style={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                    {product.description || 'Pure stone-ground millet powder with natural dietary fiber and rich mineral content.'}
                  </p>
                </details>

                {product.ingredients && (
                  <details className="border rounded-3 p-3 mb-2 bg-light" open>
                    <summary className="fw-bold text-dark" style={{ cursor: 'pointer' }}>
                      Ingredients &amp; Sourcing
                    </summary>
                    <p className="small text-secondary mt-2 mb-0" style={{ whiteSpace: 'pre-line', lineHeight: 1.75 }}>
                      {product.ingredients}
                    </p>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-5 pt-4 border-top">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Customer Reviews &amp; Ratings</h2>
              <div className="d-flex align-items-center gap-2">
                <span className="text-warning fs-5">
                  {'★'.repeat(Math.round(reviewsData.averageRating || 5))}
                </span>
                <strong>{reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : '5.0'} / 5</strong>
                <span className="text-secondary">({reviewsData.totalCount} verified reviews)</span>
              </div>
            </div>
          </div>

          {/* Leave a review form */}
          <details className="mb-4">
            <summary className="btn btn-sm btn-outline-brand rounded-pill px-3 py-1.5 fw-semibold" style={{ cursor: 'pointer' }}>
              ✍️ Write a Customer Review
            </summary>
            <div className="p-4 border rounded-4 bg-light mt-3" style={{ maxWidth: '640px' }}>
              <h3 className="h6 fw-bold mb-3">Share your feedback for {product.name}</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="review-rating">Overall Rating</label>
                  <select
                    id="review-rating"
                    className="form-select form-select-sm w-auto"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                    <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                    <option value="3">⭐⭐⭐ (3 - Good)</option>
                    <option value="2">⭐⭐ (2 - Fair)</option>
                    <option value="1">⭐ (1 - Poor)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="review-title">Review Headline (optional)</label>
                  <input
                    id="review-title"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g., Very fresh and aromatic!"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="review-comment">Your Review</label>
                  <textarea
                    id="review-comment"
                    className="form-control form-control-sm"
                    rows="3"
                    required
                    placeholder="Tell us what you liked about the texture, quality, and taste…"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-sm btn-brand rounded-pill px-4"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            </div>
          </details>

          {/* Existing reviews */}
          {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
            <div className="row g-3">
              {reviewsData.reviews.map((r) => (
                <div className="col-md-6" key={r.id}>
                  <div className="p-3 bg-white border rounded-4 h-100 shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-warning small">
                        {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                      </span>
                      <span className="small text-muted">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {r.title && <h4 className="h6 fw-bold mb-1 text-dark">{r.title}</h4>}
                    <p className="small text-secondary mb-2">{r.comment}</p>
                    <div className="pt-2 border-top small text-forest fw-semibold">
                      👤 {r.customerName || 'Verified Buyer'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary small">No customer reviews yet. Be the first to share your experience!</p>
          )}
        </div>
      </section>
    </>
  );
}
