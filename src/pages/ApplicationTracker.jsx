import { Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import { getApplications } from '../applications/applicationsStore';
import { useAuth } from '../auth';
import './ApplicationTracker.css';

export default function ApplicationTracker() {
  const { user } = useAuth();
  const applications = getApplications(user?.id);
  const activeCount =
    applications.Saved.length +
    applications.Applied.length +
    applications.Responded.length +
    applications.Interviewed.length;

  return (
    <div className="tracker-page">
      <AppNav activeTab="tracker" />

      <main className="tracker-main">
        <div className="tracker-container">
          {/* Top Header */}
          <div className="tracker-header">
            <div>
              <div className="tracker-eyebrow">YOUR PIPELINE</div>
              <h1 className="tracker-title">Application tracker</h1>
              <p className="tracker-subtitle">Stay on top of every opportunity.</p>
            </div>
            <Link to="/matches" className="tracker-browse-btn" data-testid="tracker-browse-matches-btn">
              Browse matches
            </Link>
          </div>

          {/* Metric cards */}
          <div className="tracker-metrics-row">
            <div className="tracker-metric-card">
              <span className="tracker-metric-label">ACTIVE APPLICATIONS</span>
              <span className="tracker-metric-value">{activeCount || 0}</span>
            </div>
            <div className="tracker-metric-card">
              <span className="tracker-metric-label">RESPONSE RATE</span>
              <span className="tracker-metric-value">0%</span>
            </div>
            <div className="tracker-metric-card">
              <span className="tracker-metric-label">UPCOMING INTERVIEWS</span>
              <span className="tracker-metric-value">0</span>
            </div>
          </div>

          {/* Columns placeholder */}
          <div className="tracker-board" data-testid="tracker-board">
            {['Saved', 'Applied', 'Responded', 'Interviewed', 'Offered'].map((col) => {
              const items = applications[col] || [];
              return (
                <div key={col} className="tracker-column">
                  <div className="tracker-column-header">
                    <span className="tracker-column-name">{col}</span>
                    <span className="tracker-column-count">{items.length}</span>
                  </div>
                  <div className="tracker-column-cards">
                    {items.length === 0 ? (
                      <div className="tracker-column-empty">
                        <span>Items will appear here</span>
                      </div>
                    ) : (
                      items.map((job) => (
                        <div key={job.id} className="tracker-item-card">
                          <span className="tracker-item-title">{job.title}</span>
                          <span className="tracker-item-company">{job.company}</span>
                          <span className="tracker-item-meta">{job.location} · {job.workType}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
