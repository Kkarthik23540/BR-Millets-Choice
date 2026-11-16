import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('brmc-sidebar-collapsed') === 'true';
  });
  const [scrollBtnDirection, setScrollBtnDirection] = useState(null);

  useEffect(() => {
    localStorage.setItem('brmc-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

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
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
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
          <Footer />
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
