import React from 'react';

export default function VisitCounter({ count = 0, label = 'Page Visits', dark = false }) {
  const safeNum = Math.max(0, parseInt(count, 10) || 0);
  const digits = String(safeNum).padStart(6, '0').split('');
  const variantClass = dark ? 'is-dark' : 'is-light';

  return (
    <div className={`visit-counter-widget ${variantClass}`}>
      <div className="visit-counter-digits" aria-label={`${label}: ${safeNum}`}>
        {digits.map((d, i) => (
          <span key={i} className="visit-digit-box">
            {d}
          </span>
        ))}
      </div>
      <span className="visit-counter-label">{label}</span>
    </div>
  );
}
