// netlify/functions/get-episode.js
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Missing id", { status: 400 });
    }

    const store = getStore("episodes");
    const key = `audio/${id}.mp3`;

    const file = await store.get(key);
    if (!file) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(file, {
      status: 200,
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    console.error("Get episode error:", err);
    return new Response("Server error", { status: 500 });
  }
};
