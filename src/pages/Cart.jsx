import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { money } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { confirmAction } from '../services/modal';

export default function Cart() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { showToast } = useToast();
  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  const handleClearCart = async () => {
    const confirmed = await confirmAction({
      title: 'Clear Shopping Cart',
      message: 'Are you sure you want to remove all items from your cart?',
      confirmText: 'Yes, Clear Cart',
      cancelText: 'Keep Items',
      isDanger: true,
    });
    if (!confirmed) return;
    await clearCart();
    showToast('Cart cleared.');
  };

  const handleStepQuantity = async (variantId, newQty, productName) => {
    if (newQty <= 0) {
      const confirmed = await confirmAction({
        title: 'Remove Item',
        message: `Are you sure you want to remove "${productName || 'this item'}" from your cart?`,
        confirmText: 'Yes, Remove Item',
        cancelText: 'No, Keep Item',
        isDanger: true,
      });
      if (!confirmed) return;
      await updateQuantity(variantId, 0);
      showToast('Item removed from your cart.');
    } else {
      await updateQuantity(variantId, newQty);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Your order request"
        title="Shopping cart"
        description="Review selected packs, adjust quantities, and proceed to checkout."
      />

      <section className="container section-space py-4">
        {isEmpty ? (
          <div className="empty-state text-center py-5 bg-white rounded-4 border p-5">
            <span className="fs-1 d-block mb-3">🛒</span>
            <h2 className="h4 fw-bold mb-2">Your cart is currently empty</h2>
            <p className="text-secondary mb-4">Explore our fresh unpolished millet blends and stone-ground packs.</p>
            <Link to="/shop" className="btn btn-brand">
              Browse Millets &amp; Shop Packs
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* Cart Items List */}
            <div className="col-lg-8">
              <div className="bg-white rounded-4 border p-4 shadow-xs">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h2 className="h5 fw-bold mb-0">Order Items ({items.length})</h2>
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="cart-items-list">
                  {items.map((item) => (
                    <article
                      key={item.variantId}
                      className="d-flex flex-wrap align-items-center justify-content-between gap-3 py-3 border-bottom"
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-light rounded-3 d-flex align-items-center justify-content-center text-forest fs-4"
                          style={{ width: '64px', height: '64px' }}
                        >
                          🌾
                        </div>
                        <div>
                          <h3 className="h6 fw-bold mb-1">
                            <Link to={`/product/${item.productSlug}`} className="text-decoration-none text-dark">
                              {item.productName}
                            </Link>
                          </h3>
                          <span className="badge bg-light text-secondary border">{item.packSize}</span>
                          <span className="d-block small text-forest fw-bold mt-1">
                            {money(item.pricePaise)} each
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        <div className="input-group input-group-sm" style={{ width: '100px' }}>
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => handleStepQuantity(item.variantId, item.quantity - 1, item.productName)}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            className="form-control text-center bg-white"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => handleStepQuantity(item.variantId, item.quantity + 1, item.productName)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <strong className="text-forest fs-6" style={{ minWidth: '70px', textAlign: 'right' }}>
                          {money(item.lineTotalPaise)}
                        </strong>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleStepQuantity(item.variantId, 0, item.productName)}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-lg-4">
              <div className="feature-card p-4 bg-white rounded-4 border shadow-xs">
                <h3 className="h5 fw-bold mb-3">Order Summary</h3>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Subtotal</span>
                  <strong className="text-dark">{money(cart.subtotalPaise)}</strong>
                </div>

                <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                  <span className="text-secondary">Delivery</span>
                  <span className="text-success fw-bold">FREE (Cash on Delivery)</span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5 fw-bold text-dark">Total Amount</span>
                  <strong className="fs-4 text-forest">{money(cart.totalPaise)}</strong>
                </div>

                <Link to="/checkout" className="btn btn-brand w-100 btn-lg mb-3">
                  Proceed to Checkout →
                </Link>

                <p className="small text-secondary mb-0 text-center">
                  🚚 100% Cash on Delivery across India. Pay easily at your doorstep.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
