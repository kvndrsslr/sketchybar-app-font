import chokidar from "chokidar";
import { install } from "./install.js";
import express from "express";
import livereload from "livereload";
import fs from "node:fs";

install(process.argv[2]);

// launch express server with livereload

const liveReloadServer = livereload.createServer();

const app = express();

app.get("*", (req, res) => {
  // Build the path of the file using the URL pathname of the request.
  if (req.url.indexOf("font.woff2") > 0) {
    res.sendFile("sketchybar-app-font.woff2", {root: "./dist"});
    return;
  }
  res.send(getPreviewHTML());
});


const PORT = 3003;
app.listen(PORT, () => {
  console.log(`\nPreview server running at http://localhost:${PORT}`);
  console.log("Watching for changes in ./mappings and ./svgs\n");
});

chokidar.watch(["./mappings", "./svgs"]).on("change", (path) => {
  console.log(`\nFile changed: ${path}`);
  console.log("Rebuilding...");
  install(process.argv[2], false);
  liveReloadServer.refresh("/");
  console.log("Rebuild complete\n");
});

function getPreviewHTML() {
  const iconMap = fs
    .readdirSync("./mappings")
    .map((file) => file.replace(".svg", ""));

  return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Sketchybar App Font Preview</title>
        <script>
        document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
        ':35729/livereload.js?snipver=1"></' + 'script>')
        </script>
        <style>
            @font-face {
                font-family: 'preview-font';
                src: url('./font.woff2?v=${new Date().getTime()}') format('woff2');
            }

            body {
                font-family: monospace;
            }

            .icon-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                grid-gap: 1em;
            }

            .icon-container {
                display: flex; flex-direction: column; align-items: center;
            }

            .icon-title {
                font-size: 0.8em;
                display: inline-block;
                margin-bottom: 0.5em;
            }

            .icon {
                font-family: preview-font;
                display: inline-block;
                width: 1em;
                height: 1em;
                vertical-align: middle;
                font-size: 4em;
            }

        </style>
    </head>
    <body>
        <h1>Sketchybar App Font Preview</h1>
        <div class="icon-grid">
            ${iconMap
              .map(
                (iconName) =>
                  `<div class="icon-container"><span class="icon-title">${iconName}</span><span class="icon">${iconName}</span></div>`
              )
              .join("\n")}
              </div>
    </body>
</html>
`;
}
