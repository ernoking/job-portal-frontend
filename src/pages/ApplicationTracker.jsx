import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import { getApplications } from '../api/applications';
import { useAuth } from '../auth';
import './ApplicationTracker.css';

export default function ApplicationTracker() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date filters (inclusive, YYYY-MM-DD)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const filters = {};
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;

    getApplications(filters, token)
      .then((res) => {
        if (!isMounted) return;
        setApplications(res?.applications || []);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err || new Error('Failed to load application history.'));
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate, reloadTrigger, token]);

  const handleClearFilters = () => {
    setIsLoading(true);
    setFromDate('');
    setToDate('');
  };

  const handleRetry = () => {
    setIsLoading(true);
    setReloadTrigger((prev) => prev + 1);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="tracker-page">
      <AppNav activeTab="tracker" />

      <main className="tracker-main" data-testid="tracker-main">
        {/* Header Block */}
        <header className="tracker-header">
          <h1 className="tracker-title">Application Tracker</h1>
          <p className="tracker-subtitle">
            Keep track of all your job submissions, application methods, and hiring outcomes.
          </p>
        </header>

        {/* Toolbar with Date Filters */}
        <div className="tracker-toolbar">
          <div className="tracker-filters">
            <div className="tracker-filter-group">
              <label htmlFor="tracker-from-date" className="tracker-filter-label">
                From:
              </label>
              <input
                id="tracker-from-date"
                type="date"
                className="tracker-date-input"
                value={fromDate}
                onChange={(e) => {
                  setIsLoading(true);
                  setFromDate(e.target.value);
                }}
                aria-label="Filter from date"
              />
            </div>

            <div className="tracker-filter-group">
              <label htmlFor="tracker-to-date" className="tracker-filter-label">
                To:
              </label>
              <input
                id="tracker-to-date"
                type="date"
                className="tracker-date-input"
                value={toDate}
                onChange={(e) => {
                  setIsLoading(true);
                  setToDate(e.target.value);
                }}
                aria-label="Filter to date"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                type="button"
                className="tracker-filter-clear-btn"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="tracker-summary-count">
            Showing {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </div>
        </div>

        {/* Recoverable Error Banner */}
        {error && (
          <div className="tracker-error-banner" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span aria-hidden="true">⚠️</span>
              <span>
                <strong>Unable to load applications:</strong> {error?.message || 'Please check your connection.'}
              </span>
            </div>
            <button
              type="button"
              className="tracker-retry-btn"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="tracker-loading">Loading your application history...</div>
        ) : applications.length === 0 ? (
          <div className="tracker-empty-state">
            <div className="tracker-empty-icon" aria-hidden="true">
              📋
            </div>
            <h2 className="tracker-empty-title">
              {fromDate || toDate ? 'No applications match your date range' : 'No applications recorded yet'}
            </h2>
            <p className="tracker-empty-desc">
              {fromDate || toDate
                ? 'Try adjusting or clearing your date filters to see earlier submissions.'
                : 'Browse recommended matches and apply directly to track your progress here.'}
            </p>
            {fromDate || toDate ? (
              <button
                type="button"
                className="tracker-browse-btn"
                onClick={handleClearFilters}
              >
                Clear date filters
              </button>
            ) : (
              <Link to="/matches" className="tracker-browse-btn">
                Browse open roles →
              </Link>
            )}
          </div>
        ) : (
          <div className="tracker-table-container">
            <table className="tracker-table">
              <thead>
                <tr>
                  <th>Job Title & Company</th>
                  <th>Location</th>
                  <th>Submission Method</th>
                  <th>Date Applied</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const job = app.job;
                  const isAuto = app.method === 'auto';
                  const isClosed = job && job.isActive === false;

                  return (
                    <tr key={app.id}>
                      <td>
                        <span className="tracker-job-title">
                          {job?.title || 'Job Offer'}
                        </span>
                        <span className="tracker-job-company">
                          {job?.company || 'Company'}
                        </span>
                      </td>
                      <td>
                        <span className="tracker-job-location">
                          {job?.location || 'Remote / Unspecified'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`tracker-badge ${
                            isAuto ? 'tracker-badge-auto' : 'tracker-badge-manual'
                          }`}
                        >
                          {isAuto ? '⚡ Automatic' : '📝 Manual'}
                        </span>
                      </td>
                      <td>{formatDate(app.appliedAt)}</td>
                      <td>
                        {isClosed ? (
                          <span className="tracker-badge tracker-badge-closed">
                            Closed
                          </span>
                        ) : (
                          <span className="tracker-badge tracker-badge-applied">
                            {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Applied'}
                          </span>
                        )}
                      </td>
                      <td>
                        {job?.id ? (
                          <Link
                            to={`/jobs/${job.id}/tailor`}
                            className="tracker-action-link"
                          >
                            View Docs ↗
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
