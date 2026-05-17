import { fetchFeedIds, fetchItems, getPage, timeAgo } from "./api.js";

const PAGE_SIZE = 10;

let currentFeed = "top";
let allPostIds = [];
let currentPage = 0;
let isLoading = false;
let openCommentsFunction = null;

// Starts the post feed and connects the buttons to their events.
export function initPosts(openComments) {
  openCommentsFunction = openComments;

  document.getElementById("load-more-btn").addEventListener("click", loadMorePosts);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      changeFeed(tab.dataset.feed);
    });
  });

  changeFeed("top");
}

// Changes between Top, New, Jobs, and Polls.
async function changeFeed(feedName) {
  currentFeed = feedName;
  currentPage = 0;
  allPostIds = [];

  document.getElementById("post-list").innerHTML = "";
  setStatus("Loading posts...");
  setLoadButton(true, "Loading...");

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.feed === feedName);
  });

  allPostIds = await fetchFeedIds(currentFeed);

  setStatus("");
  setLoadButton(false, "Load more");
  loadMorePosts();
}

// Loads the next small group of posts.
async function loadMorePosts() {
  if (isLoading) {
    return;
  }

  isLoading = true;
  setStatus("Loading posts...");
  setLoadButton(true, "Loading...");

  const idsForPage = getPage(allPostIds, currentPage, PAGE_SIZE);

  if (idsForPage.length === 0) {
    setStatus("No more posts.");
    setLoadButton(true, "No more posts");
    isLoading = false;
    return;
  }

  const posts = await fetchItems(idsForPage);
  posts.sort((a, b) => b.time - a.time);
  posts.forEach(addPostToPage);

  currentPage++;
  isLoading = false;
  setStatus("");
  setLoadButton(false, "Load more");
}

// Adds one post card to the page.
export function addPostToPage(post) {
  if (!post || !post.title || document.querySelector(`[data-id="${post.id}"]`)) {
    return;
  }

  const card = makePostCard(post);

  if (!card) {
    return;
  }

  insertCardByTime(card);
}

// Builds the correct card depending on the item type.
function makePostCard(post) {
  if (post.type === "story") {
    return makeStoryCard(post);
  }

  if (post.type === "job") {
    return makeJobCard(post);
  }

  if (post.type === "poll") {
    return makePollCard(post);
  }

  return null;
}

// Builds a normal story card.
function makeStoryCard(post) {
  const card = makeBasicCard(post, "Story", "story");
  addCommentsButton(card, post);
  return card;
}

// Builds a job post card.
function makeJobCard(post) {
  const card = makeBasicCard(post, "Job", "job");
  addCommentsButton(card, post);
  return card;
}

// Builds a poll card and then loads the poll options.
function makePollCard(post) {
  const card = makeBasicCard(post, "Poll", "poll");
  const options = document.createElement("div");
  card.appendChild(options);
  addCommentsButton(card, post);

  if (post.parts) {
    loadPollOptions(post.parts, options);
  }

  return card;
}

// Builds the shared part of every post card.
function makeBasicCard(post, label, typeClass) {
  const card = document.createElement("article");
  card.className = "post-card";
  card.dataset.id = post.id;
  card.dataset.time = post.time;

  card.innerHTML = `
    <div class="post-meta">
      <span class="badge ${typeClass}">${label}</span>
      <span>${timeAgo(post.time)}</span>
      ${post.score ? `<span>${post.score} points</span>` : ""}
    </div>
    <h2 class="post-title">${makeTitle(post)}</h2>
    <div class="post-footer">
      <span>by ${post.by || "unknown"}</span>
    </div>
    ${post.text ? `<div class="post-text">${post.text}</div>` : ""}
  `;

  return card;
}

// Makes a title. If there is a url, the title becomes a link.
function makeTitle(post) {
  if (post.url) {
    return `<a href="${post.url}" target="_blank" rel="noopener">${post.title}</a>`;
  }

  return post.title;
}

// Adds the comments button to a post.
function addCommentsButton(card, post) {
  const footer = card.querySelector(".post-footer");
  const button = document.createElement("button");

  button.className = "comments-btn";
  button.textContent = `${post.descendants || 0} comments`;
  button.addEventListener("click", function () {
    openCommentsFunction(post.id);
  });

  footer.appendChild(button);
}

// Loads poll choices and shows their scores.
async function loadPollOptions(partIds, container) {
  const parts = await fetchItems(partIds);
  parts.sort((a, b) => (b.score || 0) - (a.score || 0));

  parts.forEach((part) => {
    const option = document.createElement("div");
    option.className = "poll-option";
    option.innerHTML = `<span>${part.text}</span><span>${part.score || 0} points</span>`;
    container.appendChild(option);
  });
}

// Shows a message above the feed.
function setStatus(message) {
  document.getElementById("status-message").textContent = message;
}

// Changes the load button text and disabled state.
function setLoadButton(disabled, text) {
  const button = document.getElementById("load-more-btn");
  button.disabled = disabled;
  button.textContent = text;
}

// Adds a card in the right place so newest posts stay first.
function insertCardByTime(card) {
  const list = document.getElementById("post-list");
  const cards = Array.from(list.children);
  const cardTime = Number(card.dataset.time);

  const olderCard = cards.find((oldCard) => {
    return Number(oldCard.dataset.time) < cardTime;
  });

  if (olderCard) {
    list.insertBefore(card, olderCard);
  } else {
    list.appendChild(card);
  }
}
