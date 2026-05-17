// PERSON 1 - api.js

const API = "https://hacker-news.firebaseio.com/v0";
const cache = {};

// Debounce: delays execution until after `ms` ms of silence
function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Throttle: ensures fn runs at most once every `ms` ms
function throttle(fn, ms) {
    let last = 0;
    return (...args) => {
        const now = Date.now();
        if (now - last >= ms) { last = now; fn(...args); }
    };
}

// Fetch one item by ID, use cache if already loaded
async function fetchItem(id) {
    if (cache[id]) return cache[id];
    try {
        const res = await fetch(`${API}/item/${id}.json`);
        const data = await res.json();
        if (data) cache[id] = data;
        return data;
    } catch { return null; }
}

// Fetch a list of items by an array of IDs in parallel
async function fetchItems(ids) {
    return Promise.all(ids.map(id => fetchItem(id)));
}

// Get the full list of new story IDs (up to 500), newest first
async function getNewStories() {
    const res = await fetch(`${API}/newstories.json`);
    return res.json();
}

// Poll live data — throttled so the check never fires faster than every 5s
function startLivePolling(onNew) {
    let knownMax = null;

    const check = throttle(async () => {
        const res = await fetch(`${API}/maxitem.json`);
        const max = await res.json();
        if (!knownMax) { knownMax = max; return; }
        if (max > knownMax) {
            const newIds = [];
            for (let i = knownMax + 1; i <= max; i++) newIds.push(i);
            knownMax = max;
            onNew(newIds);
        }
    }, 5000);

    check();
    setInterval(check, 5000);
}