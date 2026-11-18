TMO HOLDER CHECKER — NETLIFY DEPLOY PACKAGE
=============================================

WHAT IT DOES
- Visitor pastes a public EVM wallet address.
- Shows current rank, TMO NFT quantity and top-percentile position.
- Share button opens an X post with the result, deployed site URL and @BigAbdulWeb3 mention.
- No wallet connection, sign-up, password, paid database or paid RPC provider.

FILES
- index.html — website
- netlify/functions/holder.js — secure server-side OpenSea API lookup
- netlify.toml — Netlify configuration
- package.json — project metadata / Node version

REQUIRED NETLIFY ENVIRONMENT VARIABLES
1. OPENSEA_API_KEY — create/get a key at https://docs.opensea.io/reference/api-keys
2. OPENSEA_COLLECTION_SLUG — exact slug from the collection URL.
   Example: https://opensea.io/collection/example-collection -> example-collection

The collection slug is configurable because the exact official TMO OpenSea URL/slug has not been confirmed here. Do not guess it. Keep your API key private; never paste it into index.html.

DEPLOY (RECOMMENDED: NETLIFY CLI)
Netlify's drag-and-drop manual deploy does not deploy this package's serverless function. Use the CLI:
1. Unzip this package.
2. Install Node.js 18+ from https://nodejs.org/
3. Open Terminal/Command Prompt in the unzipped folder.
4. Run: npm install -g netlify-cli
5. Run: netlify login
6. Run: netlify init (follow prompts to create/link a site from this folder)
7. Run: netlify env:set OPENSEA_API_KEY YOUR_ACTUAL_KEY
8. Run: netlify env:set OPENSEA_COLLECTION_SLUG YOUR_ACTUAL_COLLECTION_SLUG
9. Run: netlify deploy --prod
10. Open the production URL printed by Netlify and test with a wallet known to hold TMO.

If you already have a Netlify site, run `netlify link` in this folder first, then set both variables and deploy.

FREE-TIER NOTES
- Static HTML frontend + Netlify Function + OpenSea API.
- No paid database or RPC service.
- Netlify/OpenSea free-tier limits, availability and API-key policies can change; unlimited free usage is not guaranteed.
- Holder data is cached in warm function memory for five minutes. Serverless instances can have separate caches, so a cold start may fetch again.

RANKING DETAILS
- Reads up to 100 pages of 100 holders (10,000 addresses) per refresh.
- If the API has more records than this safety limit, found wallets still show NFT count but exact rank/percentile are withheld rather than showing a misleading rank.
- Rank is quantity descending; equal quantities are ordered by wallet address for a stable result.
- Top percentage = rank / total indexed holders x 100.
- If a wallet is not returned by OpenSea, the page reports zero TMO NFTs. This may mean it owns none or that OpenSea indexing has not caught up.
- OpenSea's holder index may lag transfers.
- This is a wallet checker only; it does not publish a public leaderboard.

TROUBLESHOOTING
- Setup incomplete: add both environment variables and redeploy.
- API key rejected: check key is valid and active.
- Collection not found: verify OPENSEA_COLLECTION_SLUG from the real collection URL.
- Rate limit: wait before retrying; avoid repeated rapid tests.
- Zero NFTs: verify the wallet and collection slug, then allow for indexing delay.
