import { execSync } from "node:child_process";
import { build, startMarker, endMarker } from "./build.js";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Builds and installs the font. Installing the icon map helpers is opt-in, so the font is the
 * only thing written by default.
 *
 * @param {string} [replaceInScriptPath] file whose marked section gets the icon map function
 * @param {boolean} [refreshSketchybar] run `sketchybar --reload` afterwards
 * @param {{iconMapSh?: boolean, iconMapLua?: boolean}} [options] set either to true to also
 *   install the helper of that name; both false (the default) installs the font only
 */
export function install(
  replaceInScriptPath,
  refreshSketchybar = true,
  { iconMapSh = false, iconMapLua = false } = {}
) {
  const { iconMapBashFn } = build();

  fs.copyFileSync(
    "./dist/sketchybar-app-font.ttf",
    `${process.env.HOME}/Library/Fonts/sketchybar-app-font.ttf`
  );

  if (replaceInScriptPath) {
    const pathToScript = path.resolve(replaceInScriptPath);
    const scriptContents = fs.readFileSync(pathToScript, "utf8");
    const startMarkerIndex = scriptContents.indexOf(startMarker);
    const endMarkerIndex = scriptContents.indexOf(endMarker);
    if (startMarkerIndex === -1 || endMarkerIndex === -1) {
      console.error(
        `Could not find ${startMarker} or ${endMarker} in ${pathToScript}`
      );
      process.exit(1);
    }
    const newScriptContents =
      scriptContents.slice(0, startMarkerIndex) +
      iconMapBashFn +
      scriptContents.slice(endMarkerIndex + endMarker.length);
    fs.writeFileSync(pathToScript, newScriptContents, "utf8");
  }

  if (iconMapSh) {
    fs.copyFileSync(
      "./dist/icon_map.sh",
      `${process.env.HOME}/.config/sketchybar/helpers/icon_map.sh`
    );
  }
  if (iconMapLua) {
    fs.copyFileSync(
      "./dist/icon_map.lua",
      `${process.env.HOME}/.config/sketchybar/helpers/icon_map.lua`
    );
  }

  if (refreshSketchybar) {
    execSync("sketchybar --reload");
  }
}

// only execute if run directly (ESM)
// use url instead of __filename to support pnpm
const usage = `usage: install.js [script.sh] [--icon-map-sh] [--icon-map-lua]

  Installs the font only. Every other install target is opt-in.

  script.sh         replace the marked section in this file with the icon map function
  --icon-map-sh     also install the icon_map.sh helper
  --icon-map-lua    also install the icon_map.lua helper`;

const knownFlags = new Set(["--icon-map-sh", "--icon-map-lua"]);

/** Splits argv into the script path and the install options; exits on an unknown flag */
export function parseArgs(args) {
  const positional = [];
  const flags = new Set();
  for (const arg of args) {
    if (arg === "--") continue; // pnpm separator
    if (arg.startsWith("--")) flags.add(arg);
    else positional.push(arg);
  }
  const unknown = [...flags].filter((flag) => !knownFlags.has(flag));
  if (unknown.length > 0) {
    console.error(`unknown option: ${unknown.join(", ")}\n\n${usage}`);
    process.exit(1);
  }
  return {
    scriptPath: positional[0],
    options: {
      iconMapSh: flags.has("--icon-map-sh"),
      iconMapLua: flags.has("--icon-map-lua"),
    },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
  const { scriptPath, options } = parseArgs(process.argv.slice(2));
  install(scriptPath, true, options);
}
