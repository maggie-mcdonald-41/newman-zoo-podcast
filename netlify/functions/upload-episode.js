// netlify/functions/upload-episode.js
import { getStore } from "@netlify/blobs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      const bodyText = await request.text();
      console.log("Unexpected content-type:", contentType);
      console.log("Body preview:", bodyText.slice(0, 200));
      return jsonResponse(
        { error: "Expected multipart/form-data request" },
        400
      );
    }

    const form = await request.formData();
    const keys = [...form.keys()];
    console.log("Form keys:", keys);

    const file = form.get("audio");
    if (!file || typeof file === "string") {
      console.log("File field 'audio' missing or not a file:", file);
      return jsonResponse({ error: "Missing audio file" }, 400);
    }

    const title =
      (form.get("title") || file.name || "Untitled Episode").toString();
    const description = (form.get("description") || "").toString();
    const publishedAt =
      (form.get("publishedAt") || new Date().toISOString()).toString();

    const store = getStore("episodes");

    const id =
      (globalThis.crypto &&
        crypto.randomUUID &&
        crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const key = `audio/${id}.mp3`;

    console.log("Saving blob with key:", key);

    await store.set(key, file, {
      metadata: {
        title,
        description,
        publishedAt,
      },
    });

    return jsonResponse({ id, title, description, publishedAt }, 200);
  } catch (err) {
    console.error("Upload error:", err);
    return jsonResponse({ error: "Upload failed" }, 500);
  }
}
