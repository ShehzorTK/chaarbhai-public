import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.mjs';

async function resolve(url, method = 'GET') {
  let forwarded;
  const assetResponse = new Response('asset response');
  const result = await worker.fetch(new Request(url, { method }), {
    ASSETS: { fetch(request) { forwarded = request; return assetResponse; } }
  });
  assert.equal(result, assetResponse);
  return forwarded;
}

test('landing hostname root serves the landing asset without changing attribution', async () => {
  const request = await resolve('https://goldenhour.chaarbhai.com/?utm_source=facebook&utm_campaign=golden%20hour&fbclid=test123');
  assert.equal(request.url, 'https://goldenhour.chaarbhai.com/golden-hour?utm_source=facebook&utm_campaign=golden%20hour&fbclid=test123');
});

test('HEAD requests use the same landing route', async () => {
  const request = await resolve('https://goldenhour.chaarbhai.com/', 'HEAD');
  assert.equal(request.method, 'HEAD');
  assert.equal(new URL(request.url).pathname, '/golden-hour');
});

test('other hostnames, asset paths, existing pages and non-read requests pass through', async () => {
  for (const [url, method] of [
    ['https://test.chaarbhai.com/', 'GET'],
    ['https://chaarbhai.blbtms.workers.dev/', 'GET'],
    ['https://goldenhour.chaarbhai.com/reviews.js', 'GET'],
    ['https://goldenhour.chaarbhai.com/photos/example.webp', 'GET'],
    ['https://goldenhour.chaarbhai.com/index.html', 'GET'],
    ['https://test.chaarbhai.com/golden-hour', 'GET'],
    ['https://goldenhour.chaarbhai.com/', 'POST']
  ]) {
    const forwarded = await resolve(url, method);
    assert.equal(forwarded.url, url);
    assert.equal(forwarded.method, method);
  }
});

test('runtime JS uses KV and falls back safely on unavailable storage', async () => {
  const request = new Request('https://goldenhour.chaarbhai.com/review-data.js');
  const response = await worker.fetch(request, { REVIEW_DATA: { get: async () => ({ google: { rating: 5, count: 42 }, fetchedAt: new Date().toISOString() }) } });
  assert.match(await response.text(), /"rating":5,"count":42/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const fallback = await worker.fetch(request, { REVIEW_DATA: { get() { throw new Error('storage unavailable'); } } });
  assert.match(await fallback.text(), /"rating":4.9,"count":40/);
});

test('server-rendered metadata uses the same runtime data as widgets', async () => {
  const response = await worker.fetch(new Request('https://chaarbhai.com/reviews'), {
    ASSETS: { fetch: async () => new Response('<meta data-review-description name="description" content="old">', { headers: { 'Content-Type': 'text/html', ETag: 'old' } }) },
    REVIEW_DATA: { get: async () => ({ google: { rating: 5, count: 42 }, fetchedAt: new Date().toISOString() }) }
  });
  assert.match(await response.text(), /5.0 out of 5 from 42 Google reviews/);
  assert.equal(response.headers.get('etag'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
