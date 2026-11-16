import React from 'react';

export default function BrandLoader({ message = 'Wholesome goodness, every day' }) {
  return (
    <div className="brmc-brand-loader" role="status" aria-live="polite">
      <div className="brmc-spinner-wrap">
        <div className="brmc-spinner-ring" />
        <img src="/images/br-millet-choice-icon.png" alt="BR Millet Choice" className="brmc-spinner-icon" />
      </div>
      <div className="brmc-spinner-brand">BR Millet Choice</div>
      <div className="brmc-spinner-sub">{message}</div>
      <div className="brmc-spinner-line">
        <div className="brmc-spinner-bar" />
      </div>
    </div>
  );
}
