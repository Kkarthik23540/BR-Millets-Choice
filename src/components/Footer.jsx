import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { isAdmin } = useAuth();
  const [visits, setVisits] = useState('0');

  useEffect(() => {
    api('/api/page-visits')
      .then((data) => {
        if (data?.pageVisits) setVisits(data.pageVisits);
      })
      .catch(() => {});
  }, []);

  if (isAdmin) return null;

  const safeNum = Math.max(0, parseInt(visits, 10) || 0);
  const digits = String(safeNum).padStart(6, '0').split('');

  return (
    <footer className="site-footer">
      <div className="container py-5">
        <div className="row gy-4">
          <div className="col-lg-4">
            <Link className="footer-brand d-inline-flex align-items-center gap-2 mb-2" to="/" aria-label="BR Millet Choice home">
              <img
                className="footer-logo"
                src="/images/br-millet-choice-logo.png"
                alt="BR Millets Choice"
                width="48"
                height="48"
                style={{ borderRadius: '50%' }}
              />
              <div>
                <strong className="d-block text-white fs-5 fw-bold">BR Millet Choice</strong>
                <span className="small text-white-50">Pure Millets • Healthy Living</span>
              </div>
            </Link>
            <p className="footer-copy mt-2 mb-0 small text-white-50">
              100% natural stone-ground unpolished millets, selected nuts, and seeds freshly packed in Hyderabad. Delivered with 100% Cash on Delivery.
            </p>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h2 className="footer-heading">Quick Links</h2>
            <Link to="/shop">Shop Packs</Link>
            <Link to="/millets">Our 8 Millets</Link>
            <Link to="/about">Our Story</Link>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h2 className="footer-heading">Help &amp; Orders</h2>
            <Link to="/orders">My Orders</Link>
            <Link to="/cart">Shopping Cart</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/contact">FAQs</Link>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <h2 className="footer-heading">Join Our Community</h2>
            <p className="small text-white-50 mb-3">
              Join our official WhatsApp channel for batch updates, health tips, and direct announcements.
            </p>
            <div className="d-flex flex-column align-items-start gap-2">
              <a
                className="btn btn-sm btn-success rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-2 text-white fw-semibold text-decoration-none shadow-sm"
                href="https://whatsapp.com/channel/0029Vb909Ye7oQhkdutTQM24"
                target="_blank"
                rel="noopener noreferrer"
                style={{ alignSelf: 'flex-start', width: 'auto', maxWidth: 'fit-content' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 2C6.516 2 2.029 6.487 2.029 12.002c0 1.956.564 3.784 1.543 5.332L2 22.012l4.825-1.53c1.472.844 3.176 1.328 5.206 1.328 5.515 0 10.002-4.487 10.002-10.008C22.033 6.487 17.546 2 12.031 2zm5.836 14.199c-.244.686-1.229 1.294-1.996 1.378-.518.056-1.196.082-3.484-.866-2.923-1.21-4.81-4.175-4.957-4.368-.147-.193-1.189-1.579-1.189-3.012 0-1.433.754-2.14 1.023-2.433.269-.293.587-.367.783-.367.196 0 .392.002.563.011.181.01.424-.069.663.504.244.586.832 2.03.905 2.177.073.147.122.318.024.514-.098.196-.147.318-.293.489-.147.171-.31.382-.442.513-.147.147-.301.308-.129.602.171.294.762 1.258 1.635 2.035 1.123 1.001 2.069 1.312 2.363 1.459.294.147.465.122.637-.074.171-.196.735-.856.931-1.15.196-.294.392-.245.662-.147.27.098 1.714.808 2.008.955.294.147.489.22.563.342.074.122.074.71-.17 1.396z" />
                </svg>
                <span>Join WhatsApp Channel</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-counter-wrap text-center mt-4 pt-3 border-top border-white border-opacity-10" data-footer-counter-section>
          <div className="visit-counter-widget is-dark" data-footer-counter>
            <div className="visit-counter-digits" aria-hidden="true">
              {digits.map((d, i) => (
                <span key={i} className="visit-digit-box">{d}</span>
              ))}
            </div>
            <span className="visit-counter-label">Page Visits</span>
          </div>
        </div>

        <div className="footer-bottom mt-3 pt-3 border-top border-white border-opacity-10 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small">
          <span className="text-white-50">© 2026 BR Millet Choice. Pure Millets • Healthy Living.</span>
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <Link to="/about" className="text-white-50 text-decoration-none">About</Link>
            <Link to="/contact" className="text-white-50 text-decoration-none">Contact</Link>
            <Link to="/millets" className="text-white-50 text-decoration-none">Millets</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
