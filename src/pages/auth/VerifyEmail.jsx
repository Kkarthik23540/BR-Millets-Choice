import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { api } from '../../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('Verifying your email address…');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setStatus('Invalid verification link. No verification token was provided.');
      setLoading(false);
      return;
    }
    api(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setStatus(data.message || 'Your email has been verified successfully!');
        setIsSuccess(true);
      })
      .catch((err) => {
        setStatus(err.message || 'Verification link expired or invalid.');
        setIsSuccess(false);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <PageHeader eyebrow="Account verification" title="Email verification" />

      <section className="container section-space py-5 text-center">
        <div className="p-4 p-md-5 bg-white rounded-4 border shadow-xs mx-auto" style={{ maxWidth: '480px' }}>
          {loading ? (
            <div>
              <div className="spinner-border text-forest" role="status" />
              <p className="mt-3 text-secondary">{status}</p>
            </div>
          ) : (
            <div>
              <span className="fs-1 d-block mb-3">{isSuccess ? '🎉' : '⚠️'}</span>
              <h2 className="h5 fw-bold text-dark mb-2">
                {isSuccess ? 'Verification Complete' : 'Verification Issue'}
              </h2>
              <p className="small text-secondary mb-4">{status}</p>
              <Link to="/login" className="btn btn-brand rounded-pill px-4">
                Continue to Sign in
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
