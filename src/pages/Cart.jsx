import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../services/api';

export default function Cart() {
  const { items, subtotalPaise, updateQuantity, removeFromCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Your basket" title="Shopping Cart" />
        <section className="container section-space text-center py-5">
          <div className="p-4 bg-white rounded-4 border mx-auto" style={{ maxWidth: '480px' }}>
            <span className="fs-1 d-block mb-2">🛒</span>
            <h2 className="h5 fw-bold text-dark mb-2">Sign in to view your cart</h2>
            <p className="small text-secondary mb-3">Your items are securely saved to your account.</p>
            <Link to="/login" className="btn btn-brand rounded-pill px-4">
              Sign in
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-forest" role="status" />
        <p className="mt-2 text-secondary">Loading your items…</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <>
        <PageHeader eyebrow="Your basket" title="Shopping Cart" />
        <section className="container section-space text-center py-5">
          <div className="p-4 bg-white rounded-4 border mx-auto" style={{ maxWidth: '480px' }}>
            <span className="fs-1 d-block mb-2">🌾</span>
            <h2 className="h5 fw-bold text-dark mb-2">Your basket is currently empty</h2>
            <p className="small text-secondary mb-3">Explore our stone-ground millets, nuts, and seed blends.</p>
            <Link to="/shop" className="btn btn-brand rounded-pill px-4">
              Browse Millets &amp; Shop
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Your basket"
        title="Shopping Cart"
        description="Your items are saved. 100% Cash on Delivery — pay when it arrives at your home."
      />

      <section className="container section-space">
        {/* Free Home Delivery Reassurance Banner */}
        <div
          className="alert alert-success d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 p-md-4 rounded-4 shadow-sm mb-4 border-0"
          style={{ background: 'linear-gradient(135deg, #eaf5ec 0%, #d5edd9 100%)' }}
        >
          <div className="d-flex align-items-center gap-3">
            <span className="fs-2">🎉</span>
            <div>
              <strong className="text-forest fs-6 d-block mb-1">Good news! Free Home Delivery on your order!</strong>
              <span className="small text-secondary">
                Pay easily with Cash or UPI when your fresh pack arrives at your home. No advance payment needed.
              </span>
            </div>
          </div>
          <span className="badge bg-success text-white px-3 py-2 fw-semibold rounded-pill">
            ✓ FREE SHIPPING
          </span>
        </div>

        <div className="row g-4 justify-content-center">
          {/* Cart Items List */}
          <div className="col-lg-8">
            <div className="d-flex flex-column gap-3">
              {items.map((item) => (
                <article
                  key={item.variantId}
                  className="cart-item-card p-3 p-md-4 rounded-4 border bg-white shadow-xs position-relative"
                >
                  <div className="row align-items-center g-3">
                    <div className="col-auto">
                      <div
                        className="cart-item-visual rounded-3 d-flex align-items-center justify-content-center bg-light text-forest fs-2 shadow-xs"
                        style={{ width: '64px', height: '64px', border: '1px solid #e2e8f0' }}
                      >
                        🌾
                      </div>
                    </div>
                    <div className="col">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <h2 className="h6 mb-0 fw-bold text-forest">{item.productName}</h2>
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-1 small fw-semibold">
                          {item.packSize}
                        </span>
                      </div>
                      <div className="small text-secondary mb-1">
                        Price: <strong className="text-dark">{money(item.pricePaise)}</strong> <span className="text-muted">/ pack</span>
                      </div>
                      {(!item.productActive || !item.variantActive) && (
                        <span className="badge bg-danger-subtle text-danger mt-1">Currently unavailable</span>
                      )}
                    </div>
                    <div className="col-12 col-sm-auto d-flex align-items-center justify-content-between justify-content-sm-end gap-3 flex-wrap">
                      {/* Quantity Stepper */}
                      <div className="quantity-stepper d-inline-flex align-items-center border rounded-3 bg-white">
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark px-2.5 py-1 text-decoration-none"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          className="form-control text-center border-0 p-0 fw-bold"
                          style={{ width: '38px' }}
                          type="number"
                          readOnly
                          value={item.quantity}
                          aria-label={`Quantity for ${item.productName}`}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark px-2.5 py-1 text-decoration-none"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-end" style={{ minWidth: '85px' }}>
                        <div className="small text-secondary" style={{ fontSize: '0.75rem' }}>Total</div>
                        <strong className="fs-6 text-forest">
                          {money(Number(item.pricePaise) * item.quantity)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1"
                        onClick={() => removeFromCart(item.variantId)}
                        title="Remove item"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Cart Summary Column */}
          <div className="col-lg-4">
            <div className="cart-summary-card p-4 rounded-4 border bg-white shadow-xs position-sticky" style={{ top: '6rem' }}>
              <h3 className="h5 fw-bold mb-3 pb-2 border-bottom text-dark">Order Summary</h3>

              <div className="d-flex justify-content-between mb-2 small text-secondary">
                <span>Items Subtotal</span>
                <strong className="text-dark">{money(subtotalPaise)}</strong>
              </div>

              <div className="d-flex justify-content-between mb-3 small text-secondary">
                <span>Doorstep Delivery</span>
                <span className="badge bg-success-subtle text-success fw-bold">FREE</span>
              </div>

              <div className="d-flex justify-content-between py-2 border-top border-bottom mb-3">
                <span className="fw-bold text-dark fs-6">Total to Pay</span>
                <strong className="fs-4 text-forest">{money(subtotalPaise)}</strong>
              </div>

              <div className="p-3 bg-light rounded-3 mb-3 small text-secondary">
                <div className="d-flex align-items-center gap-2 mb-1 text-dark fw-semibold">
                  <span>💵</span> 100% Cash on Delivery
                </div>
                <span>Pay when order is handed over at your doorstep via Cash or instant UPI QR scan.</span>
              </div>

              <button
                type="button"
                className="btn btn-brand btn-lg w-100 rounded-pill fw-bold"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout →
              </button>

              <div className="text-center mt-3">
                <Link to="/shop" className="small text-forest fw-semibold text-decoration-none">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
