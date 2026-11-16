import React from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="container section-space py-5 text-center">
          <div className="card p-5 mx-auto bg-white rounded-4 border shadow-xs" style={{ maxWidth: '540px' }}>
            <span className="fs-1 d-block mb-3">🌾</span>
            <h2 className="h4 fw-bold mb-2">Something went wrong</h2>
            <p className="text-secondary mb-4">
              We encountered an issue displaying this page. You can return to our shop or reload the page.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-brand"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Reload Page
              </button>
              <Link to="/shop" className="btn btn-outline-brand" onClick={() => this.setState({ hasError: false })}>
                Browse Products
              </Link>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
