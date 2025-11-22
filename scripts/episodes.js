// scripts/episodes.js

async function loadEpisodes() {
  const root = document.getElementById("episodes-root");

  try {
    // Cache-bust so Netlify/CDN doesn’t hang onto an old data.json
    const res = await fetch(`/episodes/data.json?cb=${Date.now()}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const episodes = await res.json();

    if (!Array.isArray(episodes) || episodes.length === 0) {
      root.innerHTML = `
        <p class="empty-state">
          No episodes found yet. Upload one from the <a href="index.html">Upload Page</a>.
        </p>
      `;
      return;
    }

    // Newest first
    episodes.sort((a, b) => {
      const da = new Date(a.pubDate);
      const db = new Date(b.pubDate);
      return db - da;
    });

    const list = document.createElement("div");
    list.className = "episode-list";

    episodes.forEach((ep, index) => {
      const card = document.createElement("article");
      card.className = "episode-card";

      const title = document.createElement("h2");
      title.className = "episode-title";
      title.textContent = ep.title || `Episode ${episodes.length - index}`;

      const meta = document.createElement("p");
      meta.className = "episode-meta";
      const dateStr = ep.pubDate
        ? new Date(ep.pubDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Unknown date";
      meta.textContent = `Published: ${dateStr}`;

      const desc = document.createElement("p");
      desc.className = "episode-description";
      desc.textContent = ep.description || "No description provided.";

      const audio = document.createElement("audio");
      audio.className = "episode-audio";
      audio.controls = true;
      audio.preload = "none";

      // In data.json we store file like "/episodes/filename.mp3"
      audio.src = ep.file || "";

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(desc);
      card.appendChild(audio);

      list.appendChild(card);
    });

    root.innerHTML = "";
    root.appendChild(list);
  } catch (err) {
    console.error("Error loading episodes:", err);
    root.innerHTML = `
      <p class="empty-state">
        There was a problem loading episodes. Make sure <code>episodes/data.json</code>
        exists and try again.
      </p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadEpisodes);
