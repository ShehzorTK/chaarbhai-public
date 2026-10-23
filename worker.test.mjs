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
