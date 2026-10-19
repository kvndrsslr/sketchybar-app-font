import fs from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * OpenType 'meta' table, private data-map tag.
 * The spec requires privately-defined metadata tags to use uppercase letters/digits.
 */
export const metaTag = "APPM";
export const metaSchemaVersion = 1;
export const fontFileName = "sketchybar-app-font.ttf";

const PUA_START = 0xe000;
const PUA_END = 0xf8ff;

function readTables(buf) {
	const tables = new Map();
	for (let i = 0; i < buf.readUInt16BE(4); i++) {
		const o = 12 + i * 16;
		tables.set(buf.toString("latin1", o, o + 4), {
			offset: buf.readUInt32BE(o + 8),
			length: buf.readUInt32BE(o + 12),
		});
	}
	return tables;
}

/** codepoint -> glyph id, from the best available cmap subtable */
function readCmap(buf, tables) {
	const cmap = tables.get("cmap");
	let best = null;
	for (let i = 0; i < buf.readUInt16BE(cmap.offset + 2); i++) {
		const r = cmap.offset + 4 + i * 8;
		const platformID = buf.readUInt16BE(r);
		const encodingID = buf.readUInt16BE(r + 2);
		const offset = cmap.offset + buf.readUInt32BE(r + 4);
		const score =
			platformID === 3 && encodingID === 10 ? 6 :
			platformID === 0 && encodingID === 4 ? 5 :
			platformID === 0 && encodingID === 3 ? 4 :
			platformID === 3 && encodingID === 1 ? 3 :
			platformID === 1 && encodingID === 0 ? 1 : 0;
		if (score > 0 && (!best || score > best.score)) best = { score, offset };
	}
	if (!best) throw new Error("no usable cmap subtable found");

	const map = new Map();
	const format = buf.readUInt16BE(best.offset);
	if (format === 4) {
		const segCount = buf.readUInt16BE(best.offset + 6) / 2;
		const endCodes = best.offset + 14;
		const startCodes = endCodes + segCount * 2 + 2;
		const idDeltas = startCodes + segCount * 2;
		const idRangeOffsets = idDeltas + segCount * 2;
		for (let s = 0; s < segCount; s++) {
			const end = buf.readUInt16BE(endCodes + s * 2);
			const start = buf.readUInt16BE(startCodes + s * 2);
			const delta = buf.readInt16BE(idDeltas + s * 2);
			const rangeOffset = buf.readUInt16BE(idRangeOffsets + s * 2);
			const rangeOffsetPos = idRangeOffsets + s * 2;
			for (let c = start; c <= end && c !== 0xffff; c++) {
				let gid;
				if (rangeOffset === 0) {
					gid = (c + delta) & 0xffff;
				} else {
					gid = buf.readUInt16BE(rangeOffsetPos + rangeOffset + (c - start) * 2);
					if (gid !== 0) gid = (gid + delta) & 0xffff;
				}
				if (gid !== 0) map.set(c, gid);
			}
		}
	} else if (format === 12) {
		for (let i = 0; i < buf.readUInt32BE(best.offset + 12); i++) {
			const g = best.offset + 16 + i * 12;
			const start = buf.readUInt32BE(g);
			const end = buf.readUInt32BE(g + 4);
			const startGlyph = buf.readUInt32BE(g + 8);
			for (let c = start; c <= end; c++) map.set(c, startGlyph + (c - start));
		}
	} else {
		throw new Error(`unsupported cmap subtable format ${format}`);
	}
	return map;
}

/** glyph id -> glyph name, from a format 2.0 'post' table */
function readPostNames(buf, tables) {
	const post = tables.get("post");
	if (buf.readUInt32BE(post.offset) !== 0x00020000) {
		throw new Error("expecting a format 2.0 'post' table to resolve glyph names");
	}
	const numGlyphs = buf.readUInt16BE(post.offset + 32);
	const indexes = post.offset + 34;
	let needed = 0;
	for (let gid = 0; gid < numGlyphs; gid++) {
		needed = Math.max(needed, buf.readUInt16BE(indexes + gid * 2) - 257);
	}
	let cursor = indexes + numGlyphs * 2;
	const names = [];
	while (names.length < needed && cursor < post.offset + post.length) {
		const length = buf[cursor];
		names.push(buf.toString("latin1", cursor + 1, cursor + 1 + length));
		cursor += 1 + length;
	}
	return Array.from({ length: numGlyphs }, (_, gid) => {
		const index = buf.readUInt16BE(indexes + gid * 2);
		return index < 258 ? null : (names[index - 258] ?? null);
	});
}

/**
 * Reads the codepoint the font maps each icon glyph (glyph name ':icon:') to,
 * plus the codepoints of every other glyph in a Private Use Area.
 */
