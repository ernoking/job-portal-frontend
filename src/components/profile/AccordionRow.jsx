import React, { useState } from 'react';
import './AccordionRow.css';

export default function AccordionRow({ item, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <div className={`accordion-row ${expanded ? 'is-expanded' : ''}`} data-testid={`accordion-row-${item.id}`}>
      <button
        type="button"
        className="accordion-row-header"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={`accordion-body-${item.id}`}
        data-testid={`accordion-btn-${item.id}`}
      >
        <span className="accordion-row-title">{item.title}</span>
        <div className="accordion-row-meta">
          <span className="accordion-row-period">{item.period}</span>
          <svg
            className={`accordion-row-chevron ${expanded ? 'rotated' : ''}`}
            width="8"
            height="8"
            viewBox="0 0 10 6"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="#7A857E"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div id={`accordion-body-${item.id}`} className="accordion-row-body">
          <dl className="accordion-details-list">
            <div className="accordion-detail-item">
              <dt className="accordion-detail-label">ROLE / DEGREE</dt>
              <dd className="accordion-detail-value">{item.role || item.title}</dd>
            </div>
            <div className="accordion-detail-item">
              <dt className="accordion-detail-label">ORGANIZATION</dt>
              <dd className="accordion-detail-value">{item.organization || 'Acme Studio'}</dd>
            </div>
            <div className="accordion-detail-item">
              <dt className="accordion-detail-label">PERIOD</dt>
              <dd className="accordion-detail-value">{item.period}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
