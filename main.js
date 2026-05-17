const API_ROOT = "https://hacker-news.firebaseio.com";
const feedContainer = document.getElementById("container");
let latestItemId;
let pageNumber = 0;
let resultsBuffer = [];
let isFetching = false;
let checkTask;

const loadingSpinner = document.createElement("div");
loadingSpinner.className = "loading-indicator";
loadingSpinner.innerText = "Loading";
document.body.appendChild(loadingSpinner);

const banner = document.createElement("div");
banner.id = "update-banner";
banner.style.cssText = `
    position: fixed;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    background: #4f46e5;
    color: white;
    padding: 15px 30px;
    border-radius: 8px;
    cursor: pointer;
    transition: top 0.5s ease;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: bold;
`;
banner.innerText = "New polls available! Click to refresh";
banner.onclick = () => location.reload();
document.body.appendChild(banner);

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

const updateMaxId = async () => {
    latestItemId = await fetchData(API_ROOT + "/v0/maxitem.json");
};

async function loadBatch() {
    let offset = pageNumber * 100 + 1;
    pageNumber++;
    let requests = [];
    for (let i = latestItemId - offset + 1; i >= latestItemId - offset - 100; i--) {
        requests.push(fetchData(API_ROOT + `/v0/item/${i}.json?print=pretty`));
    }
    resultsBuffer = await Promise.all(requests);
}

async function displayItems(count) {
    if (count === 0) loadingSpinner.style.display = "block";

    if (resultsBuffer.length === 0) {
        await loadBatch();
    }

    const docGroup = document.createDocumentFragment();

    for (let i = 0; i < resultsBuffer.length; i++) {
        const item = resultsBuffer[i];
        if (!item || item.type === "comment" || !item.title || !item.by) continue;

        let postDate = new Date(item.time * 1000).toLocaleDateString('en-GB');
        let commentElements = [];
        let totalComments = 0;
        
        if (item.kids) {
            let thread = await Promise.all(item.kids.slice(0, 5).map(id => fetchData(API_ROOT + `/v0/item/${id}.json`)));
            thread.forEach(msg => {
                if (msg && !msg.deleted) {
                    totalComments++;
                    let row = document.createElement('div');
                    row.style.marginBottom = "10px";
                    row.style.fontSize = "1.2rem";
                    row.innerHTML = `<strong style="color: #4f46e5;">${msg.by}:</strong><p>${msg.text}</p><hr style="border: 0; border-top: 1px solid #eee; margin: 5px 0;">`;
                    commentElements.push(row);
                }
            });
        }

        const block = document.createElement('div');
        block.innerHTML = `
        <div class="story-card">
            <div class="story-main">
                <div class="story-content">
                    <h3 class="story-title"><a href="${item.url || '#'}" target="_blank">${item.title}</a></h3>
                    <div class="story-meta">
                        <span>By <strong>${item.by}</strong></span>
                        <span class="separator">•</span>
                        <span>${postDate}</span>
                        <span class="separator">•</span>
                        <button class="comment-btn" onclick="toggleThread(${item.id})">${totalComments || 0} comments</button>
                    </div>
                    <div class="comments-section" id="comments-${item.id}" style="display: none;"></div>
                </div>
            </div>
            <div class="story-type">${item.type}</div>
        </div>`;

        let target = block.querySelector(`#comments-${item.id}`);
        commentElements.forEach(el => target.appendChild(el));
        docGroup.appendChild(block);
        count++;
    }

    feedContainer.appendChild(docGroup);

    if (count < 10) {
        resultsBuffer = [];
        await displayItems(count);
    } else {
        resultsBuffer = [];
        await loadBatch();
        loadingSpinner.style.display = "none";
        isFetching = false;
    }
}

function toggleThread(id) {
    let box = document.getElementById(`comments-${id}`);
    box.style.display = box.style.display === "none" ? "block" : "none";
}

async function runBackgroundCheck() {
    const liveMax = await fetchData(API_ROOT + "/v0/maxitem.json");
    if (liveMax > latestItemId) {
        banner.style.top = "20px";
        clearInterval(checkTask);
    }
}

const scrollGuard = (action, time) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => action(...args), time);
    };
};

const watchScroll = async () => {
    if (isFetching) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 400) {
        isFetching = true;
        await displayItems(0);
    }
};

async function start() {
    await updateMaxId();
    await displayItems(0);
    window.addEventListener("scroll", scrollGuard(watchScroll, 200));
    checkTask = setInterval(runBackgroundCheck, 5000);
}

start();