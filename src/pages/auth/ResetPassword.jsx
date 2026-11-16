import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function ResetPassword() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Missing reset token. Please check your link.', true);
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', true);
      return;
    }
    if (password.length < 12) {
      showToast('Password must be at least 12 characters.', true);
      return;
    }

    setLoading(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      showToast('✓ Password updated! You can now sign in with your new password.');
      navigate('/login');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account security" title="Choose a new password" />

      <section className="container section-space">
        <form className="form-shell" onSubmit={handleSubmit}>
          {!token && (
            <div className="notice mb-3 border-danger text-danger">
              This link is missing its reset token. Please request a new link from the forgot password page.
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" htmlFor="password">New password</label>
            <input
              className="form-control"
              id="password"
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="form-text">Use at least 12 characters.</div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="confirm-password">Confirm new password</label>
            <input
              className="form-control"
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="btn btn-brand w-100" type="submit" disabled={loading || !token}>
            {loading ? 'Updating…' : 'Update password'}
          </button>

          <p className="text-center small mt-3 mb-0">
            <Link to="/login">Return to sign in</Link>
          </p>
        </form>
      </section>
    </>
  );
}
