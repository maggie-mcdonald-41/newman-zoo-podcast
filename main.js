const uploadForm = document.getElementById("upload-form");
const uploadButton = document.getElementById("upload-button");
const uploadStatus = document.getElementById("upload-status");
const episodesList = document.getElementById("episodes-list");
const refreshButton = document.getElementById("refresh-button");

async function fetchEpisodes() {
  if (!episodesList) return;
  episodesList.innerHTML = "<p>Loading episodes…</p>";
  try {
    const res = await fetch("/.netlify/functions/list-episodes");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const episodes = data.episodes || [];

    if (!episodes.length) {
      episodesList.innerHTML = "<p>No episodes uploaded yet.</p>";
      return;
    }

    episodesList.innerHTML = "";
    episodes.forEach((ep) => {
      const item = document.createElement("div");
      item.className = "episode-item";

      const title = document.createElement("p");
      title.className = "episode-title";
      title.textContent = ep.title || "Untitled Episode";

      const meta = document.createElement("p");
      meta.className = "episode-meta";
      const date = ep.publishedAt
        ? new Date(ep.publishedAt).toLocaleString()
        : "Unknown date";
      const sizeMB = ep.size ? (ep.size / (1024 * 1024)).toFixed(1) : "?";
      meta.textContent = `${date} • ${sizeMB} MB`;

      const desc = document.createElement("p");
      desc.className = "episode-description";
      desc.textContent = ep.description || "";

      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = `/.netlify/functions/get-episode?id=${encodeURIComponent(
        ep.id
      )}`;

      item.appendChild(title);
      item.appendChild(meta);
      if (desc.textContent) item.appendChild(desc);
      item.appendChild(audio);
      episodesList.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    episodesList.innerHTML =
      "<p>Could not load episodes. Please try again.</p>";
  }
}

if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("audio");
    const file = fileInput.files[0];

    if (!file) {
      uploadStatus.textContent = "Please choose an MP3 file.";
      uploadStatus.className = "status error";
      return;
    }

    // Handy debug line: shows in browser console if you want to double-check
    console.log("Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    uploadStatus.textContent = "Uploading...";
    uploadStatus.className = "status";
    uploadButton.disabled = true;

    try {
      const formData = new FormData(uploadForm);
      const res = await fetch("/.netlify/functions/upload-episode", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Upload error body:", text);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      uploadStatus.textContent = `Uploaded "${data.title}" successfully.`;
      uploadStatus.className = "status success";
      uploadForm.reset();

      await fetchEpisodes();
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = "Upload failed. Please try again.";
      uploadStatus.className = "status error";
    } finally {
      uploadButton.disabled = false;
    }
  });
}

if (refreshButton) {
  refreshButton.addEventListener("click", fetchEpisodes);
}

// Load episodes on page load
fetchEpisodes();
