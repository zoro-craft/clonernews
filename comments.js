// ============================================================
// comments.js  (Person 3)
// ============================================================

import { fetchItem, fetchItems, fetchLiveUpdates, timeAgo } from "./api.js";
import { buildCard } from "./posts.js";

let currentPostId = null;
let seenLiveIds = new Set();
let newLiveItemIds = [];

export async function openComments(postId) {
  currentPostId = postId;

  const post = await fetchItem(postId);
  if (!post) return;

  const panel = document.getElementById("comment-panel");
  const title = document.getElementById("comment-panel-title");
  const list  = document.getElementById("comment-list");

  title.textContent = post.title || "Comments";
  list.innerHTML = "";
  panel.classList.add("open");

  if (!post.kids || post.kids.length === 0) return;

  const comments = await fetchItems(post.kids);
  comments.sort((a, b) => b.time - a.time);
  comments.forEach((comment) => {
    if (!comment.deleted && !comment.dead) list.appendChild(buildCommentElement(comment));
  });
}

function closeComments() {
  document.getElementById("comment-panel").classList.remove("open");
  currentPostId = null;
}

function buildCommentElement(comment) {
  const el = document.createElement("div");
  el.className = "comment";
  el.dataset.id = comment.id;
  el.innerHTML = `
    <div class="comment-header">
      <strong class="comment-by">${comment.by || "[deleted]"}</strong>
      <span>${timeAgo(comment.time)}</span>
    </div>
    <div class="comment-text">${comment.text || ""}</div>
  `;
  return el;
}

async function checkForLiveUpdates() {
  const updates = await fetchLiveUpdates();
  if (!updates?.items) return;

  const freshIds = updates.items.filter((id) => !seenLiveIds.has(id));
  updates.items.forEach((id) => seenLiveIds.add(id));
  if (freshIds.length === 0) return;

  const freshItems = await fetchItems(freshIds);
  const freshPosts = freshItems.filter((item) => item?.title);
  if (freshPosts.length === 0) return;

  newLiveItemIds = freshIds;
  const banner = document.getElementById("live-banner");
  document.getElementById("live-banner-msg").textContent = `${freshPosts.length} new item${freshPosts.length === 1 ? "" : "s"} available`;
  banner.style.display = "flex";
}

async function mergeLiveItems() {
  document.getElementById("live-banner").style.display = "none";
  if (newLiveItemIds.length === 0) return;

  const items = await fetchItems(newLiveItemIds);
  newLiveItemIds = [];
  items.sort((a, b) => b.time - a.time);

  const list = document.getElementById("post-list");
  items.forEach((item) => {
    if (!item?.title || list.querySelector(`[data-id="${item.id}"]`)) return;
    const card = buildCard(item);
    if (card) {
      card.querySelector(".comments-btn")?.addEventListener("click", () => openComments(item.id));
      list.insertBefore(card, list.firstChild);
    }
  });
}

export function initCommentsAndLive() {
  document.getElementById("close-comments-btn").addEventListener("click", closeComments);
  document.getElementById("live-banner-action").addEventListener("click", mergeLiveItems);
  document.getElementById("live-banner-dismiss").addEventListener("click", () => {
    document.getElementById("live-banner").style.display = "none";
  });

  checkForLiveUpdates();
  setInterval(checkForLiveUpdates, 5000);
}