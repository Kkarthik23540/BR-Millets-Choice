import React from 'react';

export default function PageHeader({ eyebrow, title, description = '', badge = null, actions = null }) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h1 className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <span>{title}</span>
              {badge}
            </h1>
            {description && <p className="section-intro mb-0">{description}</p>}
          </div>
          {actions && <div className="d-flex align-items-center ms-auto">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
