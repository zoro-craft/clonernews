// ============================================================
// main.js  — Entry point
// ============================================================

import { initPostLoading } from "./posts.js";
import { initCommentsAndLive, openComments } from "./comments.js";

// posts.js needs to call openComments (defined in comments.js)
// We expose it on window so the button listeners in posts.js can reach it
window.openComments = openComments;

initPostLoading();
initCommentsAndLive();