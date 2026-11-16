import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isOnAdmin = Boolean(isAdmin || user?.role === 'admin' || location.pathname.startsWith('/admin'));
  const isHomePage = location.pathname === '/';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('brmc-sidebar-collapsed') === 'true';
  });
  const [scrollBtnDirection, setScrollBtnDirection] = useState(null);

  useEffect(() => {
    localStorage.setItem('brmc-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Toggle admin-mode on body for CSS styling parity
  useEffect(() => {
    document.body.classList.toggle('admin-mode', Boolean(isOnAdmin));
  }, [isOnAdmin]);

  // Synchronize sidebar top offset with sticky header & announcement bar (matches public/app.js:4425)
  useEffect(() => {
    const syncSidebarOffset = () => {
      const siteSidebar = document.querySelector('.site-sidebar');
      const siteHeader = document.querySelector('.site-header');
      if (!siteSidebar || !siteHeader) return;
      if (window.matchMedia('(min-width: 992px)').matches) {
        siteSidebar.style.setProperty('--site-sidebar-top', `${Math.max(0, siteHeader.getBoundingClientRect().bottom)}px`);
      } else {
        siteSidebar.style.removeProperty('--site-sidebar-top');
      }
    };
    syncSidebarOffset();
    window.addEventListener('scroll', syncSidebarOffset, { passive: true });
    window.addEventListener('resize', syncSidebarOffset, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncSidebarOffset);
      window.removeEventListener('resize', syncSidebarOffset);
    };
  }, [isOnAdmin]);

  // Lock mobile body scroll when drawer open
  useEffect(() => {
    document.body.classList.toggle('site-nav-open', Boolean(isSidebarOpen));
  }, [isSidebarOpen]);

  // Scroll animations observer for sections
  useEffect(() => {
    const triggerReveal = (el) => el.classList.add('is-revealed');
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.scroll-section-overlay, .scroll-reveal-item').forEach(triggerReveal);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.05 }
    );
    const observeAll = () => {
      document
        .querySelectorAll('.scroll-section-overlay:not([data-observed]), .scroll-reveal-item:not([data-observed])')
        .forEach((el) => {
          el.dataset.observed = 'true';
          observer.observe(el);
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('is-revealed');
          }
        });
    };
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 80) {
        setScrollBtnDirection(null);
        return;
      }
      const scrollUp = window.scrollY > Math.min(160, maxScroll / 2);
      setScrollBtnDirection(scrollUp ? 'up' : 'down');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollBtnClick = () => {
    if (scrollBtnDirection === 'up') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div id="top-nav-loader" aria-hidden="true" />

      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <button
        className="site-nav-backdrop"
        type="button"
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Close navigation"
        hidden={!isSidebarOpen}
      />

      <div className={`site-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        <div className="site-content">
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          {isHomePage && !isOnAdmin && <Footer />}
        </div>
      </div>

      {scrollBtnDirection && (
        <button
          className="page-scroll-control"
          type="button"
          onClick={handleScrollBtnClick}
          aria-label={scrollBtnDirection === 'up' ? 'Scroll to top' : 'Scroll to bottom'}
          title={scrollBtnDirection === 'up' ? 'Scroll to top' : 'Scroll to bottom'}
        >
          {scrollBtnDirection === 'up' ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V4m-7 7 7-7 7 7" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m-7-5 7 7 7-7" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}
