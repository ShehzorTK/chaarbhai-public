import { readFile, writeFile } from 'node:fs/promises';
import { browserData, updateHtml } from './review-core.mjs';
const seed = JSON.parse(await readFile(new URL('../review-data.json', import.meta.url)));
await writeFile(new URL('../review-data.js', import.meta.url), browserData(seed));
for (const file of ['reviews.html', 'golden-hour.html']) {
  const url = new URL(`../${file}`, import.meta.url);
  await writeFile(url, updateHtml(await readFile(url, 'utf8'), seed));
}
