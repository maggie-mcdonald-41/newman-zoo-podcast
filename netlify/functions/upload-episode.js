// netlify/functions/upload-episode.js

export default async function handler(request, context) {
  // This is just a smoke test – no upload logic yet.
  return new Response(
    JSON.stringify({
      message: "upload-episode function reached",
      method: request.method,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
}
