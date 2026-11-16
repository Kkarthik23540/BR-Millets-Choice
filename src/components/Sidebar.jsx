import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { user, isAdmin, config, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    onClose();
    setAccountMenuOpen(false);
  }, [location.pathname, onClose]);

  // Dismiss account menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const productCount = config?.productCount ?? null;

  const initials = user?.fullName
    ? user.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '';

  return (
    <>
      <button
        className="site-nav-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        hidden={!isOpen}
      />

      <aside className={`site-sidebar ${isOpen ? 'is-open' : ''}`} id="site-sidebar">
        {/* Mobile Header inside drawer */}
        <div className="mobile-navigation-heading">
          <strong>Menu</strong>
          <button
            className="mobile-navigation-close"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="site-sidebar-top">
          <button
            className="sidebar-collapse-toggle"
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m14 5-7 7 7 7" />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="site-nav" aria-label="Main navigation">
          {isAdmin ? (
            /* ADMIN NAVIGATION */
            <>
              <NavLink to="/admin" end aria-label="Dashboard" title="Dashboard">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/admin/manage-products" aria-label="Add products" title="Add products">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Add products</span>
              </NavLink>

              <NavLink to="/admin/products" aria-label="Products" title="Products">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Products</span>
                {productCount != null && <span className="nav-count">{productCount}</span>}
              </NavLink>

              <NavLink to="/admin/orders" aria-label="Orders" title="Orders">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
                <span>Orders</span>
              </NavLink>

              <NavLink to="/admin/reviews" aria-label="Customer reviews" title="Customer reviews">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Reviews</span>
              </NavLink>

              <NavLink to="/admin/enquiries" aria-label="Enquiries" title="Enquiries">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Enquiries</span>
              </NavLink>

              <NavLink to="/admin/customers" aria-label="Customers" title="Customers">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Customers</span>
              </NavLink>

              <hr className="nav-divider" aria-hidden="true" />

              <NavLink to="/profile" aria-label="My profile" title="My profile">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                </svg>
                <span>My profile</span>
              </NavLink>
            </>
          ) : (
            /* CUSTOMER NAVIGATION */
            <>
              <NavLink to="/" end aria-label="Home" title="Home">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Home</span>
              </NavLink>

              <NavLink to="/shop" aria-label="Products" title="Products">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Products</span>
                {productCount != null && <span className="nav-count">{productCount}</span>}
              </NavLink>

              <NavLink to="/about" aria-label="Our story" title="Our story">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span>Our story</span>
              </NavLink>

              <NavLink to="/millets" aria-label="Millets" title="Millets">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 22 12 12" />
                  <path d="M9 3a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z" />
                  <path d="M15 9a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3 3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3Z" />
                  <path d="M18 15a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3 3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3Z" />
                </svg>
                <span>Millets</span>
              </NavLink>

              <NavLink to="/orders" aria-label="My Orders" title="My Orders">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
                <span>My Orders</span>
              </NavLink>

              <NavLink to="/contact" aria-label="Contact" title="Contact">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Contact</span>
              </NavLink>

              <NavLink to="/cart" className="site-nav-cart" aria-label="Cart" title="Cart">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span>Cart</span>
                <span className="cart-count">{cartCount}</span>
              </NavLink>

              {user && (
                <>
                  <hr className="nav-divider" aria-hidden="true" />
                  <NavLink to="/profile" aria-label={user.fullName} title={user.fullName}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    </svg>
                    <span>{user.fullName}</span>
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        {/* User Account Menu with Avatar */}
        <div ref={accountMenuRef}>
          <details
            className="account-menu"
            open={accountMenuOpen}
            onToggle={(e) => setAccountMenuOpen(e.target.open)}
          >
            {user ? (
              <>
                <summary
                  className="account-menu-summary"
                  aria-label={`Account menu for ${user.fullName}`}
                >
                  <span className="account-avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="account-user-name">{user.fullName}</span>
                </summary>
                <div className="account-menu-panel">
                  <p className="account-menu-greeting">Hi, {user.fullName}</p>
                  <hr className="my-2 border-secondary border-opacity-25" />
                  {isAdmin && <Link to="/admin">Dashboard</Link>}
                  <Link to="/profile">Profile</Link>
                  <Link to="/account">My account</Link>
                  <Link to="/forgot-password">Reset password</Link>
                  <Link to="/account#account-delete">Delete account</Link>
                  <button type="button" onClick={logout} className="text-danger">
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <summary
                  className="account-menu-summary"
                  aria-label="Sign in or create an account"
                >
                  <span className="account-avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20c.7-3.5 3.2-5.3 7-5.3s6.3 1.8 7 5.3" />
                    </svg>
                  </span>
                  <span className="account-user-name">Sign in</span>
                </summary>
                <div className="account-menu-panel">
                  <Link to="/login">Sign in</Link>
                  <Link to="/signup">Create account</Link>
                </div>
              </>
            )}
          </details>
        </div>
      </aside>
    </>
  );
}
