# ClonerNews

A Hacker News reader that runs in the browser. Plain HTML, CSS and JavaScript
ES modules — no framework, no build step, no dependencies.

It reads the public [Hacker News Firebase API](https://github.com/HackerNews/API)
directly and renders three feeds with pagination, comment threads and a live
update banner.

## Features

- **Three feeds** — Top, New and Jobs, each backed by its own HN endpoint
  (`topstories`, `newstories`, `jobstories`).
- **Pagination** — 10 posts per page, with a "Load more" button that appends the
  next page instead of reloading.
- **Post types** — stories, jobs and polls. Polls render their options, fetched
  from the poll's `parts` list.
- **Comments panel** — clicking a post opens a side panel with its comments,
  newest first. Deleted and dead comments are filtered out.
- **Live updates** — polls `updates.json` every 5 seconds. When new items appear,
  a banner offers to show them, and new posts are inserted in time order so the
  feed stays sorted.
- **Item cache** — every fetched item is memoised in `api.js`, so paging back and
  forth does not hit the API twice for the same post.
- **Relative timestamps** — `12s ago`, `4m ago`, `3h ago`, `2d ago`.

## Running it

ES modules only load over HTTP, so open it through a static server rather than
`file://`:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

No API key or configuration is needed.

## Structure

| File | Role |
|---|---|
| `index.html` | Markup: header, feed tabs, live banner, post list, comment panel |
| `style.css` | Layout, cards, tabs and the sliding comment panel |
| `main.js` | Entry point: boots the feed and comments, starts the 5 s poll |
| `api.js` | HN client: item cache, feed ids, live updates, paging, `timeAgo` |
| `posts.js` | Feed rendering: cards, poll options, sorting by time, "Load more" |
| `comments.js` | Comment panel and the live update banner |

## Notes

- Comments are rendered one level deep — the top-level replies of a post. Nested
  replies are not expanded.
- Comment text is inserted as HTML, because HN returns HTML fragments.
- There is no offline mode, search or authentication.

## Authors

- **Ssam** — [@drawliin](https://github.com/drawliin)
- **Elmehdi Rezoug** — [@zoro-craft](https://github.com/zoro-craft)
