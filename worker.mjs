const LANDING_HOST = 'goldenhour.chaarbhai.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === LANDING_HOST && url.pathname === '/' &&
        (request.method === 'GET' || request.method === 'HEAD')) {
      // Use the clean asset URL to avoid the .html canonicalization redirect.
      // Changing only the path keeps ad attribution query parameters intact.
      url.pathname = '/golden-hour';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};
