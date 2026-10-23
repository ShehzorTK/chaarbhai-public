import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { updateHtml } from './review-core.mjs';
const seed = JSON.parse(await readFile(new URL('../review-data.json', import.meta.url)));
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