export function readIconCodepoints(fontBuffer) {
	const tables = readTables(fontBuffer);
	const cmap = readCmap(fontBuffer, tables);
	const names = readPostNames(fontBuffer, tables);

	/** @type {Map<string, number>} glyph name -> codepoint */
	const icons = new Map();
	/** @type {Map<string, number>} codepoint -> glyph name (PUA only) */
	const alwaysAvailable = new Map();
	for (const [codepoint, gid] of cmap) {
		const name = names[gid];
		if (name === null || name === undefined) continue;
		if (name.length > 2 && name.startsWith(":") && name.endsWith(":")) {
			if (!icons.has(name)) icons.set(name, codepoint);
		}
		if (codepoint >= PUA_START && codepoint <= PUA_END) alwaysAvailable.set(name, codepoint);
	}
	return { icons, alwaysAvailable };
}

export function buildMapping(fontPath, mappingsDir) {
	const { icons, alwaysAvailable } = readIconCodepoints(fs.readFileSync(fontPath));

	const missing = [];
	const entries = [...alwaysAvailable.entries()]
		.sort((a, b) => a[1] - b[1])
		.map(([ligature, codepoint]) => [ligature, codepoint, null]);
	const byLigature = new Map(entries.map((entry) => [entry[0], entry]));

	for (const file of fs.readdirSync(mappingsDir).sort()) {
		const entry = byLigature.get(file);
		if (!entry) {
			missing.push(file);
			continue;
		}
		const appNames = fs
			.readFileSync(`${mappingsDir}/${file}`, "utf8")
			.trim()
			.replaceAll('"', "")
			.split(" | ");
		entry[2] = appNames;
	}
	if (missing.length > 0) {
		throw new Error(
			`mappings without a codepoint in ${fontPath} (rebuild the font first): ${missing.join(", ")}`
		);
	}
	for (const ligature of icons.keys()) {
		if (!byLigature.has(ligature)) {
			throw new Error(`font glyph ${ligature} has no entry in the mapping`);
		}
	}
	return entries;
}

function buildMetaTable(payload) {
	const headerLength = 16 + 12;
	const table = Buffer.alloc(headerLength + payload.length);
	table.writeUInt32BE(1, 0); // version
	table.writeUInt32BE(0, 4); // flags
	table.writeUInt32BE(0, 8); // reserved
	table.writeUInt32BE(1, 12); // dataMapsCount
	table.write(metaTag, 16, 4, "latin1");
	table.writeUInt32BE(headerLength, 20); // dataOffset, from start of the table
	table.writeUInt32BE(payload.length, 24);
	payload.copy(table, headerLength);
	return table;
}

/** nameID 5 values must begin with "Version <number>.<number>" (OpenType 'name' spec) */
const versionNameID = 5;

function encodeNameValue(platformID, value) {
	// platform 0 (Unicode) and 3 (Windows) use UTF-16BE, platform 1 (Macintosh) is single byte
	if (platformID === 0 || platformID === 3) {
		const bytes = Buffer.from(value, "utf16le");
		bytes.swap16();
		return bytes;
	}
	return Buffer.from(value, "latin1");
}

/**
 * Rewrites the 'name' table with a new version string, keeping every other record as-is.
 * The storage area is rebuilt, so all string offsets are recomputed.
 */
function buildNameTable(buf, tables, version) {
	const name = tables.get("name");
	const count = buf.readUInt16BE(name.offset + 2);
	const storage = name.offset + buf.readUInt16BE(name.offset + 4);

	const records = [];
	for (let i = 0; i < count; i++) {
		const record = name.offset + 6 + i * 12;
		const platformID = buf.readUInt16BE(record);
		const encodingID = buf.readUInt16BE(record + 2);
		const languageID = buf.readUInt16BE(record + 4);
		const nameID = buf.readUInt16BE(record + 6);
		const length = buf.readUInt16BE(record + 8);
		const offset = buf.readUInt16BE(record + 10);
		const value = buf.subarray(storage + offset, storage + offset + length);
		records.push({
			platformID,
			encodingID,
			languageID,
			nameID,
			bytes: nameID === versionNameID ? encodeNameValue(platformID, `Version ${version}`) : Buffer.from(value),
		});
	}
	if (!records.some((record) => record.nameID === versionNameID)) {
		records.push({
			platformID: 3,
			encodingID: 1,
			languageID: 0x409,
			nameID: versionNameID,
			bytes: encodeNameValue(3, `Version ${version}`),
		});
	}
	records.sort(
		(a, b) =>
			a.platformID - b.platformID || a.encodingID - b.encodingID ||
			a.languageID - b.languageID || a.nameID - b.nameID
	);

	const storageOffset = 6 + records.length * 12;
	const storageLength = records.reduce((n, record) => n + record.bytes.length, 0);
	if (storageOffset + storageLength > 0xffff) {
		throw new Error("'name' table exceeds 64KiB");
	}
	const table = Buffer.alloc(pad4(storageOffset + storageLength));
	table.writeUInt16BE(0, 0); // version
	table.writeUInt16BE(records.length, 2);
	table.writeUInt16BE(storageOffset, 4);
	let cursor = 0;
	records.forEach((record, i) => {
		const o = 6 + i * 12;
		table.writeUInt16BE(record.platformID, o);
		table.writeUInt16BE(record.encodingID, o + 2);
		table.writeUInt16BE(record.languageID, o + 4);
		table.writeUInt16BE(record.nameID, o + 6);
		table.writeUInt16BE(record.bytes.length, o + 8);
		table.writeUInt16BE(cursor, o + 10);
		record.bytes.copy(table, storageOffset + cursor);
		cursor += record.bytes.length;
	});
	return table;
}

