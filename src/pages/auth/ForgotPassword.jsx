import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { confirmAction } from '../../services/modal';

export default function ForgotPassword() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const confirmed = await confirmAction({
      title: 'Send Password Reset Link',
      message: `Send password reset instructions to ${email}?`,
      confirmText: 'Send Reset Link',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
      showToast('✓ Password reset link sent if an account matches.');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const accountDestination = user?.role === 'admin' ? '/admin' : '/account';

  return (
    <div className="auth-page auth-recovery-page">
      <PageHeader
        eyebrow="Account security"
        title="Reset your password"
        description="Enter the email address for your account and we’ll send a reset link if it matches."
      />

      <section className="container auth-content">
        <form className="form-shell auth-form recovery-form" onSubmit={handleSubmit}>
          {sent ? (
            <div className="notice mb-4">
              If an account matches <strong>{email}</strong>, a password reset link has been dispatched. Please check your inbox.
            </div>
          ) : (
            <div className="mb-4">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                className="form-control"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {!sent && (
            <button className="btn btn-brand w-100" type="submit" disabled={loading}>
              {loading ? 'Sending link…' : 'Send reset link'}
            </button>
          )}

          <p className="recovery-privacy-note small text-secondary mb-0 mt-3">
            For your privacy, we’ll show the same confirmation whether or not an account matches.
          </p>

          <p className="recovery-back-link mb-0 mt-2">
            {user ? (
              <>Already signed in? <Link to={accountDestination}>Return to your account</Link></>
            ) : (
              <>Remembered your password? <Link to="/login">Sign in</Link></>
            )}
          </p>
        </form>
      </section>
    </div>
  );
}
