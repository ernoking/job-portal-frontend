function employerUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

// Called directly by the click handler: reserve the new tab before the first
// await, then navigate only after recording succeeds (or was already recorded).
export async function handoffToEmployer({ record, fallbackUrl, openWindow = () => window.open('about:blank', '_blank') }) {
  let tab;
  try {
    tab = openWindow();
    if (tab) tab.opener = null;
  } catch { tab = null; }
  try {
    let result;
    try { result = await record(); }
    catch (error) {
      if (error?.data?.error?.code !== 'ALREADY_APPLIED') throw error;
      result = { applyUrl: fallbackUrl };
    }
    const url = employerUrl(result?.applyUrl) || employerUrl(fallbackUrl);
    let opened = false;
    if (url && tab && !tab.closed) {
      try { tab.location.replace(url); opened = true; }
      catch { tab.close(); }
    } else if (tab && !tab.closed) tab.close();
    return { url, opened };
  } catch (error) {
    if (tab && !tab.closed) tab.close();
    throw error;
  }
}
