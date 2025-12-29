import { execSync } from "node:child_process";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { validate } from "./validate.js";

export const startMarker = "### START-OF-ICON-MAP";
export const endMarker = "### END-OF-ICON-MAP";

export function build() {
	// Validate mappings before building
	console.log("Validating mappings...");
	validate();
	console.log("Building icon font...");
	try {
		execSync("./node_modules/.bin/svgtofont -s svgs/ -o dist/", {
			stdio: ["inherit", "inherit", "pipe"], // capture stderr only
		});
	} catch (error) {
		// Try to extract filename from error output
		const stderr = error.stderr?.toString() || "";
		const match = stderr.match(/glyph "([^"]+)"/);

		// Show the original error
		if (stderr) {
			process.stderr.write(stderr);
		}

		if (match) {
			console.error(`\n${"-".repeat(60)}`);
			console.error(`Failed to process SVG: ${match[1]}`);
			console.error(
				"This SVG has incompatible features for font conversion."
			);
			console.error(
				`Try fixing with: npx oslllo-svg-fixer -s svgs/${match[1]}.svg -d svgs`
			);
			console.error("-".repeat(60) + "\n");
		}
		process.exit(1);
	}

	const iconMap = fs.readdirSync("./mappings").map((file) => {
		const iconName = file.replace(".svg", "");
		const appNames = fs.readFileSync(`./mappings/${file}`, "utf8").trim();
		return {
			iconName,
			appNames,
		};
	});

	const iconMapBashFn = `
${startMarker}
function __icon_map() {
    case "$1" in
${iconMap
	.map(
		({ appNames, iconName }) =>
			`   ${appNames})
        icon_result="${iconName}"
        ;;`
	)
	.join("\n")}
    *)
        icon_result=":default:"
        ;;
    esac
}
${endMarker}`;

	fs.writeFileSync(
		"./dist/icon_map.sh",
		`#!/usr/bin/env bash
${iconMapBashFn}
`,
		"utf8"
	);

	const iconMapLua = `return {
${iconMap
	.map(({ appNames, iconName }) =>
		appNames
			.split("|")
			// remove all * in mappings
			.map((app) => app.replace("*", ""))
			.map((app) => {
				const cleanApp = app.trim();
				const cleanAppOnly = cleanApp.replace(/"/g, "");
				// Escape Lua string by wrapping in [[ ]] for literal strings
				return `\t[ [[${cleanAppOnly}]] ] = "${iconName}",`;
			})
			.join("\n")
	)
	.join("\n")}
}`;

	fs.writeFileSync("./dist/icon_map.lua", iconMapLua, "utf8");

	// chmod +x ./dist/icon_map.sh
	fs.chmodSync("./dist/icon_map.sh", 0o755);

	const iconMapJson = JSON.stringify(
		iconMap.map((a) => {
			return {
				iconName: a.iconName,
				appNames: a.appNames.replaceAll('"', "").split(" | "),
			};
		}),
		null,
		4
	);

	fs.writeFileSync("./dist/icon_map.json", iconMapJson, "utf-8");

	console.log(`\nSuccessfully built ${iconMap.length} icon mappings`);

	return { iconMapBashFn };
}

// only execute if run directly (ESM)
// use url instead of __filename to support pnpm
if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
	build();
}
