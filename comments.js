// PERSON 3 - comments.js

// Build a single top-level comment (no nesting)
function buildComment(comment) {
    const ago  = timeAgo(comment.time);
    const date = new Date(comment.time * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    const el = document.createElement("div");
    el.className = "comment";
    el.innerHTML = `
        <div class="comment-meta"><b>${comment.by}</b> <span>${ago} · ${date}</span></div>
        <div class="comment-text">${comment.text}</div>
    `;
    return el;
}

// Toggle comments: fetch top-level only, sort newest first
async function toggleComments(postId, areaEl) {
    if (areaEl.style.display === "block") { areaEl.style.display = "none"; return; }
    areaEl.style.display = "block";
    areaEl.innerHTML = "<p class='loading-msg'>Loading comments…</p>";

    const post = await fetchItem(postId);
    if (!post?.kids?.length) { areaEl.innerHTML = "<p class='loading-msg'>No comments yet.</p>"; return; }

    const comments = (await fetchItems(post.kids))
        .filter(c => c && !c.deleted && !c.dead)
        .sort((a, b) => b.time - a.time);

    areaEl.innerHTML = "";
    comments.forEach(c => areaEl.appendChild(buildComment(c)));
}