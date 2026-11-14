import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import FilterSidebar from '../components/jobs/FilterSidebar';
import FeaturedMatch from '../components/jobs/FeaturedMatch';
import MatchRow from '../components/jobs/MatchRow';
import MatchDrawer from '../components/jobs/MatchDrawer';
import { MOCK_JOBS } from '../mocks/jobs';
import {
  isJobApplied,
  applyToJob,
  subscribe as subscribeApplications,
} from '../applications/applicationsStore';
import { useAuth } from '../auth';
import './JobsFeed.css';

const INITIAL_FILTERS = {
  keywords: '',
  location: 'Budapest',
  workTypes: ['Remote', 'Hybrid'],
  minMatch: 80,
};

export default function JobsFeed() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state & interaction tracking
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Store subscription trigger
  const [, setStoreTick] = useState(0);

  // Derive active drawer job from URL query parameter
  const jobParam = searchParams.get('job');
  const activeJob = useMemo(() => {
    if (!jobParam) return null;
    return MOCK_JOBS.find((j) => j.id === jobParam) || null;
  }, [jobParam]);

  // Subscribe to applications store changes
  useEffect(() => {
    const unsubscribe = subscribeApplications(() => {
      setStoreTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Clean up invalid ?job deep-links gracefully without crashing
  useEffect(() => {
    if (jobParam && !activeJob) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('job');
      setSearchParams(nextParams, { replace: true });
    }
  }, [jobParam, activeJob, searchParams, setSearchParams]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setHasInteracted(true);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setHasInteracted(false);
  }, []);

  // Filtered jobs list
  const filteredJobs = useMemo(() => {
    // Decision #1: On initial untouched load, show all 24 ranked roles per design
    if (!hasInteracted) {
      return MOCK_JOBS;
    }

    const kw = filters.keywords.trim().toLowerCase();
    const loc = filters.location.trim().toLowerCase();

    return MOCK_JOBS.filter((job) => {
      // Minimum match score
      if (job.fit < filters.minMatch) {
        return false;
      }

      // Work type
      if (filters.workTypes.length > 0 && !filters.workTypes.includes(job.workType)) {
        return false;
      }

      // Location substring match
      if (loc && !job.location.toLowerCase().includes(loc)) {
        return false;
      }

      // Keyword match
      if (kw) {
        const inTitle = job.title.toLowerCase().includes(kw);
        const inCompany = job.company.toLowerCase().includes(kw);
        const inWhy = job.whyMatch?.some((w) => w.toLowerCase().includes(kw));
        const inSkills = job.skillsToBuild?.some((s) => s.toLowerCase().includes(kw));
        if (!inTitle && !inCompany && !inWhy && !inSkills) {
          return false;
        }
      }

      return true;
    });
  }, [filters, hasInteracted]);

  const featuredJob = filteredJobs[0] || null;
  const moreJobs = filteredJobs.slice(1);

  // Drawer handlers
  const handleOpenDrawer = useCallback(
    (jobId) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('job', jobId);
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const handleCloseDrawer = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('job');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // Apply handler
  const handleApply = useCallback(
    (job) => {
      if (!job) return;
      applyToJob(user?.id, job);
    },
    [user?.id]
  );

  const isFeaturedApplied = featuredJob
    ? isJobApplied(user?.id, featuredJob.id)
    : false;

  return (
    <div className="jobs-feed-page">
      <AppNav activeTab="jobs" />

      <main className="jobs-feed-main">
        <div className="jobs-feed-layout">
          {/* Left Column: Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Right Column: Feed Content */}
          <section className="jobs-feed-content" aria-label="Job matches">
            {/* Feed Header */}
            <header className="jobs-feed-header">
              <div className="jobs-feed-eyebrow">PERSONALISED FOR YOU</div>
              <div className="jobs-feed-title-row">
                <h1 className="jobs-feed-title">Your top matches</h1>
                <span className="jobs-feed-count" data-testid="jobs-feed-count">
                  {filteredJobs.length} roles found
                </span>
              </div>
              <p className="jobs-feed-subtitle">
                Based on your profile and preferences.
              </p>
            </header>

            {filteredJobs.length === 0 ? (
              /* Edge Case #1: Friendly Empty State */
              <div className="jobs-feed-empty" data-testid="jobs-feed-empty">
                <div className="jobs-feed-empty-icon" aria-hidden="true">
                  🔍
                </div>
                <h3 className="jobs-feed-empty-title">No matches found</h3>
                <p className="jobs-feed-empty-text">
                  No matches found for your criteria. Try loosening your filters or expanding your location.
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
                    isApplied={isFeaturedApplied}
                    onApply={handleApply}
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
        isOpen={Boolean(activeJob)}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
