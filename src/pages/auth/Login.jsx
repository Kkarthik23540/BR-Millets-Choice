import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const { login, config, user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const isPendingVerification = queryParams.get('verification') === 'pending';
  const errorParam = queryParams.get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      showToast(`✓ Welcome back, ${loggedUser.fullName}!`);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-login">
      <PageHeader
        eyebrow="Welcome back"
        title="Sign in"
        description="Access your own profile, addresses and orders."
      />

      <section className="container auth-content">
        {isPendingVerification && (
          <div className="notice mb-3">
            Check your inbox and verify your email before signing in. After confirming, return here and sign in.
          </div>
        )}

        {errorParam && (
          <div className="notice mb-3 border-danger text-danger">
            {errorParam === 'google_state_mismatch'
              ? 'Google sign-in session expired. Please click "Continue with Google" again.'
              : errorParam === 'access_denied'
              ? 'Google sign-in was cancelled.'
              : 'Sign-in could not be completed. Please try again.'}
          </div>
        )}

        <div className="auth-login-grid">
          <form className="form-shell auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                className="form-control"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field mt-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                className="form-control"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-brand w-100 mt-3" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="d-flex justify-content-between mt-3 small">
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/signup">Create account</Link>
            </div>

            <div className="mt-3">
              {config?.googleConfigured ? (
                <>
                  <div className="auth-divider" aria-label="Or sign in with">
                    <span>OR</span>
                  </div>
                  <a className="btn btn-outline-brand w-100" href="/api/auth/google">
                    <svg className="google-signin-icon me-2" aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.4-4.55H24v9.02h12.94c-.58 2.96-2.25 5.47-4.72 7.16l7.62 5.91c4.45-4.1 7.14-10.14 7.14-17.54Z" />
                      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.95 23.95 0 0 0 0 21.56l7.98-6.19Z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.91l-7.62-5.91c-2.12 1.42-4.84 2.26-8.28 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                    </svg>
                    Continue with Google
                  </a>
                </>
              ) : (
                <p className="small text-secondary mb-0 text-center">
                  Google sign-in is available when OAuth is configured.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
