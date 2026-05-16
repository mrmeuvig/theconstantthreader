#!/usr/bin/env node
/**
 * Fetches the latest Instagram post via Graph API and writes data/latest-post.json.
 *
 * Required GitHub secrets:
 *   INSTAGRAM_ACCESS_TOKEN — long-lived token from Meta (Instagram Graph API)
 *
 * Optional:
 *   INSTAGRAM_USER_ID — defaults to "me" for token owner
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "data", "latest-post.json");

const PROFILE = {
  username: "theconstantthreader",
  name: "Jessica Ormerod",
  url: "https://www.instagram.com/theconstantthreader/",
};

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const userId = process.env.INSTAGRAM_USER_ID || "me";

if (!token) {
  console.error("INSTAGRAM_ACCESS_TOKEN is not set.");
  process.exit(1);
}

const fields = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp",
  "children{media_type,media_url,thumbnail_url}",
].join(",");

const url = new URL(`https://graph.instagram.com/${userId}/media`);
url.searchParams.set("fields", fields);
url.searchParams.set("limit", "1");
url.searchParams.set("access_token", token);

const res = await fetch(url);
if (!res.ok) {
  const body = await res.text();
  console.error(`Instagram API error (${res.status}):`, body);
  process.exit(1);
}

const { data } = await res.json();
const raw = data?.[0];

if (!raw) {
  console.error("No media returned from Instagram.");
  process.exit(1);
}

function pickMediaUrl(item) {
  if (item.media_type === "VIDEO") {
    return item.thumbnail_url || item.media_url;
  }
  if (item.media_type === "CAROUSEL_ALBUM" && item.children?.data?.length) {
    const first = item.children.data[0];
    return first.media_type === "VIDEO"
      ? first.thumbnail_url || first.media_url
      : first.media_url;
  }
  return item.media_url;
}

const payload = {
  updatedAt: new Date().toISOString(),
  profile: PROFILE,
  post: {
    id: raw.id,
    caption: raw.caption || "",
    mediaType: raw.media_type,
    mediaUrl: pickMediaUrl(raw),
    permalink: raw.permalink,
    timestamp: raw.timestamp,
  },
};

writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote latest post ${raw.id} to ${OUT_PATH}`);
