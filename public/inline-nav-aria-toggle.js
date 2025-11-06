// Defensive non-module script to synchronously toggle aria-expanded on .mobile-nav-toggle
// This runs as a classic script (not a module) and executes early in page load.
(function () {
  try {
    function handler(ev) {
      try {
        var el = ev.target && ev.target.closest && ev.target.closest('.mobile-nav-toggle');
        if (!el) return;
        var cur = el.getAttribute('aria-expanded');
        el.setAttribute('aria-expanded', (cur === 'true' ? 'false' : 'true'));
      } catch (err) {
        /* ignore per-click errors */
      }
    }

    // Use capture phase so we see the click even if event.stopPropagation is used downstream
    document.addEventListener('click', handler, true);

    // Expose a flag for diagnostics
    try { window.__inlineNavAriaToggle = true; } catch (e) {}
  } catch (e) {
    // non-blocking
  }
})();
