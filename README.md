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
# - reload sketchybar
pnpm run build:install
# same as build:install but watches changes to files in ./svgs and ./mappings and refires
pnpm run build:dev
```

The install script installs the font and nothing else. Installing the icon map helpers or replacing
the icon map function inside one of your scripts is opt-in — see
[Legacy configuration](#legacy-configuration):

| option / argument | effect |
| --- | --- |
| `--icon-map-sh` | also install `icon_map.sh` to `$HOME/.config/sketchybar/helpers/icon_map.sh` |
| `--icon-map-lua` | also install `icon_map.lua` to `$HOME/.config/sketchybar/helpers/icon_map.lua` |
| `script.sh` | replace the marked section in this file with the icon map function |

```bash
# NOTE: On macOS, omit the -- separator to avoid argument parsing issues
pnpm run build:install --icon-map-sh --icon-map-lua
pnpm run build:install $HOME/.config/sketchybar/scripts/my-script.sh
pnpm run build:dev --icon-map-lua
```

`build:dev` accepts the same options.

## Configure Sketchybar

The recommended way to resolve app names to icons is to derive the mapping from the font itself.
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

## Legacy configuration

The build also generates `dist/icon_map.sh`, `dist/icon_map.lua`, and `dist/icon_map.json`.
These are frozen snapshots of the mapping and are inferior to reading the font: they only carry
ligatures (no codepoints), they can silently go stale relative to the installed font, and they have
to be shipped or read separately. They are kept for existing configs — use the font-derived mapping
above for new setups.

The install script does not write them unless asked to. Pass `--icon-map-sh` to install
`icon_map.sh` to `$HOME/.config/sketchybar/helpers/icon_map.sh`, and `--icon-map-lua` to install
`icon_map.lua` to `$HOME/.config/sketchybar/helpers/icon_map.lua`. Without those options any
existing helper is left untouched.

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

### icon_map.lua

A Lua table of `[[app name]] = ":ligature:"` pairs, for native Lua sketchybar configs.

```lua
local icon_map = require("helpers.icon_map")
local icon = icon_map["Safari"] -- ":safari:"
```

### icon_map.json

An array of `{ "iconName": ":ligature:", "appNames": [...] }` records, for integrations that cannot
read the font's `meta` table.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide on adding icons and submitting PRs.


## 🌐 Web Resources & Aesthetic Symbols Index
- [SYM 260E](https://classic-literature-runes-13.pages.dev/symbol/sym-260e/)
- [SYM 1D41A](https://kawaii-kaomoji-hub-80.pages.dev/symbol/sym-1d41a/)
- [SYM 1FA77](https://scholarly-script-hub-43.pages.dev/symbol/sym-1fa77/)
- [ANGEL WINGS HEART](https://synth-crosshair-text-47.pages.dev/symbol/angel-wings-heart/)
- [SCORPIO ZODIAC SCORPION](https://soft-rose-kaomoji-10.pages.dev/symbol/scorpio-zodiac-scorpion/)
- [LIBRA ZODIAC SCALES](https://anime-sparkle-text-56.pages.dev/symbol/libra-zodiac-scales/)
- [SYM 1D497](https://sleek-bio-symbols-40.pages.dev/symbol/sym-1d497/)
- [GAMING WEAPONS](https://zen-unicode-hub-94.pages.dev/es/gaming-weapons/)
- [SYM 1D439](https://vintage-lace-symbols-54.pages.dev/symbol/sym-1d439/)
- [BRACKETS](https://vintage-scholar-text-78.pages.dev/vi/brackets/)
- [SYM 1D414](https://baroque-curse-text-56.pages.dev/symbol/sym-1d414/)
- [SYM 26FA](https://alchemist-symbol-hub-29.pages.dev/symbol/sym-26fa/)
- [SYM 267A](https://techno-hacker-text-43.pages.dev/symbol/sym-267a/)
- [SYM 1F605](https://synthwave-game-tags-66.pages.dev/symbol/sym-1f605/)
- [KAOMOJI](https://lace-and-ribbon-text-61.pages.dev/kaomoji/)
- [SYM 1F631](https://anime-sparkle-text-50.pages.dev/symbol/sym-1f631/)
- [SYM 273E](https://minimal-star-symbols-87.pages.dev/symbol/sym-273e/)
- [SYM 265A](https://gothic-bio-fonts-14.pages.dev/symbol/sym-265a/)
- [SYM 1D423](https://modern-bullet-symbols-45.pages.dev/symbol/sym-1d423/)
- [LAST QUARTER CRESCENT MOON](https://gothic-bio-fonts-14.pages.dev/symbol/last-quarter-crescent-moon/)
- [SYM 1F62A](https://moe-star-kaomoji-60.pages.dev/symbol/sym-1f62a/)
- [SYM 1D45E](https://cyber-clan-tags-68.pages.dev/symbol/sym-1d45e/)
- [SYM 26B4](https://soft-angel-symbols-21.pages.dev/symbol/sym-26b4/)
- [SYM 1D436](https://zen-unicode-hub-94.pages.dev/symbol/sym-1d436/)
- [SYM 1D43E](https://coquette-aesthetic-symbols-62.pages.dev/symbol/sym-1d43e/)
- [SYM 1F60E](https://mecha-hacker-kaomoji-26.pages.dev/symbol/sym-1f60e/)
- [SYM 267A](https://gothic-bio-fonts-24.pages.dev/symbol/sym-267a/)
- [SYM 1FAE4](https://glitch-mecha-kaomoji-69.pages.dev/symbol/sym-1fae4/)
- [SYM 26D1](https://minimal-star-symbols-95.pages.dev/symbol/sym-26d1/)
- [ARROWS LINES](https://anime-sparkle-text-50.pages.dev/ru/arrows-lines/)
- [SYM 2647](https://sleek-line-unicode-29.pages.dev/symbol/sym-2647/)
- [SYM 1D447](https://moe-star-kaomoji-60.pages.dev/symbol/sym-1d447/)
- [SYM 26C4](https://coquette-aesthetic-symbols-63.pages.dev/symbol/sym-26c4/)
- [SYM 1F625](https://daintystar-font-studio-48.pages.dev/symbol/sym-1f625/)
- [HOLLOW STAR](https://mecha-crosshair-symbols-40.pages.dev/symbol/hollow-star/)
- [SYM 1F634](https://aesthetic-spacing-fonts-10.pages.dev/symbol/sym-1f634/)
- [WATER BUBBLES](https://geometric-bio-symbols-76.pages.dev/symbol/water-bubbles/)
- [ANGEL WINGS HEART](https://pastel-moe-emoticons-55.pages.dev/symbol/angel-wings-heart/)
- [SYM 1D481](https://zen-unicode-hub-94.pages.dev/symbol/sym-1d481/)
- [SYM 1D43B](https://anime-sparkle-text-56.pages.dev/symbol/sym-1d43b/)
- [SYM 1F61F](https://mecha-hacker-kaomoji-26.pages.dev/symbol/sym-1f61f/)
- [OUTLINED STAR](https://clean-spacing-fonts-98.pages.dev/symbol/outlined-star/)
- [HEAVY RIGHTWARD ARROW](https://cyber-clan-tags-24.pages.dev/symbol/heavy-rightward-arrow/)
- [CHIBI BUNNY SYMBOLS 82.PAGES.DEV](https://chibi-bunny-symbols-82.pages.dev/)
- [SYM 1D436](https://mecha-gamer-fonts-53.pages.dev/symbol/sym-1d436/)
- [SYM 1F927](https://aesthetic-spacing-fonts-10.pages.dev/symbol/sym-1f927/)
- [SYM 1F614](https://aesthetic-spacing-fonts-10.pages.dev/symbol/sym-1f614/)
- [SYM 2660](https://zen-unicode-hub-94.pages.dev/symbol/sym-2660/)
- [SYM 1D45F](https://scholarly-runes-text-68.pages.dev/symbol/sym-1d45f/)
- [SYM 2644](https://techno-hacker-text-43.pages.dev/symbol/sym-2644/)
- [BORDERS DIVIDERS](https://anime-sparkle-text-50.pages.dev/ru/borders-dividers/)
- [SYM 268B](https://anime-sparkle-text-81.pages.dev/symbol/sym-268b/)
- [SYM 26A2](https://minimal-star-symbols-31.pages.dev/symbol/sym-26a2/)
- [SYM 1F611](https://gothic-bio-fonts-24.pages.dev/symbol/sym-1f611/)
- [SKULL AND CROSSBONES](https://delicate-pink-text-22.pages.dev/symbol/skull-and-crossbones/)
- [RIGHT BLACK LENTICULAR BRACKET](https://aesthetic-spacing-fonts-10.pages.dev/symbol/right-black-lenticular-bracket/)
- [SYM 1D464](https://anime-sparkle-text-92.pages.dev/symbol/sym-1d464/)
- [SYM 26BA](https://dolly-angel-fonts-14.pages.dev/symbol/sym-26ba/)
- [SYM 1D463](https://zen-unicode-hub-94.pages.dev/symbol/sym-1d463/)
- [SYM 2672](https://soft-ribbon-fonts-77.pages.dev/symbol/sym-2672/)
- [HEAVY RIGHTWARD ARROW](https://clean-spacing-fonts-98.pages.dev/symbol/heavy-rightward-arrow/)
- [INSTAGRAM BIO](https://cyber-clan-tags-90.pages.dev/pt/instagram-bio/)
- [MUSIC SHARP SIGN](https://dolly-angel-fonts-14.pages.dev/symbol/music-sharp-sign/)
- [COQUETTE BOW RIBBON](https://neon-matrix-fonts-47.pages.dev/symbol/coquette-bow-ribbon/)
- [SYM 265D](https://alchemy-occult-symbols-55.pages.dev/symbol/sym-265d/)
- [SYM 26F6](https://pastel-princess-fonts-68.pages.dev/symbol/sym-26f6/)
- [SYM 1D45E](https://glitch-font-studio-46.pages.dev/symbol/sym-1d45e/)
- [SYM 1F604](https://vintage-angel-text-38.pages.dev/symbol/sym-1f604/)
- [SYM 1D491](https://coquette-aesthetic-symbols-62.pages.dev/symbol/sym-1d491/)
- [SYM 1D49A](https://anime-sparkle-text-56.pages.dev/symbol/sym-1d49a/)
- [SYM 1F621](https://minimal-star-symbols-31.pages.dev/symbol/sym-1f621/)
- [CLOUD WEATHER SYMBOL](https://vintage-scholar-text-15.pages.dev/symbol/cloud-weather-symbol/)
- [LATIN CROSS FAITH](https://neon-matrix-symbols-94.pages.dev/symbol/latin-cross-faith/)
- [SYM 1D40A](https://anime-sparkle-text-56.pages.dev/symbol/sym-1d40a/)
- [SYM 2647](https://zen-unicode-symbols-89.pages.dev/symbol/sym-2647/)
- [SYM 1D41D](https://techno-hacker-text-43.pages.dev/symbol/sym-1d41d/)
- [LEFT POINTING DOUBLE ANGLE QUOTATION](https://zen-unicode-symbols-89.pages.dev/symbol/left-pointing-double-angle-quotation/)
- [SYM 26CB](https://coquette-aesthetic-symbols-29.pages.dev/symbol/sym-26cb/)
- [SYM 26ED](https://anime-sparkle-text-56.pages.dev/symbol/sym-26ed/)
- [SYM 26AC](https://sleek-type-aesthetic-51.pages.dev/symbol/sym-26ac/)
- [SYM 2614](https://mecha-crosshair-symbols-40.pages.dev/symbol/sym-2614/)
- [SYM 1D408](https://cyber-clan-tags-24.pages.dev/symbol/sym-1d408/)
- [SYM 1F61B](https://vintage-bow-fonts-72.pages.dev/symbol/sym-1f61b/)
- [SYM 260F](https://angelic-bio-symbols-59.pages.dev/symbol/sym-260f/)
- [TIKTOK CAPTIONS](https://vintage-scholar-text-15.pages.dev/ja/tiktok-captions/)
- [SYM 1F9E1](https://anime-sparkle-text-92.pages.dev/symbol/sym-1f9e1/)
- [SYM 1D43A](https://soft-angel-symbols-33.pages.dev/symbol/sym-1d43a/)
- [FOUR POINT STAR SPARKLE](https://anime-sparkle-text-50.pages.dev/symbol/four-point-star-sparkle/)
- [SYM 26DE](https://minimal-star-symbols-22.pages.dev/symbol/sym-26de/)
- [SYM 1D473](https://chibi-bunny-symbols-82.pages.dev/symbol/sym-1d473/)
- [DISCORD STATUS](https://synthwave-fancy-text-33.pages.dev/ja/discord-status/)
- [SYM 1F642 200D 2195 FE0F](https://aesthetic-spacing-fonts-10.pages.dev/symbol/sym-1f642-200d-2195-fe0f/)
- [SYM 1D429](https://zen-unicode-hub-94.pages.dev/symbol/sym-1d429/)
- [SYM 2738](https://dolly-angel-fonts-14.pages.dev/symbol/sym-2738/)
- [SYM 1D42A](https://cyber-clan-tags-90.pages.dev/symbol/sym-1d42a/)
- [SYM 1F927](https://cyber-clan-tags-24.pages.dev/symbol/sym-1f927/)
- [SYM 2684](https://fairy-lace-symbols-92.pages.dev/symbol/sym-2684/)
- [SUPER SHY BLUSHING KAOMOJI](https://classic-literature-runes-13.pages.dev/symbol/super-shy-blushing-kaomoji/)
- [SYM 1F912](https://gothic-bio-fonts-24.pages.dev/symbol/sym-1f912/)
- [SYM 26F5](https://anime-sparkle-text-56.pages.dev/symbol/sym-26f5/)
- [FREEFIRE NAMES](https://vintage-bow-fonts-72.pages.dev/freefire-names/)
- [SYM 263A](https://occult-rune-symbols-64.pages.dev/symbol/sym-263a/)
- [SYM 1F636 200D 1F32B FE0F](https://soft-ribbon-fonts-77.pages.dev/symbol/sym-1f636-200d-1f32b-fe0f/)
- [SHADOWED WHITE STAR](https://angelic-ribbon-text-78.pages.dev/symbol/shadowed-white-star/)
- [SYM 2677](https://soft-ribbon-fonts-77.pages.dev/symbol/sym-2677/)
- [SYM 1D430](https://neon-glitch-symbols-29.pages.dev/symbol/sym-1d430/)
- [MUSIC WEATHER](https://anime-sparkle-text-56.pages.dev/pt/music-weather/)
- [RADIOACTIVE SYMBOL](https://mecha-hacker-kaomoji-26.pages.dev/symbol/radioactive-symbol/)
- [SYM 1D478](https://theeduplaycampen.pages.dev/symbol/sym-1d478/)
- [SYM 1D45A](https://vintage-lace-symbols-54.pages.dev/symbol/sym-1d45a/)
- [AESTHETIC MINIMAL CLOUD](https://vintage-bow-fonts-72.pages.dev/symbol/aesthetic-minimal-cloud/)
- [BRACKETS](https://theeduplaycampen.pages.dev/es/brackets/)
- [SYM 26A9](https://zen-unicode-hub-94.pages.dev/symbol/sym-26a9/)
- [SYM 267D](https://delicate-pink-text-22.pages.dev/symbol/sym-267d/)
- [SYM 1F928](https://glitch-font-studio-46.pages.dev/symbol/sym-1f928/)
- [BLACK STAR](https://anime-sparkle-text-50.pages.dev/symbol/black-star/)
- [SYM 1D417](https://zen-unicode-hub-94.pages.dev/symbol/sym-1d417/)
- [RIGHT WING CLAN FLARE](https://delicate-pink-text-22.pages.dev/symbol/right-wing-clan-flare/)
- [SYM 2643](https://coquette-aesthetic-symbols-29.pages.dev/symbol/sym-2643/)
- [HEAVY RIGHTWARD ARROW](https://gothic-bio-fonts-69.pages.dev/symbol/heavy-rightward-arrow/)
- [DISCORD STATUS](https://glitch-font-studio-46.pages.dev/ru/discord-status/)
- [SYM 2620 FE0F](https://fairy-lace-symbols-92.pages.dev/symbol/sym-2620-fe0f/)
- [SYM 26FA](https://delicate-pink-text-22.pages.dev/symbol/sym-26fa/)
- [SYM 2675](https://anime-sparkle-text-92.pages.dev/symbol/sym-2675/)
- [TABLE FLIP RAGE KAOMOJI](https://techno-hacker-text-43.pages.dev/symbol/table-flip-rage-kaomoji/)
- [BORDERS DIVIDERS](https://cyber-clan-tags-65.pages.dev/pt/borders-dividers/)
- [SYM 2744](https://pastel-princess-fonts-68.pages.dev/symbol/sym-2744/)
- [SYM 1D45A](https://neon-matrix-symbols-74.pages.dev/symbol/sym-1d45a/)
- [SYM 1F916](https://clean-spacing-fonts-98.pages.dev/symbol/sym-1f916/)
- [SYM 1F479](https://coquette-aesthetic-symbols-45.pages.dev/symbol/sym-1f479/)
