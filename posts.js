// =============================================
// PERSON 2 - posts.js
// Handles: building HTML cards for each post type
// =============================================

// Format a unix timestamp as "x minutes/hours/days ago"
function timeAgo(unix) {
    const s = Math.floor((Date.now() / 1000) - unix);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

// Format a unix timestamp into a readable date
function formatDate(unix) {
    return new Date(unix * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Shared helper: create a card div with given inner HTML
function makeCard(item, badgeClass, badgeLabel, body) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = item.id;
    card.innerHTML = `<span class="badge ${badgeClass}">${badgeLabel}</span>${body}`;
    return card;
}

// Meta line shared by story and poll (has comments button)
function metaWithComments(item) {
    return `<div class="meta">
        <span>▲ ${item.score || 0}</span>
        <span>by <b>${item.by}</b></span>
        <span>${timeAgo(item.time)} · ${formatDate(item.time)}</span>
        <button class="comments-btn" data-id="${item.id}">💬 ${item.kids?.length || 0} comments</button>
    </div>
    <div class="comments-area" id="c-${item.id}" style="display:none"></div>`;
}

// Build and return the right card based on item type
async function buildCard(item) {
    if (!item || !item.title || item.deleted || item.dead) return null;

    if (item.type === "story") {
        return makeCard(item, "story", "Story",
            `<a class="title" href="${item.url || "#"}" target="_blank">${item.title}</a>${metaWithComments(item)}`
        );
    }

    if (item.type === "job") {
        return makeCard(item, "job", "Job",
            `<a class="title" href="${item.url || "#"}" target="_blank">${item.title}</a>
            <div class="meta"><span>by <b>${item.by}</b></span><span>${timeAgo(item.time)} · ${formatDate(item.time)}</span></div>
            ${item.text ? `<p class="body-text">${item.text}</p>` : ""}`
        );
    }

    if (item.type === "poll") {
        // Fetch poll options (parts array holds IDs of each option)
        const parts = item.parts ? await fetchItems(item.parts) : [];
        const opts = parts.filter(Boolean).map(p =>
            `<div class="poll-opt"><span>${p.text}</span><b>▲ ${p.score}</b></div>`
        ).join("");
        return makeCard(item, "poll", "Poll",
            `<div class="title">${item.title}</div>${metaWithComments(item)}<div class="poll-opts">${opts}</div>`
        );
    }

    return null;
}