/* Reporting interactions only: never read form fields or pass visitor-entered text. */
(function () {
  'use strict';
  if (!/^(www\.|goldenhour\.)?chaarbhai\.com$/.test(location.hostname)) return;
  var golden = location.hostname === 'goldenhour.chaarbhai.com';
  var source = golden ? 'golden_hour' : 'main_site';
  var seenForms = new WeakSet();
  function enabled() { return !!window.CB_GA && typeof window.gtag === 'function'; }
  function send(name, params) {
    if (enabled()) window.gtag('event', name, Object.assign({enquiry_source: source}, params));
  }
  function markForm() {
    if (!enabled()) return;
    document.cookie = 'cb_ga_enquiry=' + source + '; Domain=.chaarbhai.com; Path=/; Max-Age=7200; SameSite=Lax; Secure';
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || !enabled()) return;
      var frame = entry.target;
      // Main-site iframe is preloaded and parked offscreen until Contact opens.
      if (frame.closest('[inert], .parked, [aria-hidden="true"]')) return;
      markForm();
      if (!seenForms.has(frame)) {
        seenForms.add(frame);
        send('enquiry_form_view');
      }
    });
  }, {threshold: 0.1});
  function watchForms() {
    document.querySelectorAll('iframe[src*="app.studioninja.co/contactform/"]').forEach(function (frame) {
      observer.unobserve(frame);
      observer.observe(frame);
    });
  }
  new MutationObserver(watchForms).observe(document.body, {childList: true, subtree: true});
  window.addEventListener('cb:analytics-ready', watchForms);
  window.addEventListener('cb:pageview', watchForms);
  watchForms();
  document.addEventListener('click', function (event) {
    var el = event.target.closest && event.target.closest('a,button');
    if (!el || !enabled()) return;
    var href = el.getAttribute('href') || '';
    if ((!golden && /^(?:\/?contact(?:[?#]|$)|#contact$)/.test(href)) || (golden && href === '#enquire')) {
      markForm();
      if (!golden) send('contact_cta_click', {cta: (el.textContent || '').trim().slice(0, 40)});
    }
    if (/^mailto:/i.test(href)) send('contact_link_click', {contact_method: 'email'});
    else if (/^tel:/i.test(href)) send('contact_link_click', {contact_method: 'phone'});
    else if (/^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(href)) send('contact_link_click', {contact_method: 'whatsapp'});
    else if (/^https:\/\/app\.studioninja\.co\/contactform\//.test(href)) {
      markForm(); send('enquiry_form_open');
    }
    if (golden && el.hasAttribute('data-open')) send('gallery_open', {gallery: el.getAttribute('data-open')});
  });
})();
