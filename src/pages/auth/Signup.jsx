import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function Signup() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', true);
      return;
    }
    if (!form.terms) {
      showToast('Please agree to the Terms of Service to continue.', true);
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });
      showToast('✓ Account created! Welcome to BR Millet Choice.');
      await refreshUser();
      navigate('/profile');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="New customer" title="Create an account" />

      <section className="container section-space py-5">
        <div className="p-4 p-md-5 bg-white rounded-4 border shadow-xs mx-auto" style={{ maxWidth: '440px' }}>
          <h2 className="h4 fw-bold text-center mb-1 text-forest">Join BR Millet Choice</h2>
          <p className="small text-secondary text-center mb-4">
            Fresh stone-ground millets delivered to your doorstep.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Full name</label>
              <input
                type="text"
                className="form-control"
                required
                autoComplete="name"
                placeholder="e.g. Karthik Reddy"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Email address</label>
              <input
                type="email"
                className="form-control"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Password (min 8 characters)</label>
              <input
                type="password"
                className="form-control"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Confirm password</label>
              <input
                type="password"
                className="form-control"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>

            <div className="form-check mb-4">
              <input
                type="checkbox"
                className="form-check-input"
                id="terms-check"
                required
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
              />
              <label className="form-check-label small text-secondary" htmlFor="terms-check">
                I agree to the <Link to="/terms" className="text-forest">Terms of Service</Link> and <Link to="/privacy" className="text-forest">Privacy Policy</Link>.
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-brand w-100 rounded-pill py-2 fw-bold"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="small text-secondary text-center mt-4 mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-forest fw-semibold text-decoration-none">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
