import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function Millets() {
  const millets = [
    { name: 'Foxtail Millet', telugu: 'Korra', hindi: 'Kangni', benefit: 'Diabetic Friendly & Low GI', icon: '🌾' },
    { name: 'Jowar', telugu: 'Jonnalu', hindi: 'Sorghum', benefit: 'Gluten-Free Energy Staple', icon: '🌿' },
    { name: 'Barnyard Millet', telugu: 'Udalu', hindi: 'Sanwa', benefit: 'Highest Dietary Fiber & Gut Health', icon: '🍲' },
    { name: 'Kodo Millet', telugu: 'Arikelu', hindi: 'Kodra', benefit: 'Antioxidant & Heart Vitality', icon: '✨' },
    { name: 'Brown Top Millet', telugu: 'Andu Korralu', hindi: 'Murhari', benefit: 'Rare Ancient Grain for Detox', icon: '🌾' },
    { name: 'Little Millet', telugu: 'Samalu', hindi: 'Sama / Kutki', benefit: 'Weight Balance & Metabolism', icon: '🍃' },
    { name: 'Bajra', telugu: 'Sajjalu', hindi: 'Pearl Millet', benefit: 'Iron & Muscle Strength Booster', icon: '⚡' },
    { name: 'Ragi', telugu: 'Ragulu', hindi: 'Finger Millet', benefit: 'High Calcium & Bone Strength', icon: '🥣' },
  ];

  const nuts = [
    { name: 'Almonds', regional: 'Badam', benefit: 'Rich in Vitamin E & Healthy Fats', icon: '🥜' },
    { name: 'Cashews', regional: 'Kaju', benefit: 'Heart-Healthy Minerals & Richness', icon: '🥜' },
    { name: 'Walnuts', regional: 'Akhrot', benefit: 'Omega-3 Fatty Acids & Brain Health', icon: '🧠' },
    { name: 'Pistachios', regional: 'Pista', benefit: 'Natural Antioxidants & Vitality', icon: '🥜' },
  ];

  const seedsAndPulses = [
    { name: 'Pumpkin Seeds', benefit: 'Rich Zinc & Natural Immunity', icon: '🌱' },
    { name: 'Cucumber Seeds', benefit: 'Cooling Minerals & Hydration', icon: '🌱' },
    { name: 'Watermelon Seeds', benefit: 'Magnesium & Heart Wellness', icon: '🌱' },
    { name: 'Sunflower Seeds', benefit: 'Vitamin B-Complex & Cell Energy', icon: '🌻' },
    { name: 'Flax Seeds', benefit: 'High Plant Omega-3 & Digestion', icon: '🌾' },
    { name: 'Sesame Seeds', benefit: 'Natural Calcium & Healthy Glow', icon: '✨' },
    { name: 'Black Gram', benefit: 'Traditional Strength & Plant Protein', icon: '🌱' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Our Blend Ingredients"
        title="Special Millet, Nuts & Seeds Blend"
        description="Pure Millets • Healthy Living. Carefully prepared with selected quality ingredients."
      />

      <section className="container section-space millets-blend-page">
        {/* Category 1: 8 Millets */}
        <div className="blend-section mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-3">🌾</span>
            <div>
              <h2 className="h3 fw-bold text-dark mb-0">8 Superfood Millets</h2>
              <p className="small text-secondary mb-0">Stone-ground unpolished grains giving natural fiber, iron, and daily energy.</p>
            </div>
          </div>
          <div className="row g-3">
            {millets.map((m) => (
              <div key={m.name} className="col-12 col-sm-6 col-lg-3">
                <div className="blend-card p-3 h-100 rounded-3 bg-white border shadow-sm">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="blend-card-icon fs-4">{m.icon}</span>
                    <div>
                      <h3 className="h6 fw-bold mb-0 text-dark">{m.name}</h3>
                      <span className="small text-secondary">
                        <strong>{m.telugu}</strong> • {m.hindi}
                      </span>
                    </div>
                  </div>
                  <div className="badge bg-success-subtle text-success small fw-semibold mt-1">{m.benefit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category 2: 4 Nuts */}
        <div className="blend-section mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-3">🥜</span>
            <div>
              <h2 className="h3 fw-bold text-dark mb-0">4 Selected Quality Nuts</h2>
              <p className="small text-secondary mb-0">Premium nuts packed with heart-healthy oils, natural protein, and wholesome energy.</p>
            </div>
          </div>
          <div className="row g-3">
            {nuts.map((n) => (
              <div key={n.name} className="col-12 col-sm-6 col-lg-3">
                <div className="blend-card p-3 h-100 rounded-3 bg-white border shadow-sm">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="blend-card-icon fs-4">{n.icon}</span>
                    <div>
                      <h3 className="h6 fw-bold mb-0 text-dark">{n.name}</h3>
                      <span className="small text-secondary">({n.regional})</span>
                    </div>
                  </div>
                  <div className="badge bg-warning-subtle text-dark small fw-semibold mt-1">{n.benefit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category 3: 7 Seeds & Pulses */}
        <div className="blend-section mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-3">🌱</span>
            <div>
              <h2 className="h3 fw-bold text-dark mb-0">7 Nutrient-Dense Seeds &amp; Pulses</h2>
              <p className="small text-secondary mb-0">Rich in natural Omega-3, immunity-boosting zinc, plant protein, and dietary minerals.</p>
            </div>
          </div>
          <div className="row g-3">
            {seedsAndPulses.map((s) => (
              <div key={s.name} className="col-12 col-sm-6 col-lg-3">
                <div className="blend-card p-3 h-100 rounded-3 bg-white border shadow-sm">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="blend-card-icon fs-4">{s.icon}</span>
                    <div>
                      <h3 className="h6 fw-bold mb-0 text-dark">{s.name}</h3>
                    </div>
                  </div>
                  <div className="badge bg-info-subtle text-dark small fw-semibold mt-1">{s.benefit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-4 pt-2">
          <Link to="/shop" className="btn btn-hero-primary">
            <span>View Available Packs in Shop</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
