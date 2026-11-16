import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      showToast('✓ Password reset link dispatched to your inbox.');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account security" title="Reset your password" />

      <section className="container section-space py-5">
        <div className="p-4 p-md-5 bg-white rounded-4 border shadow-xs mx-auto" style={{ maxWidth: '440px' }}>
          {!submitted ? (
            <>
              <h2 className="h5 fw-bold text-center mb-1 text-dark">Forgot your password?</h2>
              <p className="small text-secondary text-center mb-4">
                Enter your email address and we'll send you a secure link to reset it.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-brand w-100 rounded-pill py-2 fw-bold"
                  disabled={loading}
                >
                  {loading ? 'Sending link…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <span className="fs-1 d-block mb-2">✉️</span>
              <h3 className="h5 fw-bold text-dark">Check your inbox</h3>
              <p className="small text-secondary mb-4">
                If an account exists for <strong>{email}</strong>, a secure password reset link has been dispatched.
              </p>
              <Link to="/login" className="btn btn-brand rounded-pill px-4">
                Return to Sign in
              </Link>
            </div>
          )}

          <div className="text-center mt-4">
            <Link to="/login" className="small text-forest fw-semibold text-decoration-none">
              ← Back to Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
