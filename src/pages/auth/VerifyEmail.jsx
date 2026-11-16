import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { api } from '../../services/api';

export default function VerifyEmail() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const [statusMessage, setStatusMessage] = useState('Checking your verification link…');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatusMessage('This link is missing its verification token.');
      return;
    }

    api(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatusMessage(res.message || 'Email verified successfully!');
        setSuccess(true);
      })
      .catch((err) => {
        setStatusMessage(err.message || 'Verification link expired or invalid.');
      });
  }, [token]);

  return (
    <>
      <PageHeader eyebrow="Account security" title="Verifying your email" />
      <section className="container content-shell">
        <div className={`notice mb-3 ${success ? 'border-success text-success' : ''}`}>
          {statusMessage}
        </div>
        <div className="mt-3">
          <Link className="btn btn-outline-brand" to="/login">
            Continue to sign in
          </Link>
        </div>
      </section>
    </>
  );
}
