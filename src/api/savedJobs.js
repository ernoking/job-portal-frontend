const STORAGE_KEY = 'matchwise_saved_jobs';

export function getSavedJobs() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isJobSaved(jobId) {
  if (!jobId) return false;
  const list = getSavedJobs();
  return list.some((j) => String(j.id) === String(jobId));
}

export function saveJob(job) {
  if (!job || !job.id) return [];
  const list = getSavedJobs();
  if (list.some((j) => String(j.id) === String(job.id))) {
    return list;
  }
  const updated = [job, ...list];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('matchwise_saved_jobs_changed'));
  } catch {
    // storage unavailable fallback
  }
  return updated;
}

export function removeSavedJob(jobId) {
  if (!jobId) return [];
  const list = getSavedJobs();
  const updated = list.filter((j) => String(j.id) !== String(jobId));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('matchwise_saved_jobs_changed'));
  } catch {
    // storage unavailable fallback
  }
  return updated;
}

export function toggleSaveJob(job) {
  if (!job || !job.id) return false;
  if (isJobSaved(job.id)) {
    removeSavedJob(job.id);
    return false;
  } else {
    saveJob(job);
    return true;
  }
}