/**
 * Sets 'head'.fontRevision (Fixed 16.16, major.minor) from the release version, so fontconfig
 * and friends do not report a version contradicting the version string in the 'name' table.
 */
function buildHeadTable(headTable, version) {
	const head = Buffer.from(headTable);
	const [major, minor] = version.split(".").map(Number);
	const revision = (major + minor / 10 ** String(minor).length) * 0x10000;
	if (!Number.isFinite(revision) || revision < 0 || revision > 0xffffffff) {
		throw new Error(`cannot derive 'head'.fontRevision from version ${version}`);
	}
	head.writeUInt32BE(Math.round(revision), 4);
	return head;
}

const pad4 = (n) => (n + 3) & ~3;

function checksum(buf) {
	let sum = 0;
	for (let i = 0; i < buf.length; i += 4) {
		const word =
			((buf[i] ?? 0) << 24) | ((buf[i + 1] ?? 0) << 16) | ((buf[i + 2] ?? 0) << 8) | (buf[i + 3] ?? 0);
		sum = (sum + (word >>> 0)) >>> 0;
	}
	return sum;
}

/** Writes a new sfnt file with the given tables (replaces 'meta' if present) */
function writeFont(tables) {
	const sorted = [...tables.entries()]
		.map(([tag, data]) => ({ tag, data }))
		.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

	const head = sorted.find((t) => t.tag === "head");
	head.data.writeUInt32BE(0, 8); // checkSumAdjustment is written last

	let offset = 12 + sorted.length * 16;
	for (const table of sorted) {
		table.offset = offset;
		table.checksum = checksum(table.data);
		offset += pad4(table.data.length);
	}
	const font = Buffer.alloc(offset);
	const entrySelector = Math.floor(Math.log2(sorted.length));
	const searchRange = 16 * 2 ** entrySelector;
	font.writeUInt32BE(0x00010000, 0);
	font.writeUInt16BE(sorted.length, 4);
	font.writeUInt16BE(searchRange, 6);
	font.writeUInt16BE(entrySelector, 8);
	font.writeUInt16BE(16 * sorted.length - searchRange, 10);
	sorted.forEach((table, i) => {
		const o = 12 + i * 16;
		font.write(table.tag, o, 4, "latin1");
		font.writeUInt32BE(table.checksum, o + 4);
		font.writeUInt32BE(table.offset, o + 8);
		font.writeUInt32BE(table.data.length, o + 12);
		table.data.copy(font, table.offset);
	});
	font.writeUInt32BE((0xb1b0afba - checksum(font)) >>> 0, head.offset + 8);
	return font;
}

/**
 * Annotates the built font with the app mapping, so that tool integrations can
 * derive it from the font alone:
 *
 *   { "version": 1, "release": "2.0.87", "icons": [[ligature, codepoint, appNames | null], ...] }
 *
 * Stored as a private data map in the OpenType 'meta' table (tag APPM). The release is
 * also written to the font's version string (nameID 5), so the font identifies itself.
 */
export function annotateFont(fontPath = `./dist/${fontFileName}`, mappingsDir = "./mappings") {
	const release = JSON.parse(
		fs.readFileSync(new URL("./package.json", import.meta.url), "utf8")
	).version;
	const entries = buildMapping(fontPath, mappingsDir);
	const payload = Buffer.from(
		JSON.stringify({ version: metaSchemaVersion, release, icons: entries }),
		"utf8"
	);

	const buf = fs.readFileSync(fontPath);
	const directory = readTables(buf);
	const tables = new Map();
	for (const [tag, { offset, length }] of directory) {
		tables.set(tag, Buffer.from(buf.subarray(offset, offset + length)));
	}
	tables.set("head", buildHeadTable(tables.get("head"), release));
	tables.set("name", buildNameTable(buf, directory, release));
	tables.set("meta", buildMetaTable(payload));

	const font = writeFont(tables);
	fs.writeFileSync(fontPath, font);

	const annotated = entries.filter((entry) => entry[2] !== null).length;
	console.log(
		`Annotated ${entries.length} glyphs (${annotated} with app mappings) via '${metaTag}' ` +
			`as version ${release}: ${buf.length} -> ${font.length} bytes`
	);
	return { glyphs: entries.length, annotated, release, payloadBytes: payload.length };
}

// only execute if run directly (ESM)
// use url instead of __filename to support pnpm
if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
	annotateFont();
}
