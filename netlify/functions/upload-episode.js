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
    // Parse the incoming multipart/form-data
    const { fields, files } = await parseForm(event);

    const title =
      (fields.title && fields.title[0]) || "Untitled Episode";
    const description =
      (fields.description && fields.description[0]) || "";
    const pubDate =
      (fields.pubDate && fields.pubDate[0]) ||
      new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const audioFile =
      files.audio && files.audio[0];

    if (!audioFile) {
      return {
        statusCode: 400,
        body: "No audio file uploaded.",
      };
    }

    // Where episodes live in the repo
    const episodesDir = path.join(__dirname, "../../episodes");
    if (!fs.existsSync(episodesDir)) {
      fs.mkdirSync(episodesDir, { recursive: true });
    }

    // Create a safe filename
    const originalName = audioFile.originalFilename || "episode.mp3";
    const safeName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, "-");

    const destPath = path.join(episodesDir, safeName);

    // Copy the uploaded file to /episodes
    await fs.promises.copyFile(audioFile.path, destPath);

    // Load existing episodes
    const dataPath = path.join(__dirname, "../../episodes/data.json");
    let episodes = [];
    if (fs.existsSync(dataPath)) {
      const raw = await fs.promises.readFile(dataPath, "utf8");
      episodes = raw ? JSON.parse(raw) : [];
    }

    // Add new episode entry
    const fileUrlPath = `/episodes/${safeName}`;
    episodes.push({
      title,
      description,
      pubDate,
      file: fileUrlPath,
    });

    // Save updated episodes list
    await fs.promises.writeFile(
      dataPath,
      JSON.stringify(episodes, null, 2),
      "utf8"
    );

    // Regenerate feed.xml from episodes/data.json
    await new Promise((resolve, reject) => {
      exec(
        "node scripts/generate-feed.js",
        { cwd: path.join(__dirname, "..", "..") },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Feed generation error:", error);
            return reject(error);
          }
          if (stdout) console.log(stdout);
          if (stderr) console.error(stderr);
          resolve();
        }
      );
    });

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
