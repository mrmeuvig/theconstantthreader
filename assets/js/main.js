const INSTAGRAM_URL = "https://www.instagram.com/theconstantthreader/";

function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function truncateCaption(text, max = 280) {
  if (!text || text.length <= max) return text || "";
  return text.slice(0, max).trimEnd() + "…";
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPost(post) {
  const hero = document.getElementById("hero");
  const caption = truncateCaption(post.caption);
  const date = formatDate(post.timestamp);
  const alt = escapeHtml(caption || "Latest Instagram post");
  const badge = post.mediaType === "VIDEO" ? "Video" : "Latest";

  hero.innerHTML = `
    <article class="post-card">
      <a class="post-link" href="${post.permalink}" target="_blank" rel="noopener noreferrer">
        <div class="post-media">
          <img
            class="post-image"
            src="${post.mediaUrl}"
            alt="${alt}"
            loading="eager"
            decoding="async"
          />
          <span class="post-badge">${badge}</span>
        </div>
        <div class="post-body">
          <p class="post-label">Latest on Instagram</p>
          ${caption ? `<p class="post-caption">${escapeHtml(caption)}</p>` : ""}
          ${date ? `<p class="post-meta">${date}</p>` : ""}
        </div>
      </a>
    </article>
  `;
}

function renderPlaceholder(profile) {
  const hero = document.getElementById("hero");
  hero.innerHTML = `
    <article class="post-card is-placeholder">
      <p class="post-label">Latest on Instagram</p>
      <p>Follow <strong>@${profile.username}</strong> — the latest post will appear here once the site is connected to Instagram.</p>
      <p class="post-meta"><a href="${profile.url}" target="_blank" rel="noopener noreferrer">View on Instagram</a></p>
    </article>
  `;
}

async function init() {
  const follow = document.getElementById("follow-link");
  if (follow) follow.href = INSTAGRAM_URL;

  try {
    const res = await fetch("./data/latest-post.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load post data");
    const data = await res.json();
    const profile = data.profile || {
      username: "theconstantthreader",
      url: INSTAGRAM_URL,
    };

    if (data.post?.mediaUrl && data.post?.permalink) {
      renderPost(data.post);
    } else {
      renderPlaceholder(profile);
    }
  } catch {
    renderPlaceholder({
      username: "theconstantthreader",
      url: INSTAGRAM_URL,
    });
  }
}

init();
