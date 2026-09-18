# sketchybar-app-font

A ligature-based symbol font and a mapping function for sketchybar, inspired by simple-bar's usage of community-contributed minimalistic app icons.
Please feel free to contribute icons or add applications to the mappings through PRs.

If you can't contribute yourself, open an [icon request issue](https://github.com/kvndrsslr/sketchybar-app-font/issues/new/choose) — someone from the community may pick it up. Note that the maintainer is not committed to working on those requests personally.

All PRs are merged as quickly as possible. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guide.

## CLI Usage

```bash
# install dependencies
pnpm install
# - build the files
# - install the font to: $HOME/Library/Fonts/sketchybar-app-font.ttf
# - install the icon map script to: $HOME/.config/sketchybar/icon_map.sh
pnpm run build:install
# - build the files
# - install the font to: $HOME/Library/Fonts/sketchybar-app-font.ttf
# - replace the icon map function in the given script
# NOTE: On macOS, omit the -- separator to avoid argument parsing issues
pnpm run build:install $HOME/.config/sketchybar/scripts/my-script.sh
# same as build:install but watches changes to files in ./svgs and ./mappings and refires
pnpm run build:dev
pnpm run build:dev $HOME/.config/sketchybar/scripts/my-script.sh
# - build the files
# - install only the font to: $HOME/Library/Fonts/sketchybar-app-font.ttf
# - no icon map helpers are written, existing ones are left untouched
pnpm run build:install:font
```

The install script accepts these options (also usable with `build:dev`):

| option | effect |
| --- | --- |
| `--font-only` | install only the font, skip both icon map helpers |
| `--skip-icon-map-sh` | leave an existing `icon_map.sh` untouched |
| `--skip-icon-map-lua` | leave an existing `icon_map.lua` untouched |

## Configure Sketchybar

### Using icon_map.sh

```bash
source ./path/to/icon_map.sh

__icon_map "${app_name}"
symbol_ligature="${icon_result}"
```

### Set up auto-replacing the icon map function in your own script

1. Mark where the function should be inserted to:

```bash
### START-OF-ICON-MAP
# Here be the function
### END-OF-ICON-MAP
```

1. Run the install script with the argument pointing at the path of the file that has the markers:

```bash
# NOTE: On macOS, omit the -- separator
pnpm run build:install $HOME/.config/sketchybar/scripts/my-script.sh
```

### Batch lookup

`icon_map.sh` can also be called directly with multiple app names if you prefer to not source or inline it inside your script.

```bash
# Returns space-separated icon ligatures in the same order as the arguments
icons=$(./path/to/icon_map.sh "Safari" "Finder" "Terminal")
# ":safari: :finder: :terminal: "
```

## Deriving the app mapping from the font

`dist/sketchybar-app-font.ttf` is self-describing. Every icon glyph is mapped to a Private Use Area
codepoint, and the app mapping is embedded in the font's `meta` table under the private data map tag
`APPM`. Tool integrations can derive the whole mapping from the font alone — no need to ship or read
`icon_map.*`.

Schema of the `APPM` data map (JSON, UTF-8):

```json
{ "version": 1, "release": "2.0.87", "icons": [[ligature, codepoint, appNames | null], ...] }
```

- `version` — schema version of this payload (currently `1`).
- `release` — the release this font was built from. The same version is written to the font's version
  string (`nameID 5`) and `head.fontRevision`, so use it to detect that a cached lookup is stale.
- `ligature` — the glyph's ligature, e.g. `:safari:` (same name as the `mappings/` file). Ligatures
  still substitute, so existing configs keep working.
- `codepoint` — the glyph's Private Use Area codepoint, e.g. `60412` (`U+EBFC`) for `:safari:`.
- `appNames` — the app names that resolve to this icon (a trailing `*` means prefix match), or
  `null` for utility icons without an app mapping.

Codepoints are assigned in SVG directory order and will shift when icons are added, so derive them
at runtime instead of hardcoding them.

Reading the mapping (no font libraries required):

```js
const buf = fs.readFileSync("sketchybar-app-font.ttf");
const tables = new Map();
for (let i = 0; i < buf.readUInt16BE(4); i++) {
    const o = 12 + i * 16;
    tables.set(buf.toString("latin1", o, o + 4), buf.readUInt32BE(o + 8));
}
const meta = tables.get("meta");
const dataMap = meta + 16; // first (and only) data map record
const data = meta + buf.readUInt32BE(dataMap + 4);
const { icons } = JSON.parse(buf.subarray(data, data + buf.readUInt32BE(dataMap + 8)));

const byAppName = new Map();
for (const [ligature, codepoint, appNames] of icons) {
    for (const appName of appNames ?? []) {
        byAppName.set(appName.replace(/\*$/, ""), String.fromCodePoint(codepoint));
    }
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide on adding icons and submitting PRs.
