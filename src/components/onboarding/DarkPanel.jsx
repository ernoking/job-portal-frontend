import React from 'react';
import './DarkPanel.css';

export default function DarkPanel({ children, height = 620, className = '' }) {
  return (
    <div
      className={`dark-panel ${className}`}
      style={{ height: `${height}px` }}
      data-testid="dark-panel"
    >
      {/* Decorative concentric arcs */}
      <div className="dark-panel-arcs" aria-hidden="true">
        <div className="dark-panel-arc arc-outer" />
        <div className="dark-panel-arc arc-middle" />
        <div className="dark-panel-arc arc-inner" />
      </div>

      <div className="dark-panel-content">{children}</div>
    </div>
  );
}
