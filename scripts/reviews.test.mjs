import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { validGoogle, selectData, updateHtml, MAX_AGE } from './review-core.mjs';
const seed = JSON.parse(await readFile(new URL('../review-data.json', import.meta.url)));
test('malformed, missing, out of range and expired provider data retain manual values', () => {
  const now = Date.now();
  for (const google of [null, {}, { rating: 6, count: 40 }, { rating: '4.9', count: 40 }, { rating: 4.9, count: -1 }, { rating: 4.9, count: 1.2 }]) {
    assert.ok(!validGoogle(google));
    assert.equal(selectData(seed, { google, fetchedAt: new Date(now).toISOString() }, now), seed);
  }
  for (const age of [MAX_AGE, MAX_AGE + 1, -1000]) {
    assert.equal(selectData(seed, { google: { rating: 5, count: 42 }, fetchedAt: new Date(now - age).toISOString() }, now), seed);
  }
});
test('fresh aggregates accept legitimate decreases, preserve Canada URL and Facebook', () => {
  const data = selectData(seed, { google: { rating: 4.7, count: 39, url: 'wrong listing' }, fetchedAt: new Date().toISOString() });
  assert.equal(data.google.rating, 4.7);
  assert.equal(data.google.count, 39);
  assert.equal(data.google.url, seed.google.url);
  assert.deepEqual(data.meta, seed.meta);
});
test('both Golden Hour pairs and all review metadata change together, without changing written reviews', async () => {
  const golden = await readFile(new URL('../golden-hour.html', import.meta.url), 'utf8');
  const updated = updateHtml(golden, { google: { ...seed.google, rating: 4.7, count: 41 }, meta: { ...seed.meta, recommend: 93, count: 345 } });
  assert.equal((updated.match(/Rated 4.7 out of 5 from 41 reviews/g) || []).length, 2);
  assert.equal((updated.match(/Based on 41 reviews/g) || []).length, 2);
  assert.equal((updated.match(/width:94%/g) || []).length, 2);
  assert.equal((updated.match(/93% recommend, from 345 reviews/g) || []).length, 2);
  assert.equal(updateHtml(golden, seed), golden);
  const reviews = updateHtml(await readFile(new URL('../reviews.html', import.meta.url), 'utf8'), { ...seed, google: { ...seed.google, rating: 5, count: 42 } });
  assert.equal((reviews.match(/5.0 out of 5 from 42 Google reviews/g) || []).length, 3);
});
test('every app entrypoint loads shared aggregate data before the app', async () => {
  const { readdir } = await import('node:fs/promises');
  for (const file of await readdir(new URL('../', import.meta.url))) {
    if (!file.endsWith('.html')) continue;
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    if (html.includes('<script src="app.js')) assert.ok(html.indexOf('src="review-data.js"') < html.indexOf('src="app.js'), file);
  }
  const context = { window: {} };
  vm.runInNewContext(await readFile(new URL('../review-data.js', import.meta.url), 'utf8'), context);
  assert.equal(JSON.stringify(context.window.CB_REVIEW_DATA), JSON.stringify(seed));
});

test('sync publishes only validated aggregates, preserving data on API failures', async () => {
  const { syncReviews } = await import('./sync-reviews.mjs');
  const env = Object.fromEntries(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_REVIEW_NAMESPACE_ID'].map(key => [key, 'test-secret']));
  env.GOOGLE_LOCATION_NAME = 'accounts/123/locations/456';
  for (const scenario of ['success', 'invalid', 'auth-error']) {
    const calls = [];
    await (async () => {
      const run = syncReviews(env, async (url, options) => {
        calls.push({ url, options });
        if (url.includes('oauth2')) return new Response(JSON.stringify({ access_token: 'test-token' }), { status: scenario === 'auth-error' ? 401 : 200 });
        if (url.includes('mybusiness')) return Response.json({ averageRating: scenario === 'invalid' ? 9 : 4.95, totalReviewCount: 42, reviews: [{ reviewText: 'PRIVATE REVIEW TEXT' }] });
        return Response.json({ success: true });
      });
      if (scenario === 'success') await run;
      else await assert.rejects(run);
    })();
    const writes = calls.filter(call => call.options.method === 'PUT');
    assert.equal(writes.length, scenario === 'success' ? 1 : 0);
    if (writes.length) {
      const payload = JSON.parse(writes[0].options.body);
      assert.deepEqual(payload.google, { rating: 4.95, count: 42 });
      assert.ok(!writes[0].options.body.includes('PRIVATE'));
      assert.match(writes[0].url, /expiration_ttl=2505600$/);
    }
  }
});
