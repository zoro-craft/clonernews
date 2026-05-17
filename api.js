const BASE_URL = "https://hacker-news.firebaseio.com/v0";
const ALGOLIA_BASE_URL = "https://hn.algolia.com/api/v1";
const ALGOLIA_HITS_PER_PAGE = 100;
const itemCache = {};

// Gets one item from Hacker News. It uses a cache so we do not fetch the same item twice.
export async function fetchItem(id) {
  if (itemCache[id]) {
    return itemCache[id];
  }

  try {
    const response = await fetch(`${BASE_URL}/item/${id}.json`);
    const item = await response.json();

    if (item) {
      itemCache[id] = item;
    }

    return item;
  } catch (error) {
    console.log("Could not fetch item", id, error);
    return null;
  }
}

// Gets many items by using fetchItem for each id.
export async function fetchItems(ids) {
  const items = await Promise.all(ids.map((id) => fetchItem(id)));
  return items.filter((item) => item !== null);
}

// Gets the ids for the selected feed from Algolia.
export async function fetchAlgoliaFeedIds(feedName) {
  const params = new URLSearchParams({
    hitsPerPage: ALGOLIA_HITS_PER_PAGE,
    tags: getAlgoliaTags(feedName),
  });

  const endpoint = feedName === "top" ? "search" : "search_by_date";

  try {
    const response = await fetch(`${ALGOLIA_BASE_URL}/${endpoint}?${params}`);
    const data = await response.json();
    return data.hits.map((hit) => Number(hit.objectID));
  } catch (error) {
    console.log("Could not fetch Algolia feed", error);
    return [];
  }
}

// Gets the ids for the selected feed.
export async function fetchFeedIds(feedName) {
  const algoliaIds = await fetchAlgoliaFeedIds(feedName);

  if (algoliaIds.length > 0) {
    return algoliaIds;
  }

  let endpoint = "topstories";

  if (feedName === "new") {
    endpoint = "newstories";
  }

  if (feedName === "jobs") {
    endpoint = "jobstories";
  }

  if (feedName === "polls") {
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}.json`);
    return await response.json();
  } catch (error) {
    console.log("Could not fetch feed", error);
    return [];
  }
}

// Maps our UI feed names to Algolia tags.
function getAlgoliaTags(feedName) {
  if (feedName === "new") {
    return "story";
  }

  if (feedName === "jobs") {
    return "job";
  }

  if (feedName === "polls") {
    return "poll";
  }

  return "front_page";
}

// Gets the live update ids from Hacker News.
export async function fetchLiveUpdates() {
  try {
    const response = await fetch(`${BASE_URL}/updates.json`);
    return await response.json();
  } catch (error) {
    console.log("Could not fetch live updates", error);
    return { items: [] };
  }
}

// Turns a big list of ids into one smaller page.
export function getPage(ids, pageNumber, pageSize) {
  const start = pageNumber * pageSize;
  const end = start + pageSize;
  return ids.slice(start, end);
}

// Shows a simple "time ago" text for a Hacker News unix time.
export function timeAgo(time) {
  const seconds = Math.floor(Date.now() / 1000) - time;

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  return `${Math.floor(seconds / 86400)}d ago`;
}
