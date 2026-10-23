# Review aggregate updates

`review-data.json` is the single manually verified baseline. Google is 4.9/5 from 40 reviews, confirmed by the owner on 2026-10-23. Facebook remains the previously published 94% recommendation / 344 reviews; it has not been newly verified. Run `node scripts/build-reviews.mjs` after changing the baseline. This generates the shared browser data and updates both Golden Hour widget pairs and all three review-page descriptions. `app.js` uses the shared data for every homepage and reviews widget, including both themes. Written reviews remain editorial content in `reviews.js`.

## Runtime and retention

The existing Worker serves `/review-data.js` and updates static Golden Hour HTML and review metadata from the same data. The campaign subdomain still serves `/golden-hour` at `/`, preserving query parameters. No API credentials reach the browser.

Authorized Google Business Profile `reviews.list` provides `averageRating` and `totalReviewCount` for a verified location. The sync fetches one review solely to obtain these aggregate fields; it neither saves nor logs review text. It validates the response before replacing Cloudflare KV key `google`. The runtime pins the source link to the Canada listing, independent of API output. A failed request leaves the last valid KV value intact. Legitimate count/rating decreases are allowed.

Google API content is never committed to Git, uploaded as a workflow artifact, or printed in logs. KV expires after 29 days; the Worker independently enforces the same limit. Missing, expired, malformed, or unavailable KV data falls back to the owner-supplied baseline. HTML and runtime JS use `Cache-Control: no-store`. This implements the temporary storage limit in Google's Business Profile policy. We use the authorized owner API rather than storing Places API content, which has different caching and attribution restrictions.

## Activate once

The existing repository has an active **Workers Builds: chaarbhai** integration. Publishing to `main` can deploy the baseline without a local Cloudflare login. KV provisioning and its binding still require Cloudflare account access.

1. Authenticate the existing Cloudflare account with `wrangler login` (Node 22+ required). Confirm that worker `chaarbhai` is the existing production site.
2. Create a KV namespace: `wrangler kv namespace create REVIEW_DATA`. Add it to `wrangler.jsonc` as `"kv_namespaces": [{"binding":"REVIEW_DATA","id":"ACTUAL_NAMESPACE_ID"}]`. The namespace ID is configuration, not a secret.
3. Run tests and `wrangler deploy --keep-vars`. Preserve the existing domains and routing; do not create a new Pages project. This initially publishes the owner-confirmed baseline and activates runtime KV reads.
4. In this repository's GitHub Actions secrets, set:
   - `CLOUDFLARE_ACCOUNT_ID`: the existing site's account ID.
   - `CLOUDFLARE_REVIEW_NAMESPACE_ID`: the namespace ID from step 2.
   - `CLOUDFLARE_API_TOKEN`: an account-restricted token with Workers KV Storage Edit for that account. Daily runs only update KV; they do not need deployment credentials.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: OAuth credentials from an approved Google Business Profile API project with the Google My Business API enabled.
   - `GOOGLE_REFRESH_TOKEN`: offline OAuth authorization from an owner/manager of the verified Canada listing, using `https://www.googleapis.com/auth/business.manage`. Use a production OAuth app configuration so a testing-mode refresh token does not expire after seven days. Never paste secrets into chat or commit them.
   - `GOOGLE_LOCATION_NAME`: the verified Canada resource `accounts/ACCOUNT_ID/locations/LOCATION_ID`, not a Maps CID or a Pakistan location. Verify the selected resource with the owner before enabling.
5. Merge/push the workflow onto the default branch (`main`) and enable Actions. Run **Sync review aggregates** manually once; inspect success and the public widgets, then set repository Actions variable `REVIEW_SYNC_ENABLED` to `true`. Until this variable is enabled, scheduled sync jobs are skipped; verification still runs. Thereafter it runs daily at 03:23 UTC / 08:23 Asia/Karachi. GitHub may delay scheduled runs; daily frequency keeps the aggregate reasonably current at very low API volume. GitHub can disable schedules on inactive public repositories after 60 days, so monitor workflow failure/disabled notifications.

Workflow failure leaves the site running with its last valid values. KV updates propagate to Cloudflare locations eventually (typically within about a minute); no full asset redeployment is needed for daily changes. Disconnect by removing the workflow schedule/secrets and revoking OAuth access; deleting KV immediately restores the manual baseline.

## Facebook

Advertiser or partner access alone does not establish access to Page reviews. No automated Facebook fetch is enabled. Meta's Page ratings documentation could not be retrieved (HTTP 429), so current field/permission availability remains unverified. Before implementing it, verify the app's current Graph API version, numeric Page ID, Page access token, Page tasks, required permissions (including whether `pages_read_user_content` and/or `pages_read_engagement` apply), and app review requirements in the official documentation and against the actual Page. Neither `overall_star_rating` nor `rating_count` establishes Facebook's displayed recommendation percentage. Do not convert stars to a percent, calculate a percent from an incomplete ratings page, or update the count independently of the recommendation figure. Once the displayed percentage and count are verified, update the baseline together and rebuild/deploy.

## Verification

`node --test worker.test.mjs scripts/reviews.test.mjs`

Tests cover routing and attribution preservation, stale/invalid data, legitimate decreases, Canada source identity, Facebook preservation, both Golden Hour widget pairs (including star fill and accessible labels), all review metadata, and shared data load order.

Official references:
- https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- https://developers.google.com/my-business/content/policies
- https://developers.google.com/maps/documentation/places/web-service/policies
- https://developers.facebook.com/docs/graph-api/reference/page/ratings/
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
