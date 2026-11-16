import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, formatTime12 } from '../services/api';

export default function Contact() {
  const { config } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Enquiry',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast('✓ Thank you! Your message has been sent to our milling team.');
      setForm({ name: '', email: '', phone: '', subject: 'General Enquiry', message: '' });
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const supportEmail = config?.supportEmail || 'kkarthik23540@gmail.com';
  const supportPhone = config?.supportPhone || '+91 7893176982';
  const whatsapp = config?.whatsapp || '+91 7893176982';
  const address = config?.supportAddress || 'Soverign Shelters, Lakdi ka pul, Hyderabad, Telangana 500004';
  const openTime = config?.openTime || '09:00';
  const closeTime = config?.closeTime || '21:00';
  const daysOpen = config?.daysOpen || 'Monday to Saturday';

  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Contact Us"
        description="We are here to answer your questions about our stone-ground millets, bulk orders, and delivery."
      />

      <section className="container section-space">
        <div className="row g-4 justify-content-center">
          {/* Contact Details Column */}
          <div className="col-lg-5">
            <div className="p-4 bg-white rounded-4 border shadow-xs h-100">
              <h2 className="h5 fw-bold text-forest mb-3">BR Millet Choice</h2>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-start gap-3">
                  <span className="fs-4">📍</span>
                  <div>
                    <strong className="d-block text-dark">Milling &amp; Packing Unit</strong>
                    <span className="small text-secondary">{address}</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <span className="fs-4">📞</span>
                  <div>
                    <strong className="d-block text-dark">Phone &amp; WhatsApp</strong>
                    <a href={`tel:${supportPhone}`} className="small text-forest text-decoration-none d-block">
                      {supportPhone}
                    </a>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <span className="fs-4">✉️</span>
                  <div>
                    <strong className="d-block text-dark">Email Support</strong>
                    <a href={`mailto:${supportEmail}`} className="small text-forest text-decoration-none d-block">
                      {supportEmail}
                    </a>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <span className="fs-4">⏰</span>
                  <div>
                    <strong className="d-block text-dark">Business Hours</strong>
                    <span className="small text-secondary">
                      {daysOpen}, {formatTime12(openTime)} – {formatTime12(closeTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-top">
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi BR Millet Choice, I would like to enquire about your millet products.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 fw-bold text-white text-decoration-none shadow-sm"
                >
                  <span>Chat on WhatsApp</span>
                  <span>💬</span>
                </a>
              </div>
            </div>
          </div>

          {/* Enquiry Form Column */}
          <div className="col-lg-7">
            <div className="p-4 bg-white rounded-4 border shadow-xs">
              <h2 className="h5 fw-bold text-dark mb-2">Send Us a Message</h2>
              <p className="small text-secondary mb-4">
                Fill in your details and our team will get back to you promptly.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Your Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Karthik Reddy"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      required
                      placeholder="10-digit mobile number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Message</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      required
                      placeholder="Tell us what you'd like to ask or enquire about…"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-brand rounded-pill px-5 py-2 mt-4 fw-bold"
                  disabled={submitting}
                >
                  {submitting ? 'Sending…' : 'Send Message →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
