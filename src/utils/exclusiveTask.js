// Acquire synchronously, before React renders disabled controls. Dropped actions
// are not queued: retrying retrieval must never start generation later by itself.
export function createExclusiveTask() {
  let busy = false;
  return async function run(task) {
    if (busy) return false;
    busy = true;
    try {
      await task();
      return true;
    } finally {
      busy = false;
    }
  };
}
