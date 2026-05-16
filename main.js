import { initCommentsAndLive, openComments } from "./comments.js";
import { initPosts } from "./posts.js";

// Starts the whole page after the modules are loaded.
initPosts(openComments);
initCommentsAndLive();
