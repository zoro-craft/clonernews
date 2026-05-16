import { fetchItem, fetchItems, fetchLiveUpdates, timeAgo } from "./api.js";
import { addPostToPage } from "./posts.js";

let seenLiveIds = new Set();
let liveIdsWaiting = [];

// Starts the comment panel and the live update checker.
export function initCommentsAndLive() {
  document.getElementById("close-comments-btn").addEventListener("click", closeComments);
  document.getElementById("show-live-btn").addEventListener("click", showLivePosts);
  document.getElementById("hide-live-btn").addEventListener("click", hideLiveBanner);

  checkLiveUpdates();
  setInterval(checkLiveUpdates, 5000);
}

// Opens the side panel and loads the comments for one post.
export async function openComments(postId) {
  const post = await fetchItem(postId);

  if (!post) {
    return;
  }

  document.getElementById("comment-title").textContent = post.title || "Comments";
  document.getElementById("comment-list").innerHTML = "Loading comments...";
  document.getElementById("comment-panel").classList.add("open");

  if (!post.kids || post.kids.length === 0) {
    document.getElementById("comment-list").innerHTML = "No comments yet.";
    return;
  }

  const comments = await fetchItems(post.kids);
  comments.sort((a, b) => b.time - a.time);
  showComments(comments);
}

// Closes the comment panel.
function closeComments() {
  document.getElementById("comment-panel").classList.remove("open");
}

// Shows all comments in the panel.
function showComments(comments) {
  const list = document.getElementById("comment-list");
  list.innerHTML = "";

  comments.forEach((comment) => {
    if (!comment.deleted && !comment.dead) {
      list.appendChild(makeComment(comment));
    }
  });

  if (list.children.length === 0) {
    list.innerHTML = "No visible comments.";
  }
}

// Builds one comment element.
function makeComment(comment) {
  const element = document.createElement("article");
  element.className = "comment";

  element.innerHTML = `
    <div class="comment-info">
      <strong>${comment.by || "unknown"}</strong>
      <span>${timeAgo(comment.time)}</span>
    </div>
    <div class="comment-text">${comment.text || ""}</div>
  `;

  return element;
}

// Checks Hacker News for live updates every few seconds.
async function checkLiveUpdates() {
  const updates = await fetchLiveUpdates();

  if (!updates.items) {
    return;
  }

  const newIds = updates.items.filter((id) => !seenLiveIds.has(id));
  updates.items.forEach((id) => seenLiveIds.add(id));

  if (newIds.length === 0) {
    return;
  }

  liveIdsWaiting = newIds;
  document.getElementById("live-message").textContent = `${newIds.length} live update(s) found`;
  document.getElementById("live-banner").style.display = "flex";
}

// Adds the newest live posts to the top of the feed.
async function showLivePosts() {
  hideLiveBanner();

  const items = await fetchItems(liveIdsWaiting);
  items.sort((a, b) => b.time - a.time);
  items.reverse().forEach((item) => addPostToPage(item, true));

  liveIdsWaiting = [];
}

// Hides the live update banner.
function hideLiveBanner() {
  document.getElementById("live-banner").style.display = "none";
}
