// Vanilla JS mobile navigation - runs immediately without waiting for hydration
(function() {
  console.log('mobile-nav.js loaded');
  
  function initMobileNav() {
    console.log('initMobileNav called');
    const toggle = document.querySelector('.mobile-nav-toggle');
    const nav = document.getElementById('mobile-nav');
    const overlay = document.querySelector('[role="presentation"]');
    
    console.log('Toggle:', toggle, 'Nav:', nav, 'Overlay:', overlay);
    
    if (!toggle || !nav || !overlay) {
      console.log('Missing elements, retrying in 100ms...');
      setTimeout(initMobileNav, 100);
      return;
    }
    
    console.log('All elements found, attaching listeners');
    
    let isOpen = false;
    
    function toggleMenu(e) {
      console.log('toggleMenu called, isOpen:', isOpen);
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      isOpen = !isOpen;
      console.log('New isOpen state:', isOpen);
      
      // Update classes
      if (isOpen) {
        nav.classList.remove('transform-translate-x-full');
        overlay.classList.remove('bg-transparent', 'pointer-events-none');
        overlay.classList.add('pointer-events-auto');
        overlay.setAttribute('aria-hidden', 'false');
      } else {
        nav.classList.add('transform-translate-x-full');
        overlay.classList.add('bg-transparent', 'pointer-events-none');
        overlay.classList.remove('pointer-events-auto');
        overlay.setAttribute('aria-hidden', 'true');
      }
      
      // Update aria-expanded
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }
    
    function closeMenu(e) {
      console.log('closeMenu called');
      if (isOpen) {
        // Don't prevent default for links - let them navigate
        if (e && e.target && e.target.tagName !== 'A') {
          e.preventDefault();
          e.stopPropagation();
        }
        toggleMenu();
      }
    }
    
    // Add listeners
    toggle.addEventListener('click', toggleMenu);
    toggle.addEventListener('touchstart', toggleMenu, { passive: false });
    
    overlay.addEventListener('click', closeMenu);
    overlay.addEventListener('touchstart', closeMenu, { passive: false });
    
    // Close button
    const closeBtn = nav.querySelector('button');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
      closeBtn.addEventListener('touchstart', closeMenu, { passive: false });
    }
    
    // Close on link click - but let the link navigate first
    const links = nav.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        console.log('Link clicked:', link.href);
        // Don't prevent default - allow navigation
        // Just close the menu
        isOpen = false;
        nav.classList.add('transform-translate-x-full');
        overlay.classList.add('bg-transparent', 'pointer-events-none');
        overlay.classList.remove('pointer-events-auto');
        overlay.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
    
    console.log('Mobile nav initialized successfully');
  }
  
  // Run on load and after navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
  
  // Re-init after Astro page transitions
  document.addEventListener('astro:page-load', initMobileNav);
})();
