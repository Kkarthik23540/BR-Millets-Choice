import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { api, money } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New address inline form state
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    recipientName: user?.fullName || '',
    phone: '',
    line1: '',
    line2: '',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '',
    isDefault: true,
  });

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (user?.emailVerified) {
      api('/api/addresses')
        .then((data) => {
          const addrs = data.addresses || [];
          setAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        })
        .catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Order checkout" title="Sign in to complete your order" />
        <section className="container section-space py-5 text-center">
          <div className="card p-5 mx-auto bg-white rounded-4 border shadow-xs" style={{ maxWidth: '520px' }}>
            <span className="fs-1 d-block mb-3">🔒</span>
            <h2 className="h4 fw-bold mb-2">Sign-in Required</h2>
            <p className="text-secondary mb-4">
              Please sign in to your account so we can link your delivery address and order tracking securely.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/login" className="btn btn-brand px-4">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-outline-brand px-4">
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Order checkout" title="Your cart is empty" />
        <section className="container section-space py-5 text-center">
          <p className="text-secondary mb-4">Add some millet packs to your cart before proceeding to checkout.</p>
          <Link to="/shop" className="btn btn-brand">
            Browse Shop Packs
          </Link>
        </section>
      </>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalAddressId = selectedAddressId;

      // If user had no addresses, save the new one first
      if (!finalAddressId && addresses.length === 0) {
        const addrRes = await api('/api/addresses', {
          method: 'POST',
          body: JSON.stringify(newAddress),
        });
        finalAddressId = addrRes.address.id;
      }

      if (!finalAddressId) {
        showToast('Please select or provide a delivery address.', true);
        setSubmitting(false);
        return;
      }

      const orderRes = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          addressId: finalAddressId,
          paymentMethod: 'cash_on_handover',
          customerNotes,
        }),
      });

      showToast('✓ Order placed successfully! We will confirm availability with you.');
      await refreshCart();
      navigate(`/orders/${orderRes.order.id}`);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Final step"
        title="Confirm order request"
        description="Delivery address, Cash on Delivery confirmation, and order submission."
      />

      <section className="container section-space py-4">
        <form onSubmit={handlePlaceOrder}>
          <div className="row g-4">
            <div className="col-lg-8">
              {/* Delivery Address Section */}
              <div className="bg-white rounded-4 border p-4 shadow-xs mb-4">
                <h2 className="h5 fw-bold mb-3">1. Delivery Address</h2>

                {addresses.length > 0 ? (
                  <div className="d-flex flex-column gap-2 mb-3">
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`p-3 rounded-3 border d-flex align-items-start gap-3 cursor-pointer ${
                          selectedAddressId === a.id ? 'border-success bg-success-subtle bg-opacity-25' : 'bg-light'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name="address"
                          className="form-check-input mt-1"
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                        />
                        <div>
                          <strong>{a.label}</strong> {a.isDefault && <span className="status-pill ms-2">Default</span>}
                          <p className="small text-secondary mb-0">
                            {a.recipientName} · {a.phone}
                            <br />
                            {a.line1} {a.line2 ? `${a.line2}, ` : ''}{a.city}, {a.state} {a.postalCode}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="new-address-form">
                    <p className="small text-secondary mb-3">
                      Please enter your delivery address where the packs will be delivered.
                    </p>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small">Recipient Name</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.recipientName}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small">Contact Phone Number</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          type="tel"
                          placeholder="e.g. +91 9876543210"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small">Address Line 1</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          placeholder="House/Flat No., Street, Landmark"
                          value={newAddress.line1}
                          onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">City</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">State</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">Postal Code (PIN)</label>
                        <input
                          className="form-control form-control-sm"
                          required
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <label className="form-label small">Delivery or Packaging Instructions (Optional)</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    placeholder="e.g. Please deliver in the evening, or call upon arrival."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="bg-white rounded-4 border p-4 shadow-xs">
                <h2 className="h5 fw-bold mb-3">2. Payment Method</h2>
                <div className="alert alert-success border-success-subtle d-flex align-items-center gap-3 mb-0">
                  <span className="fs-3">💵</span>
                  <div>
                    <strong className="d-block text-success">100% Cash on Delivery (COD)</strong>
                    <span className="small text-secondary">
                      Pay with cash or UPI (Google Pay, PhonePe, Paytm) upon doorstep delivery. No advance online payment required.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Review Sidebar */}
            <div className="col-lg-4">
              <div className="feature-card p-4 bg-white rounded-4 border shadow-xs">
                <h3 className="h5 fw-bold mb-3">Items in Order ({items.length})</h3>

                <div className="checkout-items-list mb-3 pb-2 border-bottom">
                  {items.map((it) => (
                    <div key={it.variantId} className="d-flex justify-content-between small mb-2">
                      <span>
                        {it.productName} ({it.packSize}) × {it.quantity}
                      </span>
                      <strong>{money(it.lineTotalPaise)}</strong>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Subtotal</span>
                  <strong>{money(cart.subtotalPaise)}</strong>
                </div>

                <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                  <span className="text-secondary">Delivery Charge</span>
                  <span className="text-success fw-bold">FREE</span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5 fw-bold">Total to Pay</span>
                  <strong className="fs-4 text-forest">{money(cart.totalPaise)}</strong>
                </div>

                <button
                  type="submit"
                  className="btn btn-brand w-100 btn-lg mb-3"
                  disabled={submitting}
                >
                  {submitting ? 'Placing Order…' : 'Submit Order Request (COD) →'}
                </button>

                <p className="small text-secondary mb-0 text-center">
                  By submitting, you agree to our terms of service and delivery confirmation policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
