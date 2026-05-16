// ============================================================
// posts.js  (Person 2)
// ============================================================

import { fetchItems, fetchTopStoryIds, fetchNewStoryIds, fetchJobIds, getPage, timeAgo, throttle } from "./api.js";

const feedState = { currentFeed: "top", allIds: [], currentPage: 0, isLoading: false };

function buildStoryCard(item) {
  const card = document.createElement("div");
  card.className = "post-card";
  card.dataset.id = item.id;
  card.innerHTML = `
    <div class="post-meta">
      <span class="post-badge badge-story">Story</span>
      <span>▲ ${item.score || 0}</span>
      <span>${timeAgo(item.time)}</span>
    </div>
    <h2 class="post-title">
      ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>` : item.title}
    </h2>
    <div class="post-footer">
      <span>by <strong>${item.by}</strong></span>
      <button class="comments-btn" data-id="${item.id}">💬 ${item.descendants || 0} comments</button>
    </div>
    ${item.text ? `<div class="post-text">${item.text}</div>` : ""}
  `;
  return card;
}

function buildJobCard(item) {
  const card = document.createElement("div");
  card.className = "post-card";
  card.dataset.id = item.id;
  card.innerHTML = `
    <div class="post-meta">
      <span class="post-badge badge-job">Job</span>
      <span>${timeAgo(item.time)}</span>
    </div>
    <h2 class="post-title">
      ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>` : item.title}
    </h2>
    <div class="post-footer"><span>by <strong>${item.by}</strong></span></div>
    ${item.text ? `<div class="post-text">${item.text}</div>` : ""}
  `;
  return card;
}

function buildPollCard(item) {
  const card = document.createElement("div");
  card.className = "post-card";
  card.dataset.id = item.id;
  card.innerHTML = `
    <div class="post-meta">
      <span class="post-badge badge-poll">Poll</span>
      <span>▲ ${item.score || 0}</span>
      <span>${timeAgo(item.time)}</span>
    </div>
    <h2 class="post-title">${item.title}</h2>
    <div class="poll-options" id="poll-opts-${item.id}"></div>
    <div class="post-footer">
      <span>by <strong>${item.by}</strong></span>
      <button class="comments-btn" data-id="${item.id}">💬 ${item.descendants || 0} comments</button>
    </div>
  `;
  if (item.parts && item.parts.length > 0) {
    fetchItems(item.parts).then((parts) => {
      const container = card.querySelector(`#poll-opts-${item.id}`);
      parts.sort((a, b) => (b.score || 0) - (a.score || 0));
      parts.forEach((part) => {
        const opt = document.createElement("div");
        opt.className = "poll-option";
        opt.innerHTML = `<span>${part.text}</span><span>▲ ${part.score || 0}</span>`;
        container.appendChild(opt);
      });
    });
  }
  return card;
}

export function buildCard(item) {
  if (item.type === "story") return buildStoryCard(item);
  if (item.type === "job")   return buildJobCard(item);
  if (item.type === "poll")  return buildPollCard(item);
  return null;
}

async function loadNextPage() {
  if (feedState.isLoading) return;
  feedState.isLoading = true;

  const pageIds = getPage(feedState.allIds, feedState.currentPage);
  if (pageIds.length === 0) {
    const btn = document.getElementById("load-more-btn");
    btn.textContent = "No more posts";
    btn.disabled = true;
    feedState.isLoading = false;
    return;
  }

  const items = await fetchItems(pageIds);
  items.sort((a, b) => b.time - a.time);

  const list = document.getElementById("post-list");
  items.forEach((item) => {
    const card = buildCard(item);
    if (card) {
      card.querySelector(".comments-btn")?.addEventListener("click", () => window.openComments(item.id));
      list.appendChild(card);
    }
  });

  feedState.currentPage++;
  feedState.isLoading = false;
}

async function switchFeed(feedName) {
  feedState.currentFeed = feedName;
  feedState.allIds = [];
  feedState.currentPage = 0;
  feedState.isLoading = false;

  document.getElementById("post-list").innerHTML = "";
  const btn = document.getElementById("load-more-btn");
  btn.textContent = "Load More";
  btn.disabled = false;

  document.querySelectorAll(".feed-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.feed === feedName);
  });

  if (feedName === "top")  feedState.allIds = await fetchTopStoryIds();
  if (feedName === "new")  feedState.allIds = await fetchNewStoryIds();
  if (feedName === "jobs") feedState.allIds = await fetchJobIds();

  await loadNextPage();
}

export function initPostLoading() {
  document.getElementById("load-more-btn").addEventListener("click", loadNextPage);

  window.addEventListener("scroll", throttle(() => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
      loadNextPage();
    }
  }, 500));

  document.querySelectorAll(".feed-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchFeed(tab.dataset.feed));
  });

  switchFeed("top");
}