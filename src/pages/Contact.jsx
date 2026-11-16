import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function Contact() {
  const { config } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
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
      showToast('✓ Thank you! Your enquiry has been received.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const address = config?.supportAddress || 'Soverign Shelters, lakdi ka pul, Hyderabad';
  const phone = config?.supportPhone || '';
  const email = config?.supportEmail || '';
  const whatsapp = config?.whatsapp || '';
  const lat = config?.businessLatitude;
  const lng = config?.businessLongitude;
  const mapQuery = address || (lat != null && lng != null ? `${lat},${lng}` : 'Soverign Shelters, lakdi ka pul, Hyderabad');

  return (
    <>
      <PageHeader
        eyebrow="We are here to help"
        title="Contact BR Millet Choice"
        description="Send a product, order or general enquiry."
      />

      <section className="container section-space">
        <div className="row g-4 g-lg-5 align-items-start">
          {/* Left Form */}
          <div className="col-xl-7">
            <form className="form-shell contact-form" onSubmit={handleSubmit}>
              <h2 className="h4 mb-4">
                <svg className="contact-heading-icon me-2" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                Send us a message
              </h2>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="contact-name">Your name</label>
                  <input
                    className="form-control"
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="contact-email">Email address</label>
                  <input
                    className="form-control"
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="contact-subject">Subject</label>
                  <input
                    className="form-control"
                    id="contact-subject"
                    name="subject"
                    required
                    maxLength={120}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="contact-message">Message</label>
                  <textarea
                    className="form-control"
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    minLength={10}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <button className="btn btn-brand" type="submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send enquiry'}
                  </button>
                  <p className="small text-secondary mt-3 mb-0">
                    Your enquiry is recorded for the BR Millet Choice team. Email acknowledgements are sent when email is configured.
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Right Info */}
          <div className="col-xl-5">
            <div className="feature-card contact-card">
              <p className="eyebrow mb-2">Get in touch</p>
              <h2 className="h4 mb-2">Contact us directly</h2>
              <p className="contact-card-intro">Choose the option that works best for you. The footer also links to this contact page.</p>

              <ul className="contact-details-list list-unstyled my-3">
                {address && (
                  <li className="d-flex align-items-start gap-2 mb-2">
                    <span className="contact-label text-forest fw-semibold">Location:</span>
                    <span>{address}</span>
                  </li>
                )}
                {email && (
                  <li className="d-flex align-items-start gap-2 mb-2">
                    <span className="contact-label text-forest fw-semibold">Email:</span>
                    <a href={`mailto:${encodeURIComponent(email)}`} className="text-forest text-decoration-none">{email}</a>
                  </li>
                )}
                {phone && (
                  <li className="d-flex align-items-start gap-2 mb-2">
                    <span className="contact-label text-forest fw-semibold">Phone:</span>
                    <a href={`tel:${encodeURIComponent(phone)}`} className="text-forest text-decoration-none">{phone}</a>
                  </li>
                )}
                {whatsapp && (
                  <li className="d-flex align-items-start gap-2 mb-2">
                    <span className="contact-label text-forest fw-semibold">WhatsApp:</span>
                    <a href={`https://wa.me/${encodeURIComponent(whatsapp.replace(/\D/g, ''))}`} target="_blank" rel="noopener noreferrer" className="text-forest text-decoration-none">
                      Message us on WhatsApp
                    </a>
                  </li>
                )}
              </ul>

              {/* Location Map Card */}
              <section className="location-map-card mt-4" aria-label="Business location">
                <div className="location-map-heading d-flex align-items-center justify-content-between mb-2">
                  <h3 className="h6 mb-0 fw-bold">Our Location</h3>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-brand"
                  >
                    <svg className="me-1" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Google Maps
                  </a>
                </div>
                <div className="google-map-container">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps business location"
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
