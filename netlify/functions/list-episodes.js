// netlify/functions/list-episodes.js
const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  try {
    const store = getStore("episodes");
    const { blobs } = await store.list({ prefix: "audio/" });

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
    console.error("List error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Could not list episodes" })
    };
  }
};
