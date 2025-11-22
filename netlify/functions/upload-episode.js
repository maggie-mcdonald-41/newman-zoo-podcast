// netlify/functions/upload-episode.js
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const form = await req.formData();

    const file = form.get("audio");
    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ error: "Missing audio file" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const title = (form.get("title") || file.name || "Untitled").toString();
    const description = (form.get("description") || "").toString();
    const publishedAt =
      (form.get("publishedAt") || new Date().toISOString()).toString();

    const store = getStore("episodes");

    const id =
      (globalThis.crypto && crypto.randomUUID && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const key = `audio/${id}.mp3`;

    await store.set(key, file, {
      metadata: {
        title,
        description,
        publishedAt,
      },
    });

    return new Response(
      JSON.stringify({ id, title, description, publishedAt }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(
      JSON.stringify({ error: "Upload failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
