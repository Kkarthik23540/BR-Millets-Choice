import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header({ onToggleSidebar, isSidebarOpen }) {
  const { isAdmin } = useAuth();
  const { cartCount } = useCart();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="site-header">
      {!isAdmin && (
        <div className="announcement-bar" role="region" aria-label="Announcements">
          <div className="announcement-track">
            <span>🌾 <strong>BR Millets</strong> — Fresh &amp; Healthy</span>
            <span className="announcement-bullet">•</span>
            <span>100% Pure Stone-Ground Millets</span>
            <span className="announcement-bullet">•</span>
            <span>🚚 Cash on Delivery Across India</span>
            <span className="announcement-bullet">•</span>
            <span>📦 Available in 500 g &amp; 1 kg Airtight Packs</span>
            <span className="announcement-bullet">•</span>
            <span>🌾 <strong>BR Millets</strong> — Fresh &amp; Healthy</span>
            <span className="announcement-bullet">•</span>
            <span>100% Pure Stone-Ground Millets</span>
            <span className="announcement-bullet">•</span>
            <span>🚚 Cash on Delivery Across India</span>
            <span className="announcement-bullet">•</span>
            <span>📦 Available in 500 g &amp; 1 kg Airtight Packs</span>
          </div>
        </div>
      )}

      <div
        id="page-scroll-indicator"
        className="page-scroll-indicator"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <div className="site-header-inner">
        <button
          className="site-nav-toggle"
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isSidebarOpen}
          aria-controls="site-sidebar"
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link className="brand-wordmark" to="/" aria-label="BR Millet Choice home">
          <img
            className="brand-logo"
            src="/images/br-millet-choice-logo.png"
            alt="BR Millets Choice — Pure Millets, Healthy Living"
            width="64"
            height="64"
          />
          <span className="brand-copy">
            <span className="brand-welcome">Welcome to</span>
            <span className="brand-name">BR Millet Choice</span>
            <span className="brand-tagline">Pure Millets • Healthy Living</span>
          </span>
        </Link>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {!isAdmin && (
            <Link className="mobile-header-cart" to="/cart" aria-label="Shopping Cart">
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h2l2.2 11h11.5l2-8H6" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="18" cy="19" r="1" />
              </svg>
              <span className="cart-count">{cartCount}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
