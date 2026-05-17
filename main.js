const feed    = document.getElementById("feed");
const banner  = document.getElementById("banner");
const spinner = document.getElementById("spinner");
const loadBtn = document.getElementById("load-btn");

let storyIds  = [];
let cursor    = 0;
let loading   = false;
let pendingIds = [];

const BATCH = 20;

async function init() {
    storyIds = await getNewStories();
    await loadMore();
    loadBtn.addEventListener("click", throttle(loadMore, 1000));
    startLivePolling((newIds) => {
        pendingIds = [...newIds, ...pendingIds];
        banner.textContent = `▲ ${pendingIds.length} new item(s) — click to load`;
        banner.style.display = "block";
    });
}

async function loadMore() {
    if (loading || cursor >= storyIds.length) return;
    loading = true;
    loadBtn.style.display = "none";
    spinner.style.display = "block";

    const items = await fetchItems(storyIds.slice(cursor, cursor + BATCH));
    cursor += BATCH;
    const cards = (await Promise.all(items.map(buildCard))).filter(Boolean);
    cards.forEach(c => feed.appendChild(c));

    spinner.style.display = "none";
    if (cursor < storyIds.length) loadBtn.style.display = "inline-block";
    loading = false;
}

banner.addEventListener("click", debounce(async () => {
    banner.style.display = "none";
    const ids = pendingIds.slice();
    pendingIds = [];

    const cards = (await Promise.all((await fetchItems(ids)).map(buildCard))).filter(Boolean);
    if (!cards.length) return;

    const before = window.scrollY;
    cards.forEach(c => feed.prepend(c));
    window.scrollTo(0, before + (feed.children[cards.length]?.offsetTop || 0));
}, 300));

feed.addEventListener("click", (e) => {
    const btn = e.target.closest(".comments-btn");
    if (!btn) return;
    const area = document.getElementById(`c-${btn.dataset.id}`);
    if (area) toggleComments(Number(btn.dataset.id), area);
});

init();