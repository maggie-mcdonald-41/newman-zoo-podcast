// netlify/functions/list-episodes.js
const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  try {
    let store;

    // Try to access the "episodes" blob store
    try {
      store = getStore("episodes");
    } catch (err) {
      console.error("Blobs not configured or getStore failed:", err);
      // Fallback: return empty list so the UI doesn't break
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodes: [] })
      };
    }

    let blobsResult;
    try {
      blobsResult = await store.list({ prefix: "audio/" });
    } catch (err) {
      console.error("Error listing blobs:", err);
      // Fallback: return empty list
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodes: [] })
      };
    }

    const blobs = blobsResult.blobs || [];

    const sorted = [...blobs].sort((a, b) => {
      const aDate = (a.metadata && a.metadata.publishedAt) || a.uploadedAt || "";
      const bDate = (b.metadata && b.metadata.publishedAt) || b.uploadedAt || "";
      return bDate.localeCompare(aDate);
    });

    const latest = sorted.slice(0, 20).map((blob) => {
      const id = blob.key.replace(/^audio\//, "").replace(/\.mp3$/, "");
      return {
        id,
        key: blob.key,
        title: (blob.metadata && blob.metadata.title) || blob.key,
        description: (blob.metadata && blob.metadata.description) || "",
        publishedAt:
          (blob.metadata && blob.metadata.publishedAt) || blob.uploadedAt,
        size: blob.size
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodes: latest })
    };
  } catch (err) {
    console.error("List error (outer catch):", err);
    // Final fallback: still return 200 so the UI doesn't crash
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodes: [] })
    };
  }
};
