/**
 * Privacy-friendly client-side analytics
 * 
 * Tracks page views by calling /api/track on:
 * - Initial page load
 * - Page becomes visible (visibilitychange)
 * 
 * Debounced to prevent duplicate tracking on SPA navigations
 * No cookies, no localStorage, no PII
 */

(function () {
  // Track which paths we've already sent in this session (in-memory only)
  const tracked = new Set<string>();
  
  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 1000; // 1 second debounce

  function trackPageView() {
    const path = window.location.pathname;
    
    // Skip if already tracked in this session
    if (tracked.has(path)) {
      return;
    }

    // Mark as tracked
    tracked.add(path);

    // Send tracking request
    fetch(`/api/track?path=${encodeURIComponent(path)}`, {
      method: 'POST',
      // Use keepalive to ensure request completes even if page unloads
      keepalive: true,
    }).catch(err => {
      // Silent fail - analytics should never break the site
      console.debug('Analytics tracking failed:', err);
      // Remove from tracked set so it can retry
      tracked.delete(path);
    });
  }

  function scheduleTrack() {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Schedule new track
    debounceTimer = setTimeout(() => {
      trackPageView();
      debounceTimer = null;
    }, DEBOUNCE_MS);
  }

  // Track on initial load
  if (document.readyState === 'complete') {
    scheduleTrack();
  } else {
    window.addEventListener('load', scheduleTrack);
  }

  // Track when page becomes visible (handles back/forward navigation)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleTrack();
    }
  });

  // For SPA navigation (Astro view transitions / Swup)
  // Listen to astro:page-load event (Astro v3+)
  document.addEventListener('astro:page-load', scheduleTrack);
  
  // Also listen for swup:contentReplaced if using Swup
  document.addEventListener('swup:contentReplaced', scheduleTrack);
})();
