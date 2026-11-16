import React from 'react';

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div className="container">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="display-title">{title}</h1>
            {description && <p className="lead-copy">{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </header>
  );
}
