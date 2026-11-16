import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="Not found" title="We couldn’t find that page" />
      <section className="container section-space">
        <div className="empty-state">
          <h2>The page may have moved</h2>
          <p className="text-secondary">Return to the shop or contact the business.</p>
          <Link className="btn btn-brand" to="/">
            Go home
          </Link>
        </div>
      </section>
    </>
  );
}
