// Minimal read-only Sanity client (public dataset, no token in the browser).
const PROJECT_ID = "op2qjg9p";
const DATASET = "production";
const API_VERSION = "2025-02-19";

// GROQ query through the API CDN. Params are passed as $name (JSON-encoded).
export async function sanityQuery(query, params = {}, { signal } = {}) {
  const url = new URL(`https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}`);
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(`$${key}`, JSON.stringify(value));
  // up to 3 tries (8 s timeout each) so a network hiccup doesn't leave the page empty
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Sanity request failed (${res.status})`);
      const { result } = await res.json();
      return result;
    } catch (err) {
      lastError = err;
      if (signal?.aborted) break;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

// Image CDN URL: exact size, cropped around the hotspot, served as WebP.
export function imageUrl(image, { width, height, quality = 80 }) {
  if (!image?.url) return "";
  const params = new URLSearchParams({ w: width, h: height, fit: "crop", fm: "webp", q: quality });
  if (image.hotspot) {
    params.set("crop", "focalpoint");
    params.set("fp-x", image.hotspot.x.toFixed(3));
    params.set("fp-y", image.hotspot.y.toFixed(3));
  }
  return `${image.url}?${params}`;
}
