import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

export default function About() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api('/api/reviews')
      .then((res) => setReviews(res.reviews || []))
      .catch(() => {});
  }, []);

  const stories = reviews.map((r) => ({
    title: r.title || `Review on ${r.productName || 'BR Millets'}`,
    author: r.customerName || 'Verified Customer',
    location: `${r.productName || 'Pure Millets'} • Verified Purchase`,
    rating: r.rating || 5,
    story: r.comment,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Wholesome Living"
        title="Our Story & Real Customer Journeys"
        description="From farm fields to your kitchen table — 100% stone-ground unpolished millet goodness crafted in Hyderabad."
      />

      <section className="container section-space">
        <div className="row align-items-center gy-4 mb-5">
          <div className="col-lg-6">
            <p className="eyebrow mb-2">The BR Millet Choice Philosophy</p>
            <h2 className="h3 mb-3">Reviving Ancient Indian Grains For Modern Vitality</h2>
            <p className="lead text-secondary">
              BR Millet Choice was founded in Hyderabad with a singular mission: to eliminate adulterated, machine-polished grains and bring pure, uncompromised, farm-fresh millets back to Indian family dining tables.
            </p>
            <p className="text-secondary">
              We work directly with traditional millet farmers across Telangana and Andhra Pradesh. Every batch is cleaned, sun-dried, and gently stone-ground in small hygienic batches. This traditional grinding method protects the natural taste and healthy nutrients.
            </p>
          </div>

          <div className="col-lg-6">
            <div className="p-4 p-md-5 rounded-4 bg-light border">
              <h3 className="h5 mb-3 text-dark">Our 4 Core Quality Promises</h3>
              <div className="d-flex align-items-start gap-3 mb-3">
                <span className="fs-4" aria-hidden="true">🌾</span>
                <div>
                  <strong>100% Whole &amp; Unpolished</strong>
                  <p className="small text-secondary mb-0">Zero artificial polishing, keeping all dietary fiber, iron, and minerals intact.</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 mb-3">
                <span className="fs-4" aria-hidden="true">⚙️</span>
                <div>
                  <strong>Traditional Cold Stone-Ground</strong>
                  <p className="small text-secondary mb-0">Slow-speed milling prevents friction heat and preserves natural grain nutrition.</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 mb-3">
                <span className="fs-4" aria-hidden="true">🚫</span>
                <div>
                  <strong>Zero Preservatives or Additives</strong>
                  <p className="small text-secondary mb-0">No synthetic anti-caking agents, no bleaching, 100% pure whole grains.</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <span className="fs-4" aria-hidden="true">🚚</span>
                <div>
                  <strong>Fresh Weekly Batches in Hyderabad</strong>
                  <p className="small text-secondary mb-0">Milled fresh every single week and delivered directly to your doorstep.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Moving Customer Reviews Marquee */}
        <div className="stories-section my-5 pt-3">
          <div className="text-center mb-4">
            <p className="eyebrow mb-1">Customer Reviews &amp; Feedback</p>
            <h2 className="h3">Real Families, Real Health Feedback</h2>
            <p className="text-secondary small">Real feedback submitted by customers. Hover over any card to pause and read.</p>
          </div>

          {stories.length > 0 ? (
            <div className="stories-marquee-wrapper" aria-label="Customer transformation stories marquee">
              <div className="stories-track">
                {[...stories, ...stories].map((story, i) => (
                  <article key={i} className="story-card">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-warning fw-bold">{'★'.repeat(story.rating || 5)}</span>
                        <span className="badge bg-success-subtle text-success small">Verified Feedback</span>
                      </div>
                      <h3 className="h6 mb-2 text-dark">{story.title}</h3>
                      <p className="small text-secondary mb-3">&quot;{story.story}&quot;</p>
                    </div>
                    <div className="border-top pt-2 mt-auto d-flex align-items-center gap-2">
                      <div
                        className="account-avatar"
                        style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                        aria-hidden="true"
                      >
                        {story.author.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong className="d-block small text-dark">{story.author}</strong>
                        <span className="small text-secondary">{story.location}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-light rounded text-center text-secondary">
              No customer reviews yet. Be the first to share your experience with BR Millets on any product page!
            </div>
          )}
        </div>

        <div className="text-center mt-5">
          <Link className="btn btn-brand btn-lg px-4" to="/shop">
            Experience Pure Millets Today ➔
          </Link>
        </div>
      </section>
    </>
  );
}
