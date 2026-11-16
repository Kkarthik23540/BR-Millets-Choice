import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function Millets() {
  const millets = [
    { name: 'Foxtail Millet', telugu: 'Korra', hindi: 'Kangni', benefit: 'Diabetic Friendly, High Fiber, Low GI', icon: '🌾' },
    { name: 'Jowar', telugu: 'Jonnalu', hindi: 'Sorghum', benefit: 'Gluten-Free Energy & Bone Strength', icon: '🌿' },
    { name: 'Barnyard Millet', telugu: 'Udalu', hindi: 'Sanwa', benefit: 'Highest Dietary Fiber & Gut Health', icon: '🍲' },
    { name: 'Kodo Millet', telugu: 'Arikelu', hindi: 'Kodra', benefit: 'Antioxidant & Heart Vitality', icon: '✨' },
    { name: 'Brown Top Millet', telugu: 'Andu Korralu', hindi: 'Murhari', benefit: 'Rare Ancient Grain for Detox', icon: '🌾' },
    { name: 'Little Millet', telugu: 'Samalu', hindi: 'Sama / Kutki', benefit: 'Weight Balance & Fast Metabolism', icon: '🍃' },
    { name: 'Bajra', telugu: 'Sajjalu', hindi: 'Pearl Millet', benefit: 'Iron & Muscle Strength Booster', icon: '⚡' },
    { name: 'Ragi', telugu: 'Ragulu', hindi: 'Finger Millet', benefit: 'High Calcium & Natural Bone Density', icon: '🥣' },
  ];

  const nuts = [
    { name: 'Almonds', regional: 'Badam', benefit: 'Rich in Vitamin E & Healthy Fats', icon: '🌰' },
    { name: 'Cashews', regional: 'Kaju', benefit: 'Heart-Healthy Minerals & Richness', icon: '🥜' },
    { name: 'Walnuts', regional: 'Akhrot', benefit: 'Omega-3 Fatty Acids & Brain Health', icon: '🧠' },
    { name: 'Pistachios', regional: 'Pista', benefit: 'Antioxidants & Eye Health', icon: '🟢' },
  ];

  const seeds = [
    { name: 'Pumpkin Seeds', regional: 'Gummadi Ginjalu', benefit: 'Natural Zinc & Glow', icon: '🎃' },
    { name: 'Watermelon Seeds', regional: 'Puchakaya Ginjalu', benefit: 'Heart Vitality & Magnesium', icon: '🍉' },
    { name: 'Sunflower Seeds', regional: 'Poduthirugudu', benefit: 'Vitamin E & Cell Energy', icon: '🌻' },
    { name: 'Flax Seeds', regional: 'Avise Ginjalu', benefit: 'Plant Omega-3 & Digestion', icon: '🌾' },
    { name: 'Sesame Seeds', regional: 'Nuvvulu / Til', benefit: 'Calcium Booster & Warmth', icon: '⚪' },
    { name: 'Cucumber Seeds', regional: 'Dosakaya Ginjalu', benefit: 'Hydration & Cooling Effect', icon: '🥒' },
    { name: 'Black Gram (Urad)', regional: 'Minumulu', benefit: 'Plant Protein & Texture', icon: '⚫' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Ancient Nutrition"
        title="Our 19 Sacred Ingredients"
        description="Every pack of BR Millet Choice is blended from 8 superfood millets, 4 premium nuts, and 7 healthy seeds and pulses."
      />

      <section className="container section-space">
        {/* 8 Millets */}
        <div className="mb-5">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-3">🌾</span>
            <div>
              <h2 className="h4 fw-bold mb-0 text-dark">The 8 Sacred Millets</h2>
              <small className="text-secondary">Unpolished, stone-ground, native ancient grains</small>
            </div>
          </div>
          <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4">
            {millets.map((m, i) => (
              <div className="col" key={i}>
                <div className="p-3 bg-white rounded-4 border h-100 shadow-xs">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="fs-4">{m.icon}</span>
                    <div>
                      <strong className="d-block text-forest">{m.name}</strong>
                      <small className="text-muted">Telugu: {m.telugu} | Hindi: {m.hindi}</small>
                    </div>
                  </div>
                  <p className="small text-secondary mb-0">{m.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Nuts */}
        <div className="mb-5">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-3">🥜</span>
            <div>
              <h2 className="h4 fw-bold mb-0 text-dark">4 Premium Crunchy Nuts</h2>
              <small className="text-secondary">Wholesome plant proteins and good fats</small>
            </div>
          </div>
          <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4">
            {nuts.map((n, i) => (
              <div className="col" key={i}>
                <div className="p-3 bg-white rounded-4 border h-100 shadow-xs">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="fs-4">{n.icon}</span>
                    <div>
                      <strong className="d-block text-dark">{n.name}</strong>
                      <small className="text-muted">{n.regional}</small>
                    </div>
                  </div>
                  <p className="small text-secondary mb-0">{n.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7 Seeds & Pulses */}
        <div className="mb-5">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-3">🌱</span>
            <div>
              <h2 className="h4 fw-bold mb-0 text-dark">7 Seeds &amp; Pulses</h2>
              <small className="text-secondary">Essential micronutrients, zinc, and daily vitality</small>
            </div>
          </div>
          <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-3">
            {seeds.map((s, i) => (
              <div className="col" key={i}>
                <div className="p-3 bg-white rounded-4 border h-100 shadow-xs">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="fs-4">{s.icon}</span>
                    <div>
                      <strong className="d-block text-dark">{s.name}</strong>
                      <small className="text-muted">{s.regional}</small>
                    </div>
                  </div>
                  <p className="small text-secondary mb-0">{s.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-3">
          <Link to="/shop" className="btn btn-brand btn-lg rounded-pill px-5 fw-bold">
            Order Your Fresh Blend Now →
          </Link>
        </div>
      </section>
    </>
  );
}
