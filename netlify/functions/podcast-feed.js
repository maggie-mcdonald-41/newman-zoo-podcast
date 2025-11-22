// netlify/functions/podcast-feed.js
import { getStore } from "@netlify/blobs";

function escapeXml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async (req, context) => {
  try {
    const store = getStore("episodes");

    // Get all audio blobs
    const { blobs } = await store.list({ prefix: "audio/" });

    // Sort newest first
    const sorted = [...blobs].sort((a, b) => {
      const aDate =
        (a.metadata && a.metadata.publishedAt) || a.uploadedAt || "";
      const bDate =
        (b.metadata && b.metadata.publishedAt) || b.uploadedAt || "";
      return bDate.localeCompare(aDate);
    });

    const url = new URL(req.url);
    const origin = url.origin;

    // Channel metadata – tweak these for your show
    const podcastTitle = "Newman Family Zoo";
    const podcastDescription =
      "A real-world podcast about life, faith, and finding your purpose. Dr. Rusty Newman blends wisdom, humor, and heart to help you make Godly choices, raise strong families, and become your best self — one story at a time.";
    const podcastLink = origin; // or your custom domain when you add one
    const podcastLanguage = "en-us";
    const podcastAuthor = "Dr. Rusty Newman";
    const podcastEmail = "example@example.com"; // change this later if you want

    const itemsXml = sorted
      .map((blob) => {
        const id = blob.key.replace(/^audio\//, "").replace(/\.mp3$/, "");
        const title =
          (blob.metadata && blob.metadata.title) || "Untitled Episode";
        const description =
          (blob.metadata && blob.metadata.description) ||
          "New episode of the Newman Family Zoo podcast.";
        const publishedAt =
          (blob.metadata && blob.metadata.publishedAt) || blob.uploadedAt;
        const pubDate = publishedAt
          ? new Date(publishedAt).toUTCString()
          : new Date().toUTCString();

        const size = blob.size || 0;

        const audioUrl = `${origin}/.netlify/functions/get-episode?id=${encodeURIComponent(
          id
        )}`;

        return `
      <item>
        <title>${escapeXml(title)}</title>
        <description>${escapeXml(description)}</description>
        <pubDate>${pubDate}</pubDate>
        <guid isPermaLink="false">${escapeXml(id)}</guid>
        <enclosure url="${escapeXml(
          audioUrl
        )}" length="${size}" type="audio/mpeg" />
        <itunes:author>${escapeXml(podcastAuthor)}</itunes:author>
        <itunes:explicit>no</itunes:explicit>
      </item>`;
      })
      .join("\n");

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(podcastTitle)}</title>
    <link>${escapeXml(podcastLink)}</link>
    <language>${podcastLanguage}</language>
    <description>${escapeXml(podcastDescription)}</description>
    <itunes:author>${escapeXml(podcastAuthor)}</itunes:author>
    <itunes:explicit>no</itunes:explicit>
    <atom:link href="${escapeXml(
      `${origin}/feed.xml`
    )}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

    return new Response(rssXml, {
      status: 200,
      headers: {
        "content-type": "application/rss+xml; charset=utf-8",
        "cache-control": "public, max-age=300", // 5 min cache
      },
    });
  } catch (err) {
    console.error("Feed error:", err);
    return new Response("Feed error", { status: 500 });
  }
};
