// LaunchIt Analytics Tracking Script
(function() {
  'use strict';

  // Get project ID from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-project-id]');
  const projectId = scriptTag?.getAttribute('data-project-id');

  if (!projectId) {
    console.warn('LaunchIt Analytics: No project ID found');
    return;
  }

  // Get or create session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('launchit_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('launchit_session_id', sessionId);
    }
    return sessionId;
  }

  const sessionId = getSessionId();
  const apiUrl = scriptTag?.src?.replace('/analytics.js', '') || window.location.origin;

  // Track event function
  function trackEvent(eventType, metadata) {
    const data = {
      projectId: projectId,
      event_type: eventType,
      metadata: metadata || {},
      session_id: sessionId
    };

    // Use sendBeacon for reliability (works even when page is closing)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(apiUrl + '/api/analytics/track', blob);
    } else {
      // Fallback to fetch
      fetch(apiUrl + '/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function(err) {
        console.error('Analytics tracking failed:', err);
      });
    }
  }

  // Track page view on load
  trackEvent('page_view', {
    url: window.location.href,
    referrer: document.referrer || 'direct',
    userAgent: navigator.userAgent
  });

  // Track button clicks
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
      trackEvent('button_click', {
        text: target.textContent?.trim(),
        href: target.href || null,
        id: target.id || null,
        className: target.className || null
      });
    }
  });

  // Track form submissions
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.tagName === 'FORM') {
      trackEvent('form_submit', {
        formId: form.id || null,
        formAction: form.action || null
      });
    }
  });

  // Track form abandonment (if user starts typing but doesn't submit)
  let formInteracted = false;
  document.addEventListener('input', function(e) {
    if (e.target.form && !formInteracted) {
      formInteracted = true;
      
      // Track abandonment if user leaves without submitting
      window.addEventListener('beforeunload', function() {
        if (formInteracted) {
          trackEvent('form_abandon', {
            formId: e.target.form.id || null
          });
        }
      });
    }
  });

  // Expose trackEvent globally for custom tracking
  window.trackEvent = trackEvent;

  console.log('LaunchIt Analytics initialized for project:', projectId);
})();


