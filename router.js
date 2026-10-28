/* Public URLs are real HTML pages. Internal view names remain private to app.js. */
(function () {
  const publicPaths = {'/portfolio':'/work','/services':'/prices','/testimonials':'/reviews'};
  const internalPaths = {'/work':'/portfolio','/prices':'/services','/reviews':'/testimonials'};
  const pages = new Set(['/','/work','/about','/prices','/reviews','/contact','/privacy','/terms','/refunds']);
  function cleanURL(value) {
    const url = new URL(value, location.origin);
    // Also recover old links such as /about#/about and /#/#/portfolio.
    if (/^#\//.test(url.hash)) {
      const fragment = url.hash.split('#').filter(Boolean).pop();
      if (fragment && fragment.startsWith('/')) url.pathname = fragment;
      url.hash = '';
    }
    url.pathname = url.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    if (url.pathname === '/index') url.pathname = '/';
    const work = /^\/(?:portfolio|work)\/(photos|films|videos)(?:\/([\w-]+))?$/.exec(url.pathname);
    if (work) {
      url.pathname = '/work';
      if (work[1] === 'photos') {
        url.searchParams.delete('view'); url.searchParams.delete('v');
        if (work[2]) url.searchParams.set('chapter', work[2]);
      } else {
        url.searchParams.delete('chapter'); url.searchParams.set('view', 'films');
        if (work[2]) url.searchParams.set('v', work[2]);
      }
    }
    url.pathname = publicPaths[url.pathname] || url.pathname;
    // Retain old film share links, including those issued from the homepage.
    if (/^(films|videos)$/.test(url.searchParams.get('view') || '')) {
      url.pathname = '/work'; url.searchParams.set('view', 'films');
    }
    return url;
  }
  function internalPath() {
    const url = cleanURL(location.href);
    if (url.pathname === '/work') {
      if (url.searchParams.get('view') === 'films') {
        const id = url.searchParams.get('v');
        return '/portfolio/films' + (id && /^[\w-]+$/.test(id) ? '/' + id : '');
      }
      const chapter = url.searchParams.get('chapter');
      if (chapter && /^[\w-]+$/.test(chapter)) return '/portfolio/photos/' + chapter;
    }
    return internalPaths[url.pathname] || url.pathname;
  }
  function navigate(value, replace = false, notify = true) {
    const url = cleanURL(value);
    if (url.origin !== location.origin || !pages.has(url.pathname)) return false;
    const target = url.pathname + url.search + url.hash;
    if (target !== location.pathname + location.search + location.hash) {
      history[replace ? 'replaceState' : 'pushState'](null, '', target);
      if (notify) dispatchEvent(new Event('cb-route-change'));
    }
    return true;
  }
  window.CB_ROUTER = {cleanURL, internalPath, navigate};
  navigate(location.href, true, false);
  addEventListener('popstate', () => dispatchEvent(new Event('cb-route-change')));
  addEventListener('hashchange', () => {
    if (location.hash.startsWith('#/')) navigate(location.href, true);
  });
})();
