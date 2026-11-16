import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="Wholesome Living"
        title="Our Story"
        description="From farm fields to your kitchen table — 100% stone-ground unpolished millet goodness crafted in Hyderabad."
      />

      <section className="container section-space">
        <div className="row g-4 align-items-center mb-5">
          <div className="col-lg-6">
            <h2 className="h3 fw-bold text-forest mb-3">Why We Started BR Millet Choice</h2>
            <p className="text-secondary" style={{ lineHeight: 1.75 }}>
              In a world filled with overly processed refined flours and chemical preservatives, our mission at <strong>BR Millet Choice</strong> is simple: bring pure, honest, ancient nutrition back to Indian households.
            </p>
            <p className="text-secondary" style={{ lineHeight: 1.75 }}>
              We source only natural, native unpolished millets from trusted regional farmers. By stone-grinding slowly in small batches right here in Hyderabad, we preserve the vital dietary fiber, bran, and essential minerals that high-speed factory mills destroy.
            </p>
            <div className="d-flex flex-wrap gap-2 mt-4">
              <span className="badge bg-success-subtle text-success border border-success-subtle p-2 px-3 rounded-pill fw-semibold">
                🌾 100% Native Unpolished
              </span>
              <span className="badge bg-success-subtle text-success border border-success-subtle p-2 px-3 rounded-pill fw-semibold">
                ⚙️ Cold Stone-Ground
              </span>
              <span className="badge bg-success-subtle text-success border border-success-subtle p-2 px-3 rounded-pill fw-semibold">
                🚫 Zero Preservatives
              </span>
            </div>
          </div>

          <div className="col-lg-6 text-center">
            <div className="p-4 bg-white rounded-4 border shadow-xs">
              <img
                src="/images/br-millet-choice-logo.png"
                alt="BR Millet Choice Hyderabad"
                className="img-fluid rounded-circle shadow-sm mb-3"
                style={{ maxWidth: '240px' }}
              />
              <h3 className="h5 fw-bold text-dark mb-1">BR Millet Choice</h3>
              <p className="small text-secondary mb-0">Hygienically milled &amp; packed in Hyderabad, India</p>
            </div>
          </div>
        </div>

        {/* 3 Pillars */}
        <div className="row g-3">
          <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 border h-100 shadow-xs">
              <span className="fs-1 d-block mb-2">🌾</span>
              <h3 className="h6 fw-bold text-dark">Native Grains Only</h3>
              <p className="small text-secondary mb-0">
                Foxtail, Little, Kodo, Barnyard, Brown Top, Ragi, Bajra, and Jowar — untouched by chemical polishing.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 border h-100 shadow-xs">
              <span className="fs-1 d-block mb-2">⚙️</span>
              <h3 className="h6 fw-bold text-dark">Traditional Stone Grinding</h3>
              <p className="small text-secondary mb-0">
                Low heat retention keeps delicate natural oils, vitamins, and earthy flavors fresh and wholesome.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 border h-100 shadow-xs">
              <span className="fs-1 d-block mb-2">🚚</span>
              <h3 className="h6 fw-bold text-dark">Direct Doorstep Delivery</h3>
              <p className="small text-secondary mb-0">
                Freshly sealed in airtight packs and delivered right to your home with 100% Cash on Delivery across India.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link to="/shop" className="btn btn-brand btn-lg rounded-pill px-5 fw-bold">
            Shop Fresh Millet Packs →
          </Link>
        </div>
      </section>
    </>
  );
}
