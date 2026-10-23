import { validGoogle } from './review-core.mjs';
import { pathToFileURL } from 'node:url';
export async function syncReviews(env = process.env, fetcher = fetch) {
const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_LOCATION_NAME', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_REVIEW_NAMESPACE_ID'];
const missing = required.filter(key => !env[key]);
if (missing.length) throw new Error(`Missing GitHub Actions secrets: ${missing.join(', ')}`);
if (!/^accounts\/\d+\/locations\/\d+$/.test(env.GOOGLE_LOCATION_NAME)) throw new Error('Invalid verified Google location resource name');
async function json(url, options = {}) {
  const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(30000) });
  // Never log provider response bodies: they can contain credentials or review text.
  if (!response.ok) throw new Error(`Provider request failed (HTTP ${response.status})`);
  return response.json();
}
const token = await json('https://oauth2.googleapis.com/token', {
  method: 'POST', body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' })
});
if (typeof token.access_token !== 'string') throw new Error('Google did not return an access token');
const result = await json(`https://mybusiness.googleapis.com/v4/${env.GOOGLE_LOCATION_NAME}/reviews?pageSize=1`, {
  headers: { Authorization: `Bearer ${token.access_token}` }
});
const google = { rating: result.averageRating, count: result.totalReviewCount };
if (!validGoogle(google)) throw new Error('Invalid Google aggregate; published values preserved');
const cf = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/storage/kv/namespaces/${encodeURIComponent(env.CLOUDFLARE_REVIEW_NAMESPACE_ID)}/values/google?expiration_ttl=${29 * 86400}`;
const saved = await json(cf, {
  method: 'PUT', headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'text/plain' },
  body: JSON.stringify({ google, fetchedAt: new Date().toISOString() })
});
if (saved.success !== true) throw new Error('Cloudflare rejected the update; published values preserved');
console.log('Google aggregate validated and published to the existing Cloudflare Worker data store. Facebook preserved.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await syncReviews();
