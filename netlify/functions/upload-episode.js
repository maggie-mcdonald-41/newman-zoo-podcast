const fs = require("fs");
const path = require("path");
const multiparty = require("multiparty");
const util = require("util");
const { exec } = require("child_process");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const form = new multiparty.Form();
  const parseForm = util.promisify(form.parse);

  try {
    const [fields, files] = await parseForm(event);

    const title = fields.title[0];
    const description = fields.description[0];
    const pubDate = fields.pubDate[0];
    const audioFile = files.audio[0];
    const fileName = path.basename(audioFile.originalFilename);

    const destPath = path.join(__dirname, "../../episodes/audio", fileName);
    fs.copyFileSync(audioFile.path, destPath);

    const metaPath = path.join(__dirname, "../../episodes/data.json");
    const existing = JSON.parse(fs.readFileSync(metaPath));
    existing.push({
      title,
      description,
      pubDate,
      file: "/episodes/audio/" + fileName,
    });
    fs.writeFileSync(metaPath, JSON.stringify(existing, null, 2));

    exec("node scripts/generate-feed.js");

    return {
      statusCode: 200,
      body: "Episode uploaded and feed updated!",
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Upload failed: " + err.message,
    };
  }
};
