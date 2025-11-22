// netlify/functions/podcast-feed.js
const { getStore } = require("@netlify/blobs");

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

exports.handler = async (event, context) => {
  try {
    const store = getStore("episodes");
    const { blobs } = await store.list({ prefix: "audio/" });

    const sorted = [...blobs].sort((a, b) => {
      const aDate = (a.metadata && a.metadata.publishedAt) || a.uploadedAt || "";
      const bDate = (b.metadata && b.metadata.publishedAt) || b.uploadedAt || "";
      return bDate.localeCompare(aDate);
    });

    const origin = `${event.headers["x-forwarded-proto"] || "https"}://${event.headers.host}`;

    const podcastTitle = "Newman Family Zoo";
    const podcastDescription =
      "A real-world podcast about life, faith, and finding your purpose. Dr. Rusty Newman blends wisdom, humor, and heart to help you make Godly choices, raise strong families, and become your best self — one story at a time.";
    const podcastLink = origin;
    const podcastLanguage = "en-us";
    const podcastAuthor = "Dr. Rusty Newman";

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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      },
      body: rssXml
    };
  } catch (err) {
    console.error("Feed error:", err);
    return {
      statusCode: 500,
      body: "Feed error"
    };
  }
};
