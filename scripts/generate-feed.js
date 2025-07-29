const fs = require("fs");
const path = require("path");

const episodes = JSON.parse(fs.readFileSync("episodes/data.json"));
const coverUrl = "https://newman-zoo-podcast.netlify.app/doc.jpeg"; // <-- update this with the actual image filename

const feedItems = episodes.map(ep => `
  <item>
    <title><![CDATA[${ep.title}]]></title>
    <description><![CDATA[${ep.description}]]></description>
    <pubDate>${new Date(ep.pubDate).toUTCString()}</pubDate>
<enclosure url="https://newman-zoo-podcast.netlify.app${ep.file}" type="audio/mpeg" />
<guid>https://newman-zoo-podcast.netlify.app${ep.file}</guid>
  </item>
`).join("");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Newman Family Zoo</title>
    <link>https://newman-zoo-podcast.netlify.app/</link>
    <description>A real-world podcast about life, faith, and finding your purpose. Dr. Rusty Newman blends wisdom, humor, and heart to help you make Godly choices, raise strong families, and become your best self — one story at a time.</description>
    <language>en-us</language>
    <itunes:author>Dr. Rusty Newman</itunes:author>
    <itunes:image href="${coverUrl}" />
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Religion & Spirituality"/>
    ${feedItems}
  </channel>
</rss>`;

fs.writeFileSync("feed.xml", rss);
