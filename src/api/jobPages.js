// Keep the server's ranking within each page and restore page order after retries.
export function flattenJobPages(pages) {
  const jobsById = new Map();
  for (const page of Object.keys(pages).map(Number).sort((a, b) => a - b)) {
    for (const job of pages[page]) {
      if (!jobsById.has(job.id)) jobsById.set(job.id, job);
    }
  }
  return [...jobsById.values()];
}
