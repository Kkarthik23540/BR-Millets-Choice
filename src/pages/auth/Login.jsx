import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      showToast('✓ Welcome back!');
      if (data.user?.role === 'admin') navigate('/admin');
      else navigate(from, { replace: true });
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account access" title="Sign in" />

      <section className="container section-space py-5">
        <div className="p-4 p-md-5 bg-white rounded-4 border shadow-xs mx-auto" style={{ maxWidth: '440px' }}>
          <h2 className="h4 fw-bold text-center mb-1 text-forest">Sign in to your account</h2>
          <p className="small text-secondary text-center mb-4">
            Enter your details below to access orders and profile.
          </p>

          {/* Google Sign In */}
          <div className="mb-4">
            <a
              href="/auth/google"
              className="btn btn-outline-secondary w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold text-dark text-decoration-none shadow-xs"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>
          </div>

          <div className="d-flex align-items-center gap-2 mb-4">
            <hr className="flex-fill my-0" />
            <span className="small text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>or with email</span>
            <hr className="flex-fill my-0" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email address</label>
              <input
                type="email"
                className="form-control"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between">
                <label className="form-label small fw-semibold">Password</label>
                <Link to="/forgot-password" className="small text-forest text-decoration-none">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                className="form-control"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-brand w-100 rounded-pill py-2 fw-bold"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="small text-secondary text-center mt-4 mb-0">
            Don't have an account?{' '}
            <Link to="/signup" className="text-forest fw-semibold text-decoration-none">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
