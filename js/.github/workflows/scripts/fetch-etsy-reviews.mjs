// Fetch latest Etsy shop reviews and write to resources/data/reviews.json
// Requires repo secrets: ETSY_CLIENT_ID, ETSY_REFRESH_TOKEN, ETSY_SHOP_ID

import fs from "node:fs";
import path from "node:path";

const CLIENT_ID = process.env.ETSY_CLIENT_ID;
const REFRESH = process.env.ETSY_REFRESH_TOKEN;
const SHOP_ID = process.env.ETSY_SHOP_ID;

if (!CLIENT_ID || !REFRESH || !SHOP_ID) {
  console.error("Missing ETSY_CLIENT_ID, ETSY_REFRESH_TOKEN, or ETSY_SHOP_ID env.");
  process.exit(1);
}

const TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";
const API_HOST = "https://api.etsy.com";

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: REFRESH,
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`Token refresh failed: ${r.status} ${await r.text()}`);
  const json = await r.json();
  // access_token is returned with a numeric user_id prefix (e.g. "12345678.xxxxx") for v3
  // Use it as-is in the Authorization header.
  return json.access_token;
}

async function fetchReviews(accessToken) {
  // Pull a page of recent reviews. Increase limit if needed (max per docs may vary).
  const url = `${API_HOST}/v3/application/shops/${encodeURIComponent(SHOP_ID)}/reviews?limit=50`;
  const r = await fetch(url, {
    headers: {
      "x-api-key": CLIENT_ID,
      authorization: `Bearer ${accessToken}`,
    },
  });
  if (!r.ok) throw new Error(`Reviews fetch failed: ${r.status} ${await r.text()}`);
  const data = await r.json();

  // Try to normalize results across possible shapes
  const arr = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
  const toListingUrl = (id) => (id ? `https://www.etsy.com/listing/${id}` : "");

  const mapped = arr.map((it) => {
    // best-effort field guesses with fallbacks
    const text = it.review || it.review_message || it.message || it.body || "";
    const rating = it.rating || it.stars || 0;
    const when = it.create_timestamp || it.created_timestamp || it.created_at || it.date || null;
    const dateISO = typeof when === "number" ? new Date(when * 1000).toISOString().slice(0, 10)
                   : (typeof when === "string" ? when.slice(0, 10) : null);
    const author = it.reviewer_display_name || it.buyer_display_name || it.user_name || "Anonymous";
    const avatar = it.reviewer_avatar_url || it.avatar_url || "";
    const listingId = it.listing_id || (it.transaction && it.transaction.listing_id);
    return {
      author,
      avatar: avatar || `resources/img/cust/${(Math.floor(Math.random()*4)+1)}.png`,
      rating,
      text,
      date: dateISO || new Date().toISOString().slice(0,10),
      listing_url: toListingUrl(listingId),
    };
  }).filter(r => r.text && r.text.trim().length > 0);

  // Sort newest first (ISO date desc if present)
  mapped.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return mapped;
}

(async () => {
  try {
    const token = await getAccessToken();
    const reviews = await fetchReviews(token);
    const outPath = path.join("resources", "data", "reviews.json");
    fs.writeFileSync(outPath, JSON.stringify(reviews, null, 2));
    console.log(`Wrote ${reviews.length} reviews to ${outPath}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
