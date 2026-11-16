import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedPack, setSelectedPack] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([
      api('/api/products').catch(() => ({ products: [] })),
      api('/api/reviews').catch(() => ({ reviews: [] })),
    ]).then(([prodData, revData]) => {
      const prods = prodData.products || [];
      setProducts(prods);
      setReviews((revData.reviews || []).filter((r) => r.isApproved !== false && r.comment));

      // Set default selected variant for each product
      const defaultPacks = {};
      prods.forEach((p) => {
        if (p.variants?.length) {
          defaultPacks[p.id] = p.variants[0].id;
        }
      });
      setSelectedPack(defaultPacks);
    });
  }, []);

  return (
    <>
      {/* Impressive Clean Landing Hero */}
      <section className="landing-hero py-3 py-md-4 position-relative overflow-hidden scroll-section-overlay">
        <div className="container">
          <div className="row align-items-center gy-3 gy-md-4">
            <div className="col-lg-7 text-center text-lg-start">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success-subtle text-success border border-success-subtle small fw-bold mb-2">
                <span>🌾 100% PURE &amp; NATURAL</span>
              </div>
              <h1 className="landing-title mb-1">
                <span className="typing-brand-title">BR MILLETS CHOICE</span>
                <span className="typing-cursor" aria-hidden="true">|</span>
              </h1>
              <p className="landing-subtitle mb-2">
                Special Millet, Nuts &amp; Seeds Blend
              </p>
              <p className="landing-copy mb-3">
                Fresh unpolished millets, crunchy nuts, and healthy seeds stone-ground in Hyderabad. 100% pure, natural, and healthy for your family.
              </p>

              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2 mb-3">
                <span className="landing-badge">🌾 8 Millets</span>
                <span className="landing-badge">🥜 4 Nuts</span>
                <span className="landing-badge">🌱 7 Seeds &amp; Pulses</span>
                <span className="landing-badge">📦 500 g &amp; 1 kg</span>
              </div>

              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start align-items-center gap-2 mb-2">
                <Link to="/shop" className="btn btn-hero-primary">
                  <span>Order Now</span>
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </Link>
                <a href="#whats-inside" className="btn btn-hero-secondary">
                  <span>What's Inside</span>
                  <span aria-hidden="true">🌾</span>
                </a>
              </div>
            </div>

            <div className="col-lg-5 text-center">
              <div className="hero-image-container py-2">
                <div className="hero-animated-glow-wrap mx-auto">
                  <img
                    src="/images/br-millet-choice-logo.png"
                    alt="BR Millets Choice — Special Millet, Nuts &amp; Seeds Blend"
                    width="220"
                    height="220"
                    className="hero-animated-logo img-fluid rounded-circle"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Simple Reasons Strip */}
      <section className="py-3 py-md-4 bg-white border-top border-bottom scroll-section-overlay">
        <div className="container">
          <div className="row gy-3">
            <div className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-3">
                <span className="fs-2 text-forest" aria-hidden="true">🌾</span>
                <div>
                  <strong className="d-block text-dark">100% Unpolished</strong>
                  <small className="text-muted">Natural fiber &amp; bran intact</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-3">
                <span className="fs-2 text-forest" aria-hidden="true">⚙️</span>
                <div>
                  <strong className="d-block text-dark">Stone-Ground</strong>
                  <small className="text-muted">Gently milled, natural taste</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-3">
                <span className="fs-2 text-forest" aria-hidden="true">🩺</span>
                <div>
                  <strong className="d-block text-dark">Good for Health</strong>
                  <small className="text-muted">Easy digestion &amp; light on stomach</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-3">
                <span className="fs-2 text-forest" aria-hidden="true">🚚</span>
                <div>
                  <strong className="d-block text-dark">Cash on Delivery</strong>
                  <small className="text-muted">Pay by cash or UPI at door</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Inside Our Blend (Bento Grid Layout) */}
      <section className="section-space scroll-section-overlay" id="whats-inside" style={{ background: '#fafaf7' }}>
        <div className="container">
          <div className="text-center mb-3 mb-md-4">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2 fw-bold text-uppercase shadow-xs"
              style={{ background: '#113425', color: '#ffffff', fontSize: '0.8rem', letterSpacing: '0.06em' }}
            >
              <span>🌾</span>
              <span style={{ color: '#ffffff' }}>OUR SPECIAL BLEND</span>
            </div>
            <h2 className="h2 fw-bold mb-1 text-dark" style={{ color: '#113425', fontSize: 'clamp(1.4rem, 2.8vw, 2.1rem)' }}>
              What is Inside BR Millets Choice?
            </h2>
            <p className="mx-auto mb-0 fw-medium" style={{ maxWidth: '640px', color: '#2d3748', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Carefully prepared with 19 selected quality ingredients. Cleaned, stone-ground, and packed fresh in Hyderabad.
            </p>
          </div>

          <div className="ingredient-bento-container mb-3 mb-md-4">
            {/* Bento Card 1: 8 Superfood Millets */}
            <div className="ingredient-bento-hero p-3 p-md-4 rounded-4 bg-white border mb-3 mb-md-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="blend-icon-circle bg-success-subtle text-success fs-5">🌾</div>
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h3 className="h5 fw-bold mb-0 text-dark">8 Superfood Millets</h3>
                      <span className="badge rounded-pill fw-bold" style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.72rem' }}>8 Ancient Grains</span>
                    </div>
                    <small className="text-secondary" style={{ fontSize: '0.8rem' }}>100% Native Unpolished Ancient Grains • Stone-Ground Daily</small>
                  </div>
                </div>
                <div className="d-none d-sm-flex align-items-center gap-1 text-success fw-bold small">
                  <span>✓</span> <span>High Fiber &amp; Slow-Release Energy</span>
                </div>
              </div>

              <div className="row g-2 row-cols-2 row-cols-sm-4">
                {[
                  ['Foxtail', 'Low GI & Fiber'],
                  ['Jowar', 'Gluten-Free Staple'],
                  ['Barnyard', 'Gut Health'],
                  ['Kodo', 'Antioxidants'],
                  ['Brown Top', 'Detox Grain'],
                  ['Little', 'Iron & Minerals'],
                  ['Ragi', 'High Calcium'],
                  ['Bajra', 'Strength & Vitality'],
                ].map(([name, tag]) => (
                  <div className="col" key={name}>
                    <div className="ingredient-pill-card">
                      <span className="pill-icon">🌾</span>
                      <div className="pill-content">
                        <strong className="pill-title">{name}</strong>
                        <span className="pill-tag">{tag}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bento Split: Nuts and Seeds */}
            <div className="row g-3">
              <div className="col-lg-6">
                <div className="ingredient-bento-card p-3 p-md-4 rounded-4 bg-white border h-100">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <div className="blend-icon-circle bg-warning-subtle text-warning fs-5">🥜</div>
                    <div>
                      <h3 className="h6 fw-bold mb-0 text-dark">4 Crunchy Nuts</h3>
                      <small className="text-secondary" style={{ fontSize: '0.8rem' }}>Rich in Healthy Fats &amp; Plant Protein</small>
                    </div>
                  </div>
                  <div className="row g-2 row-cols-2">
                    {[
                      ['Almonds', 'Vitamin E & Brain'],
                      ['Cashews', 'Creamy Energy'],
                      ['Walnuts', 'Omega-3 Rich'],
                      ['Groundnuts', 'Pure Protein'],
                    ].map(([name, tag]) => (
                      <div className="col" key={name}>
                        <div className="ingredient-pill-card">
                          <span className="pill-icon">🥜</span>
                          <div className="pill-content">
                            <strong className="pill-title">{name}</strong>
                            <span className="pill-tag">{tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="ingredient-bento-card p-3 p-md-4 rounded-4 bg-white border h-100">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <div className="blend-icon-circle bg-info-subtle text-info fs-5">🌱</div>
                    <div>
                      <h3 className="h6 fw-bold mb-0 text-dark">7 Seeds &amp; Pulses</h3>
                      <small className="text-secondary" style={{ fontSize: '0.8rem' }}>Digestive Herbs &amp; Superfood Seeds</small>
                    </div>
                  </div>
                  <div className="row g-2 row-cols-2">
                    {[
                      ['Chia Seeds', 'Super Hydration'],
                      ['Flax Seeds', 'Heart Health'],
                      ['Pumpkin Seeds', 'Zinc & Vitality'],
                      ['Watermelon Seeds', 'Natural Minerals'],
                      ['Sesame', 'Bone Strength'],
                      ['Horsegram', 'Traditional Warmth'],
                      ['Cardamom', 'Aromatic Digestion'],
                    ].map(([name, tag]) => (
                      <div className="col" key={name}>
                        <div className="ingredient-pill-card">
                          <span className="pill-icon">🌱</span>
                          <div className="pill-content">
                            <strong className="pill-title">{name}</strong>
                            <span className="pill-tag">{tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Packs & Products */}
      <section className="section-space bg-white border-top scroll-section-overlay">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3 mb-md-4">
            <div>
              <p className="eyebrow mb-1">FRESH BATCHES</p>
              <h2 className="section-heading mb-0">Choose Your Pack</h2>
            </div>
            <Link to="/shop" className="btn btn-sm btn-outline-brand">
              View shop →
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="row g-2 g-md-3">
              {products.map((product) => (
                <div key={product.id} className="col-12 col-sm-6 col-lg-4">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-products-slider my-4">
              <div className="sliding-empty-card">
                <div className="sliding-empty-icon">🌾</div>
                <div className="sliding-empty-content">
                  <h3 className="h5 mb-1 text-forest fw-bold">Fresh Harvest Batches Arriving Soon!</h3>
                  <p className="mb-2 text-secondary">
                    Our stone mills in Hyderabad are freshly preparing new unpolished millet powder batches. Check back soon or contact us directly.
                  </p>
                  <div className="d-flex gap-2 flex-wrap mt-3">
                    <Link to="/contact" className="btn btn-sm btn-brand">Ask about restock</Link>
                    <a href="https://whatsapp.com/channel/0029Vb909Ye7oQhkdutTQM24" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-brand">
                      Follow WhatsApp Updates
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-5 bg-white border-top">
          <div className="container">
            <div className="text-center mb-4">
              <p className="eyebrow mb-1">Customer Feedback</p>
              <h2 className="display-title mb-1">What Families Say About BR Millets</h2>
            </div>
            <div className="row g-3">
              {reviews.slice(0, 3).map((r) => (
                <div className="col-md-4" key={r.id}>
                  <div className="feature-card p-4 h-100">
                    <div className="d-flex align-items-center gap-1 text-warning mb-2">
                      {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                    </div>
                    <h3 className="h6 fw-bold mb-2">{r.title}</h3>
                    <p className="small text-secondary mb-3">"{r.comment}"</p>
                    <div className="mt-auto pt-2 border-top small text-muted">
                      <strong>{r.customerName}</strong> · {r.productName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
