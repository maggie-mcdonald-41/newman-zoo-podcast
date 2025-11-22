// netlify/functions/get-episode.js
const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  try {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) {
      return { statusCode: 400, body: "Missing id" };
    }

    const store = getStore("episodes");
    const key = `audio/${id}.mp3`;

    const file = await store.get(key);
    if (!file) {
      return { statusCode: 404, body: "Not found" };
    }

    // file should be a Buffer in Node
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000"
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error("Get episode error:", err);
    return {
      statusCode: 500,
      body: "Server error"
    };
  }
};
