// netlify/functions/upload-episode.js
const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { title, description, fileName, fileType, fileBase64 } = body;

    if (!fileBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing file data" })
      };
    }

    const buffer = Buffer.from(fileBase64, "base64");

    const safeTitle = title && title.trim().length ? title.trim() : "Untitled Episode";
    const safeDescription = description || "";

    const store = getStore("episodes");

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const key = `audio/${id}.mp3`;

    await store.set(key, buffer, {
      metadata: {
        title: safeTitle,
        description: safeDescription,
        publishedAt: new Date().toISOString(),
        fileName: fileName || "episode.mp3",
        fileType: fileType || "audio/mpeg"
      }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: safeTitle,
        description: safeDescription
      })
    };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Upload failed" })
    };
  }
};
