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

    const titleInput = document.getElementById("title");
    const descriptionInput = document.getElementById("description");
    const fileInput = document.getElementById("audio");

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const file = fileInput.files[0];

    if (!file) {
      uploadStatus.textContent = "Please choose an MP3 file.";
      uploadStatus.className = "status error";
      return;
    }

    uploadStatus.textContent = "Preparing upload…";
    uploadStatus.className = "status";
    uploadButton.disabled = true;

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const fileBase64 = btoa(binary);

      uploadStatus.textContent = "Uploading…";

      const payload = {
        title,
        description,
        fileName: file.name,
        fileType: file.type || "audio/mpeg",
        fileBase64
      };

      const res = await fetch("/.netlify/functions/upload-episode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
      }

      if (!res.ok) {
        console.error("Upload failed response:", text);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

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

fetchEpisodes();
