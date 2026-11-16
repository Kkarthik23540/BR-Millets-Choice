import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', true);
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      showToast('✓ Password updated successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account security" title="Set a new password" />

      <section className="container section-space py-5">
        <div className="p-4 p-md-5 bg-white rounded-4 border shadow-xs mx-auto" style={{ maxWidth: '440px' }}>
          <h2 className="h5 fw-bold text-center mb-1 text-dark">Create new password</h2>
          <p className="small text-secondary text-center mb-4">
            Enter your new secure password below.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">New Password (min 8 chars)</label>
              <input
                type="password"
                className="form-control"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-brand w-100 rounded-pill py-2 fw-bold"
              disabled={loading || !token}
            >
              {loading ? 'Saving…' : 'Update Password'}
            </button>
          </form>

          {!token && (
            <p className="small text-danger text-center mt-3 mb-0">
              ⚠️ Missing or invalid reset token. Please request a new link from the forgot password page.
            </p>
          )}

          <div className="text-center mt-4">
            <Link to="/login" className="small text-forest fw-semibold text-decoration-none">
              ← Return to Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
