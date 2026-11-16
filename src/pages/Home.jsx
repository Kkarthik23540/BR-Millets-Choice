import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../services/api';
import ProductCard from '../components/ProductCard';
import BrandLoader from '../components/BrandLoader';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typedTitle, setTypedTitle] = useState('');

  useEffect(() => {
    const fullText = 'BR MILLETS CHOICE';
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedTitle(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 60);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      api('/api/products').catch(() => ({ products: [] })),
      api('/api/reviews').catch(() => ({ reviews: [] })),
    ])
      .then(([prodData, revData]) => {
        const prods = prodData.products || [];
        setProducts(prods);
        setReviews((revData.reviews || []).filter((r) => r.isApproved !== false && r.comment));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <BrandLoader message="Loading fresh millet harvest…" />;
  }

  return (
    <>
      {/* Impressive Clean Landing Hero */}
      <section className="landing-hero py-3 py-md-4 position-relative overflow-hidden scroll-section-overlay is-revealed">
        <div className="container">
          <div className="row align-items-center gy-3 gy-md-4">
            <div className="col-lg-7 text-center text-lg-start">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success-subtle text-success border border-success-subtle small fw-bold mb-2">
                <span>🌾 100% PURE &amp; NATURAL</span>
              </div>
              <h1 className="landing-title mb-1">
                <span className="typing-brand-title">{typedTitle || 'BR MILLETS CHOICE'}</span>
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
      <section className="py-3 py-md-4 bg-white border-top border-bottom scroll-section-overlay is-revealed">
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
      <section className="section-space scroll-section-overlay is-revealed" id="whats-inside" style={{ background: '#fafaf7' }}>
        <div className="container">
          <div className="text-center mb-3 mb-md-4">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2 fw-bold text-uppercase shadow-xs"
              style={{ backgroundColor: '#113425', color: '#ffffff', fontSize: '0.8rem', letterSpacing: '0.06em' }}
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
                  ['Little Millet', 'Metabolism'],
                  ['Bajra', 'Iron & Energy'],
                  ['Ragi', 'Rich Calcium'],
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
              <div className="col-md-5">
                <div className="ingredient-bento-subcard p-3 p-md-4 rounded-4 bg-white border h-100 d-flex flex-column nut-card-border">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="blend-icon-circle" style={{ background: '#fef3c7', color: '#92400e' }}>🥜</div>
                      <div>
                        <h3 className="h6 fw-bold mb-0 text-dark">4 Premium Nuts</h3>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>Wholesome Crunch &amp; Good Fats</small>
                      </div>
                    </div>
                    <span className="badge rounded-pill fw-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.72rem' }}>Heart Healthy</span>
                  </div>
                  <p className="small text-secondary mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                    Selected whole crunchy nuts rich in natural plant proteins, vitamin E, and good fats.
                  </p>
                  <div className="row g-2 mb-3">
                    {[
                      ['Almonds (Badam)', 'Vitamin E', '🌰'],
                      ['Cashews (Kaju)', 'Healthy Fats', '🥜'],
                      ['Walnuts (Akhrot)', 'Plant Omega-3', '🧠'],
                      ['Pistachios (Pista)', 'Antioxidants', '🟢'],
                    ].map(([name, tag, icon]) => (
                      <div className="col-6" key={name}>
                        <div className="ingredient-pill-card nut-pill">
                          <span className="pill-icon">{icon}</span>
                          <div className="pill-content">
                            <strong className="pill-title">{name}</strong>
                            <span className="pill-tag text-muted">{tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-2 border-top small fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: '#92400e' }}>
                    <span>✓</span> <span>Rich in Natural Proteins &amp; Healthy Fats</span>
                  </div>
                </div>
              </div>

              <div className="col-md-7">
                <div className="ingredient-bento-subcard p-3 p-md-4 rounded-4 bg-white border h-100 d-flex flex-column seed-card-border">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="blend-icon-circle bg-success-subtle text-success">🌱</div>
                      <div>
                        <h3 className="h6 fw-bold mb-0 text-dark">7 Seeds &amp; Pulses</h3>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>Nutrient-Dense Everyday Vitality</small>
                      </div>
                    </div>
                    <span className="badge rounded-pill fw-bold" style={{ backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd', fontSize: '0.72rem' }}>Vital Minerals</span>
                  </div>
                  <p className="small text-secondary mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                    Nutrient-dense seeds for easy daily digestion, glow, natural zinc, and mineral balance.
                  </p>
                  <div className="row g-2 mb-3">
                    {[
                      ['Pumpkin', 'Zinc & Glow', '🎃'],
                      ['Watermelon', 'Heart Health', '🍉'],
                      ['Sunflower', 'Cell Energy', '🌻'],
                      ['Flax Seeds', 'Plant Omega-3', '🌾'],
                      ['Sesame (Til)', 'Pure Calcium', '⚪'],
                      ['Cucumber', 'Hydration', '🥒'],
                    ].map(([name, tag, icon]) => (
                      <div className="col-6 col-sm-4" key={name}>
                        <div className="ingredient-pill-card seed-pill">
                          <span className="pill-icon">{icon}</span>
                          <div className="pill-content">
                            <strong className="pill-title">{name}</strong>
                            <span className="pill-tag text-muted">{tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="col-12">
                      <div className="ingredient-pill-card seed-pill seed-pill-wide">
                        <span className="pill-icon">⚫</span>
                        <div className="pill-content d-flex align-items-center justify-content-between w-100 flex-wrap gap-1">
                          <strong className="pill-title">Black Gram (Urad)</strong>
                          <span className="pill-tag text-muted">Plant Protein &amp; Easy Digestion</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-2 border-top small text-success fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
                    <span>✓</span> <span>High in Natural Minerals, Zinc &amp; Fiber</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-3 pt-1">
            <Link to="/millets" className="btn btn-sm btn-outline-brand rounded-pill px-3 py-1 fw-semibold" style={{ fontSize: '0.85rem' }}>
              Explore All 19 Ingredients &amp; Regional Names →
            </Link>
          </div>
        </div>
      </section>

      {/* Available Packs & Products */}
      <section className="section-space bg-white border-top scroll-section-overlay is-revealed">
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

      {/* Sliding Verified Customer Reviews */}
      {reviews.length > 0 ? (
        <section className="section-space bg-light border-top scroll-section-overlay is-revealed">
          <div className="container">
            <div className="text-center mb-3 mb-md-4">
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-1 mb-2 small fw-bold text-uppercase">
                ⭐ Verified Customer Reviews
              </span>
              <h2 className="h3 fw-bold text-forest mb-1">What Our Customers Say</h2>
              <p className="small text-secondary mb-0">Real experiences from customers enjoying fresh stone-ground millets.</p>
            </div>
          </div>
          <div className="reviews-slider-outer py-2">
            <div className="reviews-slider-track">
              {[...reviews, ...reviews].map((r, i) => (
                <div key={`${r.id}-${i}`} className="review-slide-card bg-white border rounded-4 p-3 shadow-xs">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="text-warning small">{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style={{ fontSize: '0.68rem' }}>
                      ✓ Verified Purchase
                    </span>
                  </div>
                  {r.title && <h3 className="h6 fw-bold mb-1 text-dark text-truncate">{r.title}</h3>}
                  <p className="small text-secondary mb-2 review-comment-text">{r.comment.replace(/^•\s*/, '')}</p>
                  <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                    <span className="small fw-semibold text-forest">👤 {r.customerName || 'Verified Customer'}</span>
                    <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-4 bg-light border-top text-center scroll-section-overlay is-revealed">
          <div className="container">
            <div className="d-inline-flex flex-wrap align-items-center justify-content-center gap-3 text-secondary small">
              <span className="text-forest fw-bold">⭐ 100% Quality &amp; Purity Promise</span>
              <span>•</span>
              <span>Hygienically Packed in Hyderabad</span>
              <span>•</span>
              <span>100% Cash on Delivery</span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
