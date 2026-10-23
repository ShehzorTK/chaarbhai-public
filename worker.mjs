import seed from './review-data.json' with { type: 'json' };
import { browserData, selectData, updateHtml } from './scripts/review-core.mjs';
const LANDING_HOST = 'goldenhour.chaarbhai.com';
async function currentData(env) {
  try { return selectData(seed, await env.REVIEW_DATA?.get('google', 'json')); }
  catch { return seed; }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/review-data.js' && ['GET', 'HEAD'].includes(request.method)) {
      return new Response(request.method === 'HEAD' ? null : browserData(await currentData(env)), {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
    if (url.hostname === LANDING_HOST && url.pathname === '/' &&
        (request.method === 'GET' || request.method === 'HEAD')) {
      // Keep campaign attribution parameters and the existing clean asset route.
      url.pathname = '/golden-hour';
      request = new Request(url, request);
    }
    const response = await env.ASSETS.fetch(request);
    if (request.method !== 'GET' || !response.headers.get('content-type')?.includes('text/html')) return response;
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    headers.delete('Content-Length');
    headers.delete('ETag');
    return new Response(updateHtml(await response.text(), await currentData(env)), {
      status: response.status, statusText: response.statusText, headers
    });
  }
};
