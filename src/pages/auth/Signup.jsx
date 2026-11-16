import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Signup() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', true);
      return;
    }
    if (form.password.length < 12) {
      showToast('Password must be at least 12 characters.', true);
      return;
    }
    if (!form.acceptTerms) {
      showToast('Please accept the terms and privacy policy.', true);
      return;
    }

    setLoading(true);
    try {
      const res = await register(form.fullName, form.email, form.password);
      showToast('✓ Account created! Check your email to verify.');
      navigate('/login?verification=pending');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-signup">
      <PageHeader
        eyebrow="Join us"
        title="Create your account"
        description="Your account keeps your own addresses and order requests private."
      />

      <section className="container auth-content">
        <form className="form-shell auth-form auth-signup-form" onSubmit={handleSubmit}>
          <div className="auth-fields">
            <div className="auth-field">
              <label className="form-label" htmlFor="full-name">Full name</label>
              <input
                className="form-control"
                id="full-name"
                name="fullName"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="auth-field">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                className="form-control"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="auth-field">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                className="form-control"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <div className="form-text">Use at least 12 characters.</div>
            </div>

            <div className="auth-field">
              <label className="form-label" htmlFor="confirm-password">Confirm password</label>
              <input
                className="form-control"
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="form-check my-3">
            <input
              className="form-check-input"
              id="terms-accept"
              name="acceptTerms"
              type="checkbox"
              required
              checked={form.acceptTerms}
              onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="terms-accept">
              I accept the <Link to="/terms">terms</Link> and have read the <Link to="/privacy">privacy policy</Link>.
            </label>
          </div>

          <button className="btn btn-brand w-100" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center small mt-3 mb-0">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
