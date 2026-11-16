import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, money } from '../services/api';

export default function Checkout() {
  const { items, subtotalPaise, refreshCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
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
    if (!user) return;
    api('/api/addresses')
      .then((data) => {
        const list = data.addresses || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def.id);
        else setShowNewAddressForm(true);
      })
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Order checkout" title="Checkout" />
        <section className="container section-space text-center py-5">
          <div className="p-4 bg-white rounded-4 border mx-auto" style={{ maxWidth: '480px' }}>
            <span className="fs-1 d-block mb-2">🔐</span>
            <h2 className="h5 fw-bold text-dark mb-2">Sign in required to checkout</h2>
            <p className="small text-secondary mb-3">Please sign in to confirm your delivery address.</p>
            <Link to="/login" className="btn btn-brand rounded-pill px-4">
              Sign in
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (!items.length) {
    return (
      <>
        <PageHeader eyebrow="Order checkout" title="Checkout" />
        <section className="container section-space text-center py-5">
          <div className="p-4 bg-white rounded-4 border mx-auto" style={{ maxWidth: '480px' }}>
            <span className="fs-1 d-block mb-2">🌾</span>
            <h2 className="h5 fw-bold text-dark mb-2">Your basket is empty</h2>
            <p className="small text-secondary mb-3">Add items to your cart before proceeding to checkout.</p>
            <Link to="/shop" className="btn btn-brand rounded-pill px-4">
              Browse Shop
            </Link>
          </div>
        </section>
      </>
    );
  }

  const handleSaveNewAddress = async (e) => {
    e.preventDefault();
    try {
      const data = await api('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      });
      showToast('Address saved successfully!');
      const updated = await api('/api/addresses');
      setAddresses(updated.addresses || []);
      setSelectedAddressId(data.address?.id || updated.addresses?.[0]?.id);
      setShowNewAddressForm(false);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select or add a delivery address.', true);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api('/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod: 'cash_on_handover',
          customerNote,
        }),
      });
      await refreshCart();
      showToast('🎉 Your Cash on Delivery order has been placed!');
      navigate(`/orders/${encodeURIComponent(res.order.id)}`);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Order checkout"
        title="Doorstep Delivery Checkout"
        description="Cash on Delivery &amp; UPI on handover available across India."
      />

      <section className="container section-space">
        <div className="row g-4 justify-content-center">
          {/* Main Checkout Steps */}
          <div className="col-lg-7">
            {/* Step 1: Delivery Address */}
            <div className="p-4 bg-white rounded-4 border shadow-xs mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <h2 className="h6 fw-bold mb-0 text-dark">1. Delivery Address</h2>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-forest fw-semibold p-0 text-decoration-none"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                >
                  {showNewAddressForm ? '← Use Saved Address' : '+ Add New Address'}
                </button>
              </div>

              {!showNewAddressForm ? (
                addresses.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`d-flex align-items-start gap-3 p-3 rounded-3 border cursor-pointer ${
                          selectedAddressId === addr.id ? 'border-success bg-success-subtle' : 'bg-white'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          className="form-check-input mt-1"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <div>
                          <strong className="d-block text-dark">{addr.recipientName} ({addr.label || 'Home'})</strong>
                          <span className="small text-secondary d-block">
                            {addr.line1} {addr.line2 || ''}, {addr.city}, {addr.state} — {addr.postalCode}
                          </span>
                          <span className="small text-muted d-block mt-1">📞 {addr.phone}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="small text-secondary mb-2">No saved addresses found.</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-brand rounded-pill"
                      onClick={() => setShowNewAddressForm(true)}
                    >
                      + Add Delivery Address
                    </button>
                  </div>
                )
              ) : (
                /* New Address Form */
                <form onSubmit={handleSaveNewAddress}>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Recipient Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newAddress.recipientName}
                        onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        required
                        placeholder="10-digit mobile number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Address Line 1 (Flat/House/Street)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Address Line 2 (Landmark, Area)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newAddress.line2}
                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">City</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">State</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">PIN Code</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        pattern="[0-9]{6}"
                        placeholder="6-digit PIN"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-sm btn-brand rounded-pill px-4 mt-3">
                    Save and Use This Address
                  </button>
                </form>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="p-4 bg-white rounded-4 border shadow-xs mb-4">
              <h2 className="h6 fw-bold mb-3 pb-2 border-bottom text-dark">2. Payment Method</h2>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3 border border-success bg-success-subtle">
                <input type="radio" checked readOnly className="form-check-input" />
                <div>
                  <strong className="d-block text-forest">Cash on Delivery (Pay at Doorstep)</strong>
                  <span className="small text-secondary">
                    Pay with Cash or instant UPI QR scan when your fresh pack arrives.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Instructions & Notes */}
            <div className="p-4 bg-white rounded-4 border shadow-xs">
              <h2 className="h6 fw-bold mb-3 pb-2 border-bottom text-dark">3. Delivery Note (Optional)</h2>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                placeholder="e.g. Ring the bell twice, or deliver after 5 PM…"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
            </div>
          </div>

          {/* Checkout Summary Column */}
          <div className="col-lg-5">
            <div className="p-4 bg-white rounded-4 border shadow-xs position-sticky" style={{ top: '6rem' }}>
              <h3 className="h6 fw-bold mb-3 pb-2 border-bottom text-dark">Order Summary</h3>

              <div className="d-flex flex-column gap-2 mb-3">
                {items.map((item) => (
                  <div key={item.variantId} className="d-flex justify-content-between align-items-center small">
                    <div>
                      <strong className="text-dark">{item.productName}</strong>
                      <span className="text-muted d-block">{item.packSize} × {item.quantity}</span>
                    </div>
                    <span className="fw-semibold text-dark">{money(Number(item.pricePaise) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-top">
                <div className="d-flex justify-content-between mb-1 small text-secondary">
                  <span>Subtotal</span>
                  <span>{money(subtotalPaise)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 small text-secondary">
                  <span>Delivery</span>
                  <span className="text-success fw-bold">FREE</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-top border-bottom mb-3">
                  <strong className="fs-6 text-dark">Total Amount</strong>
                  <strong className="fs-4 text-forest">{money(subtotalPaise)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-brand btn-lg w-100 rounded-pill fw-bold"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !selectedAddressId}
              >
                {isSubmitting ? 'Placing Order…' : 'Place Cash on Delivery Order 🌾'}
              </button>

              <p className="small text-secondary text-center mt-3 mb-0">
                🔒 Safe &amp; verified checkout. No payment details required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
