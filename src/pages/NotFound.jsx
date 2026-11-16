import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="Not found" title="We couldn’t find that page" />
      <section className="container section-space py-5 text-center">
        <div className="p-4 p-md-5 bg-white rounded-4 border shadow-xs mx-auto" style={{ maxWidth: '440px' }}>
          <span className="fs-1 d-block mb-3">🌾</span>
          <h2 className="h5 fw-bold text-dark mb-2">The page may have moved</h2>
          <p className="small text-secondary mb-4">Return to the shop or contact our customer support team.</p>
          <Link to="/" className="btn btn-brand rounded-pill px-4">
            Go home
          </Link>
        </div>
      </section>
    </>
  );
}
