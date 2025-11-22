// netlify/functions/list-episodes.js
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  try {
    const store = getStore("episodes");

    // List all blobs with prefix "audio/"
    const { blobs } = await store.list({ prefix: "audio/" });

    // Sort newest first by uploadedAt or metadata.publishedAt
    const sorted = [...blobs].sort((a, b) => {
      const aDate =
        (a.metadata && a.metadata.publishedAt) || a.uploadedAt || "";
      const bDate =
        (b.metadata && b.metadata.publishedAt) || b.uploadedAt || "";
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
        size: blob.size,
      };
    });

    return new Response(
      JSON.stringify({ episodes: latest }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List error:", err);
    return new Response(
      JSON.stringify({ error: "Could not list episodes" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
