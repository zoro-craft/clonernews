// ============================================================
// api.js  (Person 1)
// ============================================================

const BASE_URL = "https://hacker-news.firebaseio.com/v0";
const itemCache = {};

export async function fetchItem(id) {
  if (itemCache[id]) return itemCache[id];
  try {
    const res = await fetch(`${BASE_URL}/item/${id}.json`);
    const item = await res.json();
    if (item) itemCache[id] = item;
    return item;
  } catch { return null; }
}

export async function fetchItems(ids) {
  const results = await Promise.all(ids.map(fetchItem));
  return results.filter(Boolean);
}

export async function fetchTopStoryIds() {
  try { return await (await fetch(`${BASE_URL}/topstories.json`)).json(); }
  catch { return []; }
}

export async function fetchNewStoryIds() {
  try { return await (await fetch(`${BASE_URL}/newstories.json`)).json(); }
  catch { return []; }
}

export async function fetchJobIds() {
  try { return await (await fetch(`${BASE_URL}/jobstories.json`)).json(); }
  catch { return []; }
}

export async function fetchLiveUpdates() {
  try { return await (await fetch(`${BASE_URL}/updates.json`)).json(); }
  catch { return { items: [] }; }
}

export function getPage(allIds, page, pageSize = 10) {
  return allIds.slice(page * pageSize, (page + 1) * pageSize);
}

export function timeAgo(unixTimestamp) {
  const s = Math.floor(Date.now() / 1000) - unixTimestamp;
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) { lastCall = now; fn(...args); }
  };
}