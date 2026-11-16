import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { api, money } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
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
          const firstAvail = data.product.variants.find((v) => v.stockQuantity > 0) || data.product.variants[0];
          setSelectedVariantId(firstAvail.id);
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
        <p className="mt-2 text-secondary">Loading product details…</p>
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

  const averageRating = reviews.length
    ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length
    : 5;
  const ratingRound = Math.round(averageRating);
  const starsHtml = '★'.repeat(ratingRound) + '☆'.repeat(5 - ratingRound);

  const handleAdd = () => {
    if (selectedVariant) {
      addToCart(selectedVariant.id, quantity);
    }
  };

  const handleBuyNow = () => {
    if (selectedVariant) {
      addToCart(selectedVariant.id, quantity);
      navigate('/checkout');
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
      // Reload reviews
      api(`/api/reviews?productSlug=${encodeURIComponent(slug)}`)
        .then((data) => setReviews(data.reviews || []))
        .catch(() => {});
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
      <section className="container section-space product-detail-page py-4">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav mb-4" aria-label="Breadcrumb">
          <Link to="/" className="text-decoration-none">Home</Link> <span className="mx-1">/</span>
          <Link to="/shop" className="text-decoration-none">Products</Link> <span className="mx-1">/</span>
          <span className="text-secondary">{product.name}</span>
        </nav>

        <div className="row g-4 g-lg-5 align-items-start">
          {/* Product Visual / Gallery */}
          <div className="col-lg-6">
            <div className="product-visual-card position-relative bg-white p-3 rounded-4 border shadow-sm">
              <span className="badge bg-success-subtle text-success position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill fw-semibold border border-success-subtle">
                🌾 100% Stone-Ground
              </span>
              <div className="product-main-image-wrap text-center py-2">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="img-fluid rounded-3 product-zoom-img"
                    style={{ maxHeight: '380px', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="product-placeholder-box py-5">
                    <span className="fs-1">🌾</span>
                    <p className="text-secondary small mt-2">100% Pure Millet Powder</p>
                  </div>
                )}
              </div>
            </div>

            <div className="product-perks-row mt-3 d-flex gap-2 text-center">
              <div className="perk-box flex-fill p-2 rounded-3 bg-light border">
                <span className="small fw-bold d-block">🚫 Zero Bleach</span>
                <span className="small text-secondary">Chemical-free</span>
              </div>
              <div className="perk-box flex-fill p-2 rounded-3 bg-light border">
                <span className="small fw-bold d-block">⚙️ Cold Milled</span>
                <span className="small text-secondary">Retains oils</span>
              </div>
              <div className="perk-box flex-fill p-2 rounded-3 bg-light border">
                <span className="small fw-bold d-block">🌿 Whole Bran</span>
                <span className="small text-secondary">High fiber</span>
              </div>
            </div>
          </div>

          {/* Product Purchase Information */}
          <div className="col-lg-6">
            <div className="product-summary-card">
              <span className="badge bg-light text-secondary border px-3 py-1 rounded-pill mb-2">
                {product.category || 'Millet Powders'}
              </span>
              <h1 className="h2 fw-bold text-dark mb-2">{product.name}</h1>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="text-warning fs-5">{starsHtml}</span>
                <strong className="text-dark">{reviews.length > 0 ? averageRating.toFixed(1) : '5.0'} / 5</strong>
                <span className="text-secondary small">({reviews.length} verified review{reviews.length === 1 ? '' : 's'})</span>
              </div>

              <div className="product-price-box p-3 bg-light rounded-3 border mb-4 d-flex align-items-center justify-content-between">
                <div>
                  <span className="small text-secondary d-block">Special Price</span>
                  <strong className="fs-2 text-success">
                    {selectedVariant ? money(selectedVariant.pricePaise) : 'Contact for price'}
                  </strong>
                  <span className="small text-secondary d-block">Inclusive of all taxes</span>
                </div>
                <div>
                  <span className={`availability ${isOutOfStock ? 'out_of_stock' : selectedVariant?.stockQuantity < 5 ? 'low_stock' : 'in_stock'}`}>
                    {isOutOfStock ? 'Out of stock' : selectedVariant?.stockQuantity < 5 ? 'Low stock' : 'In stock'}
                  </span>
                </div>
              </div>

              {/* Pack Size Selection Pills */}
              {product.variants?.length > 0 && (
                <div className="mb-4">
                  <label className="form-label fw-bold small text-dark d-block">Select Pack Size:</label>
                  <div className="pack-size-pills d-flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`btn pack-pill ${v.id === selectedVariantId ? 'active' : ''}`}
                        onClick={() => setSelectedVariantId(v.id)}
                      >
                        {v.packSize}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="product-actions-box mb-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="fw-bold small text-dark">Quantity:</span>
                  <div className="quantity-stepper d-inline-flex align-items-center border rounded-3 bg-white">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-dark px-3 py-1 text-decoration-none"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      id="product-quantity"
                      className="form-control text-center border-0 p-0 fw-bold"
                      style={{ width: '44px' }}
                      type="number"
                      min="1"
                      max="99"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-dark px-3 py-1 text-decoration-none"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-outline-brand btn-lg flex-fill fw-bold"
                    disabled={isOutOfStock}
                    onClick={handleAdd}
                  >
                    🛒 Add to Cart
                  </button>
                  <button
                    className="btn btn-brand btn-lg flex-fill fw-bold"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                  >
                    ⚡ Buy Now
                  </button>
                </div>
              </div>

              {/* Delivery & Payment reassurance */}
              <div className="p-3 bg-light rounded-3 border mb-4">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="fs-5">🚚</span>
                  <strong className="small text-dark">Free Doorstep Delivery on orders over ₹500</strong>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">💵</span>
                  <span className="small text-secondary">Cash on Delivery (COD) &amp; Instant UPI accepted</span>
                </div>
              </div>

              {/* Product details accordion */}
              <div className="product-info-tabs">
                <details className="product-accordion-item border rounded-3 p-3 mb-2 bg-white" open>
                  <summary className="fw-bold text-dark" style={{ cursor: 'pointer' }}>Description &amp; Benefits</summary>
                  <p className="small text-secondary mt-2 mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.65' }}>
                    {product.description || 'Pure stone-ground millet powder with natural dietary fiber and rich mineral content.'}
                  </p>
                </details>
                {product.ingredients && (
                  <details className="product-accordion-item border rounded-3 p-3 mb-2 bg-white" open>
                    <summary className="fw-bold text-dark" style={{ cursor: 'pointer' }}>Ingredients &amp; Sourcing</summary>
                    <p className="small text-secondary mt-2 mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.75' }}>
                      {product.ingredients}
                    </p>
                  </details>
                )}
                {product.storageInstructions && (
                  <details className="product-accordion-item border rounded-3 p-3 mb-2 bg-white">
                    <summary className="fw-bold text-dark" style={{ cursor: 'pointer' }}>Storage Instructions</summary>
                    <p className="small text-secondary mt-2 mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.65' }}>
                      {product.storageInstructions}
                    </p>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <hr className="my-5" />
        <div className="product-reviews-section">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="h3 mb-1">Customer Reviews &amp; Ratings</h2>
              <div className="d-flex align-items-center gap-2">
                <span className="text-warning fs-4">{starsHtml}</span>
                <strong>{reviews.length > 0 ? averageRating.toFixed(1) : '5.0'} out of 5</strong>
                <span className="text-secondary">({reviews.length} verified review{reviews.length === 1 ? '' : 's'})</span>
              </div>
            </div>

            <details className="w-100 mt-2">
              <summary className="btn btn-outline-brand">✍️ Write a Customer Review</summary>
              <div className="feature-card p-4 border rounded-3 bg-light mt-3">
                <h3 className="h5 mb-3">Share your feedback for {product.name}</h3>
                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="review-rating">Overall Rating</label>
                    <select
                      className="form-select w-auto"
                      id="review-rating"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                      required
                    >
                      <option value="5">★★★★★ 5 - Excellent, loved it!</option>
                      <option value="4">★★★★☆ 4 - Very good</option>
                      <option value="3">★★★☆☆ 3 - Good / Average</option>
                      <option value="2">★★☆☆☆ 2 - Below expectations</option>
                      <option value="1">★☆☆☆☆ 1 - Poor</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="review-title">Review Headline (optional)</label>
                    <input
                      className="form-control"
                      id="review-title"
                      placeholder="e.g. Pure, aromatic and fresh millet flour!"
                      maxLength={120}
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="review-comment">Your Review / Experience</label>
                    <textarea
                      className="form-control"
                      id="review-comment"
                      rows="3"
                      placeholder="Tell us about the freshness, taste, or how you cooked it..."
                      required
                      minLength={5}
                      maxLength={1500}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    />
                    <div className="form-text">Minimum 5 characters. Authentic feedback helps other families make healthy choices.</div>
                  </div>
                  <button className="btn btn-brand" type="submit" disabled={submittingReview}>
                    {submittingReview ? 'Publishing…' : 'Publish Review'}
                  </button>
                </form>
              </div>
            </details>
          </div>

          {reviews.length > 0 ? (
            <div className="row g-3">
              {reviews.map((r) => (
                <div key={r.id} className="col-12">
                  <article className="address-card">
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                      <div>
                        {r.title && <h3 className="h5 mb-1">{r.title}</h3>}
                        <div className="small text-secondary">
                          By <strong>{r.customerName}</strong> ·{' '}
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}
                        </div>
                      </div>
                      <span className="text-warning fw-bold">
                        {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    <p className="mt-2 mb-0">{r.comment}</p>
                  </article>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No reviews yet</h3>
              <p className="text-secondary mb-0">Be the first to share your experience with {product.name}!</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
