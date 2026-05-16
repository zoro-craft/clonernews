import { initComments, openComments, checkLiveUpdates} from "./comments.js";
import { initPosts } from "./posts.js";

// Starts the whole page after the modules are loaded.
initPosts(openComments);
initComments();

// Live Updates
setInterval(checkLiveUpdates, 5000);
