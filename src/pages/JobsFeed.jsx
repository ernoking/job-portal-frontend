import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import FilterSidebar from '../components/jobs/FilterSidebar';
import FeaturedMatch from '../components/jobs/FeaturedMatch';
import MatchRow from '../components/jobs/MatchRow';
import MatchDrawer from '../components/jobs/MatchDrawer';
import { getMatches, getMatchDetail, filterJobs, USE_MOCK_JOBS } from '../api/jobs';
import './JobsFeed.css';

const INITIAL_FILTERS = {
  keywords: '',
  location: 'Budapest',
  workTypes: USE_MOCK_JOBS ? ['Remote', 'Hybrid'] : [],
  minMatch: 80,
};

export default function JobsFeed() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state starts with the displayed defaults immediately (Finding [P2])
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Feed data loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allJobs, setAllJobs] = useState([]);

  // Drawer detail states
  const jobParam = searchParams.get('job');
  const [activeJob, setActiveJob] = useState(null);
  const [drawerError, setDrawerError] = useState(null);
  const isDrawerLoading = Boolean(jobParam && !activeJob && !drawerError);

  // Fetch all open jobs on mount
  useEffect(() => {
    let isMounted = true;
    getMatches()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : (res?.jobs || []);
          setAllJobs(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Unable to load jobs. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    getMatches()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.jobs || []);
        setAllJobs(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Unable to load jobs. Please try again.');
        setLoading(false);
      });
  }, []);

  const [visibleMoreCount, setVisibleMoreCount] = useState(2);

  // Filter jobs client-side from the initial render onwards
  const filteredJobs = useMemo(() => {
    return filterJobs(allJobs, filters);
  }, [allJobs, filters]);

  const featuredJob = filteredJobs[0] || null;
  const remainingJobs = filteredJobs.slice(1);
  const moreJobs = remainingJobs.slice(0, visibleMoreCount);
  const hasMore = remainingJobs.length > visibleMoreCount;
  const remainingCount = remainingJobs.length - visibleMoreCount;

  // Fetch drawer job detail when ?job=<id> is in URL
  const fetchDrawerDetail = useCallback(
    (id) => {
      if (!id) return;
      getMatchDetail(id)
        .then((detail) => {
          if (!detail) {
            // Missing/not found: close drawer and clean query param
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('job');
            setSearchParams(nextParams, { replace: true });
            setActiveJob(null);
          } else {
            setActiveJob(detail);
          }
        })
        .catch((err) => {
          if (err?.status === 404) {
            // 404 closes drawer and removes parameter
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('job');
            setSearchParams(nextParams, { replace: true });
            setActiveJob(null);
          } else {
            setDrawerError(err?.message || 'Unable to load this job. Please try again.');
          }
        });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (jobParam) {
      fetchDrawerDetail(jobParam);
    }
  }, [jobParam, fetchDrawerDetail]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setVisibleMoreCount(2);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setVisibleMoreCount(2);
  }, []);

  // Drawer open / close handlers
  const handleOpenDrawer = useCallback(
    (jobId) => {
      if (activeJob?.id !== jobId) {
        setActiveJob(null);
        setDrawerError(null);
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('job', jobId);
      setSearchParams(nextParams);
    },
    [activeJob?.id, searchParams, setSearchParams]
  );

  const handleCloseDrawer = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('job');
    setSearchParams(nextParams);
    setActiveJob(null);
    setDrawerError(null);
  }, [searchParams, setSearchParams]);

  return (
    <div className="jobs-feed-page">
      <AppNav activeTab="jobs" />

      <main className="jobs-feed-main">
        <div className="jobs-feed-layout">
          {/* Left Column: Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            disabledWorkType={!USE_MOCK_JOBS}
          />

          {/* Right Column: Feed Content */}
          <section className="jobs-feed-content" aria-label="Job matches">
            {/* Feed Header */}
            <header className="jobs-feed-header">
              <div className="jobs-feed-eyebrow">PERSONALISED FOR YOU</div>
              <div className="jobs-feed-title-row">
                <h1 className="jobs-feed-title">Your top matches</h1>
                <span className="jobs-feed-count" data-testid="jobs-feed-count">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'role found' : 'roles found'}
                </span>
              </div>
              <p className="jobs-feed-subtitle">
                Based on your profile and preferences.
              </p>
            </header>

            {loading ? (
              /* Loading Skeleton */
              <div className="jobs-feed-loading" data-testid="jobs-feed-loading">
                <div className="jobs-feed-skeleton-card" />
                <div className="jobs-feed-skeleton-row" />
                <div className="jobs-feed-skeleton-row" />
              </div>
            ) : error ? (
              /* Error State with Try Again */
              <div className="jobs-feed-error" data-testid="jobs-feed-error">
                <p className="jobs-feed-error-text">{error}</p>
                <button
                  type="button"
                  className="jobs-feed-retry-btn"
                  onClick={handleRetry}
                  data-testid="jobs-feed-retry-btn"
                >
                  Try again
                </button>
              </div>
            ) : filteredJobs.length === 0 ? (
              /* Empty State */
              <div className="jobs-feed-empty" data-testid="jobs-feed-empty">
                <div className="jobs-feed-empty-icon" aria-hidden="true">
                  🔍
                </div>
                <h3 className="jobs-feed-empty-title">No roles match these filters.</h3>
                <p className="jobs-feed-empty-text">
                  Try loosening your filters or expanding your location.
                </p>
                <button
                  type="button"
                  className="jobs-feed-reset-btn"
                  onClick={handleResetFilters}
                  data-testid="jobs-feed-reset-btn"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                {/* Featured Match Card */}
                {featuredJob && (
                  <FeaturedMatch
                    job={featuredJob}
                    onViewDetails={handleOpenDrawer}
                  />
                )}

                {/* More strong matches */}
                {moreJobs.length > 0 && (
                  <section className="jobs-more-section" aria-label="More strong matches">
                    <h2 className="jobs-more-title">More strong matches</h2>
                    <div className="jobs-more-list">
                      {moreJobs.map((job) => (
                        <MatchRow
                          key={job.id}
                          job={job}
                          onSelect={handleOpenDrawer}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="jobs-more-actions">
                        <button
                          type="button"
                          className="jobs-more-btn"
                          onClick={() => setVisibleMoreCount((prev) => prev + 5)}
                          data-testid="show-more-matches-btn"
                          aria-label={`Show more matches (${remainingCount} remaining)`}
                        >
                          Show more matches ({remainingCount} remaining)
                        </button>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* View full match drawer */}
      <MatchDrawer
        job={activeJob}
        isOpen={Boolean(jobParam)}
        isLoading={isDrawerLoading}
        error={drawerError}
        onClose={handleCloseDrawer}
        onRetry={() => fetchDrawerDetail(jobParam)}
      />
    </div>
  );
}
