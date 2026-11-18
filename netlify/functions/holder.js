const MAX_PAGES = 100;
const CACHE_MS = 5 * 60 * 1000;
let cache = null;
let cachedAt = 0;

function reply(statusCode, data) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    },
    body: JSON.stringify(data)
  };
}

async function loadHolders(slug, key) {
  const all = [];
  let cursor = null;
  let complete = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(
      `https://api.opensea.io/api/v2/collections/${encodeURIComponent(slug)}/holders`
    );

    url.searchParams.set("limit", "100");
    url.searchParams.set("sort_direction", "desc");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-api-key": key
      }
    });

    if (!res.ok) {
      const detail = await res.text();
      const msg = res.status === 401 || res.status === 403
        ? "OpenSea rejected the API key. Check that it is valid and active."
        : res.status === 404
        ? "OpenSea could not find this collection slug. Check OPENSEA_COLLECTION_SLUG in Netlify."
        : res.status === 429
        ? "OpenSea is rate-limiting requests. Wait a little and try again."
        : `OpenSea returned an error (${res.status}). ${detail.slice(0, 140)}`;

      const err = new Error(msg);
      err.statusCode = res.status === 429 ? 503 : 502;
      throw err;
    }

    const data = await res.json();
    const batch = Array.isArray(data.holders) ? data.holders : [];

    all.push(...batch);
    cursor = data.next || null;

    if (!cursor || batch.length === 0) {
      complete = true;
      break;
    }
  }

  if (!all.length) {
    const err = new Error("OpenSea returned no holder records for this collection.");
    err.statusCode = 502;
    throw err;
  }

  const unique = new Map();

  for (const h of all) {
    if (h.address && Number.isFinite(Number(h.quantity))) {
      unique.set(h.address.toLowerCase(), {
        address: h.address,
        quantity: Number(h.quantity)
      });
    }
  }

  const holders = [...unique.values()].sort(
    (a, b) =>
      b.quantity - a.quantity ||
      a.address.toLowerCase().localeCompare(b.address.toLowerCase())
  );

  return { holders, complete };
}

exports.handler = async (event) => {
  try {
    const address = (event.queryStringParameters?.address || "").trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return reply(400, { error: "Enter a valid EVM wallet address." });
    }

    const key = process.env.OPENSEA_API_KEY;
    const slug = process.env.OPENSEA_COLLECTION_SLUG;

    if (!key || !slug) {
      return reply(500, {
        error: "Setup incomplete. Add OPENSEA_API_KEY and OPENSEA_COLLECTION_SLUG in Netlify environment variables, then redeploy."
      });
    }

    if (!cache || Date.now() - cachedAt > CACHE_MS) {
      cache = await loadHolders(slug, key);
      cachedAt = Date.now();
    }

    const { holders, complete } = cache;
    const index = holders.findIndex(
      h => h.address.toLowerCase() === address.toLowerCase()
    );

    if (index < 0) {
      return reply(200, {
        address,
        rank: null,
        quantity: 0,
        topPercent: null,
        partialData: !complete
      });
    }

    const rank = index + 1;
    const quantity = holders[index].quantity;

    return reply(200, {
      address: holders[index].address,
      rank: complete ? rank : null,
      quantity,
      topPercent: complete
        ? Math.max(0.1, rank / holders.length * 100).toFixed(1)
        : null,
      partialData: !complete
    });

  } catch (e) {
    return reply(e.statusCode || 500, {
      error: e.message || "Unexpected server error. Try again."
    });
  }
};
