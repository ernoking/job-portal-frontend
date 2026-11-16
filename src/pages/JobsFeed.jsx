import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import FilterSidebar from '../components/jobs/FilterSidebar';
import FeaturedMatch from '../components/jobs/FeaturedMatch';
import MatchRow from '../components/jobs/MatchRow';
import MatchDrawer from '../components/jobs/MatchDrawer';
import {
  getMatches,
  getMatchDetail,
  filterJobs,
  fetchMorePages,
  retryFailedPages,
  USE_MOCK_JOBS,
} from '../api/jobs';
import { flattenJobPages } from '../api/jobPages.js';
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
  const [jobPages, setJobPages] = useState({});

  // Pagination & Catalogue metadata
  const [paginationMeta, setPaginationMeta] = useState({
    totalPages: 1,
    loadedPages: [1],
    failedPages: [],
    nextPageToLoad: null,
    isIncomplete: false,
  });

  const [isFetchingMorePages, setIsFetchingMorePages] = useState(false);
  const [isRetryingFailedPages, setIsRetryingFailedPages] = useState(false);
  const [pageActionError, setPageActionError] = useState(null);

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
          setJobPages(res.pages);
          if (res && typeof res === 'object' && 'isIncomplete' in res) {
            setPaginationMeta({
              totalPages: res.totalPages || 1,
              loadedPages: res.loadedPages || [1],
              failedPages: res.failedPages || [],
              nextPageToLoad: res.nextPageToLoad ?? null,
              isIncomplete: Boolean(res.isIncomplete),
            });
          }
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
    setPageActionError(null);
    getMatches()
      .then((res) => {
        setJobPages(res.pages);
        if (res && typeof res === 'object' && 'isIncomplete' in res) {
          setPaginationMeta({
            totalPages: res.totalPages || 1,
            loadedPages: res.loadedPages || [1],
            failedPages: res.failedPages || [],
            nextPageToLoad: res.nextPageToLoad ?? null,
            isIncomplete: Boolean(res.isIncomplete),
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Unable to load jobs. Please try again.');
        setLoading(false);
      });
  }, []);

  const handleFetchMorePages = useCallback(async () => {
    if (!paginationMeta.nextPageToLoad || isFetchingMorePages) return;
    setIsFetchingMorePages(true);
    setPageActionError(null);

    try {
      const res = await fetchMorePages(paginationMeta.nextPageToLoad, paginationMeta.totalPages);
      setJobPages((prev) => ({ ...prev, ...res.pages }));

      setPaginationMeta((prev) => {
        const combinedLoaded = Array.from(new Set([...prev.loadedPages, ...res.loadedPages])).sort((a, b) => a - b);
        const combinedFailed = Array.from(new Set([...prev.failedPages, ...res.failedPages])).sort((a, b) => a - b);
        const next = res.nextPageToLoad;
        return {
          ...prev,
          loadedPages: combinedLoaded,
          failedPages: combinedFailed,
          nextPageToLoad: next,
          isIncomplete: combinedFailed.length > 0 || next !== null,
        };
      });
    } catch (err) {
      setPageActionError(err?.message || 'Unable to load further pages.');
    } finally {
      setIsFetchingMorePages(false);
    }
  }, [paginationMeta.nextPageToLoad, paginationMeta.totalPages, isFetchingMorePages]);

  const handleRetryFailedPages = useCallback(async () => {
    if (paginationMeta.failedPages.length === 0 || isRetryingFailedPages) return;
    setIsRetryingFailedPages(true);
    setPageActionError(null);

    try {
      const res = await retryFailedPages(paginationMeta.failedPages);
      setJobPages((prev) => ({ ...prev, ...res.pages }));

      setPaginationMeta((prev) => {
        const recoveredSet = new Set(res.recoveredPages);
        const remainingFailed = prev.failedPages.filter((p) => !recoveredSet.has(p));
        const combinedLoaded = Array.from(new Set([...prev.loadedPages, ...res.recoveredPages])).sort((a, b) => a - b);
        return {
          ...prev,
          loadedPages: combinedLoaded,
          failedPages: remainingFailed,
          isIncomplete: remainingFailed.length > 0 || prev.nextPageToLoad !== null,
        };
      });
    } catch (err) {
      setPageActionError(err?.message || 'Unable to retry failed pages.');
    } finally {
      setIsRetryingFailedPages(false);
    }
  }, [paginationMeta.failedPages, isRetryingFailedPages]);

  const [visibleMoreCount, setVisibleMoreCount] = useState(2);

  // Filter jobs client-side from the initial render onwards
  const filteredJobs = useMemo(() => {
    return filterJobs(flattenJobPages(jobPages), filters);
  }, [jobPages, filters]);

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

  const renderIncompleteNotice = (inEmptyState = false) => {
    if (!paginationMeta.isIncomplete) return null;

    const hasMore = paginationMeta.nextPageToLoad !== null;
    const hasFailed = paginationMeta.failedPages.length > 0;
    const loadedCount = paginationMeta.loadedPages.length;
    const total = paginationMeta.totalPages;

    return (
      <div
        className={`jobs-incomplete-banner ${inEmptyState ? 'is-empty-state' : ''}`}
        role="status"
        data-testid={inEmptyState ? 'jobs-empty-incomplete-notice' : 'jobs-incomplete-banner'}
      >
        <div className="jobs-incomplete-icon" aria-hidden="true">
          {hasFailed ? '⚠️' : 'ℹ️'}
        </div>
        <div className="jobs-incomplete-content">
          <p className="jobs-incomplete-text">
            {hasMore && (
              <span>
                Showing results from the first {loadedCount} of {total} catalogue pages.{' '}
              </span>
            )}
            {hasFailed && (
              <span className="jobs-incomplete-failed-text">
                Some pages failed to load (page {paginationMeta.failedPages.join(', ')}).{' '}
              </span>
            )}
            {inEmptyState && (
              <span>
                Matching roles might exist in unsearched or failed pages.
              </span>
            )}
          </p>
          <div className="jobs-incomplete-actions">
            {hasMore && (
              <button
                type="button"
                className="jobs-page-action-btn search-later-btn"
                onClick={handleFetchMorePages}
                disabled={isFetchingMorePages || isRetryingFailedPages}
                data-testid="search-later-pages-btn"
              >
                {isFetchingMorePages ? 'Searching later pages...' : 'Search later pages'}
              </button>
            )}
            {hasFailed && (
              <button
                type="button"
                className="jobs-page-action-btn retry-pages-btn"
                onClick={handleRetryFailedPages}
                disabled={isFetchingMorePages || isRetryingFailedPages}
                data-testid="retry-failed-pages-btn"
              >
                {isRetryingFailedPages ? 'Retrying failed pages...' : 'Retry failed pages'}
              </button>
            )}
          </div>
          {pageActionError && (
            <p className="jobs-page-action-error" role="alert">
              {pageActionError}
            </p>
          )}
        </div>
      </div>
    );
  };

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

                {paginationMeta.isIncomplete && renderIncompleteNotice(true)}
              </div>
            ) : (
              <>
                {renderIncompleteNotice(false)}

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
