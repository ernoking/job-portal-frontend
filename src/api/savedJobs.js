import { getStoredSession } from '../auth/storage.js';

function getUserId(explicitUserId) {
  if (explicitUserId) return String(explicitUserId);
  try {
    const session = getStoredSession();
    return session?.user?.id ? String(session.user.id) : null;
  } catch {
    return null;
  }
}

function getStorageKey(userId) {
  const uid = getUserId(userId);
  return uid ? `matchwise_saved_jobs_${uid}` : 'matchwise_saved_jobs_anon';
}

export function getSavedJobs(userId) {
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isJobSaved(jobId, userId) {
  if (!jobId) return false;
  const list = getSavedJobs(userId);
  return list.some((j) => String(j.id) === String(jobId));
}

export function saveJob(job, userId) {
  if (!job || !job.id) return [];
  const list = getSavedJobs(userId);
  if (list.some((j) => String(j.id) === String(job.id))) {
    return list;
  }
  const updated = [job, ...list];
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('matchwise_saved_jobs_changed'));
  } catch {
    // storage unavailable fallback
  }
  return updated;
}

export function removeSavedJob(jobId, userId) {
  if (!jobId) return [];
  const list = getSavedJobs(userId);
  const updated = list.filter((j) => String(j.id) !== String(jobId));
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('matchwise_saved_jobs_changed'));
  } catch {
    // storage unavailable fallback
  }
  return updated;
}

export function toggleSaveJob(job, userId) {
  if (!job || !job.id) return false;
  if (isJobSaved(job.id, userId)) {
    removeSavedJob(job.id, userId);
    return false;
  } else {
    saveJob(job, userId);
    return true;
  }
}
