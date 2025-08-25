# sketchybar-app-font

A ligature-based symbol font and a mapping function for sketchybar, inspired by simple-bar's usage of community-contributed minimalistic app icons.
Please feel free to contribute icons or add applications to the mappings through PRs.

If you can't contribute yourself, you can ask for icons in issues and _maybe_ someone will work on those issues, but please note that I'm not committed to work on those issues myself.

However, I will try to merge all PRs asap.

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
pnpm run build:install -- $HOME/.config/sketchybar/scripts/my-script.sh
# same as build:install but watches changes to files in ./svgs and ./mappings and refires
pnpm run build:dev
pnpm run build:dev -- $HOME/.config/sketchybar/scripts/my-script.sh
```

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

2. Run the install script with the argument pointing at the path of the file that has the markers:

```bash
pnpm run build:install -- $HOME/.config/sketchybar/scripts/my-script.sh
```

## Contribution Guideline

_(Core method copied from <https://github.com/Jean-Tinland/simple-bar/issues/164#issuecomment-896912216>)_

For each icon I'm following these steps:

1. I'm getting the original icon or, if not in a vector format I'm redrawing it in [Figma](https://www.figma.com). No need to be extremely precise as it is displayed in a really small size. All solid shapes will become part of the glyph. Anything you want to mask out needs to be actually masked out in the shape. Colors (including transparent color) don't matter.
2. I'm setting the new icon in a `24x24` viewbox
3. Then I'm optimising it using [SVGOMG](https://jakearchibald.github.io/svgomg/)
4. Add the icon to /svgs/ folder, using a snake_case name surrounded by colons and a '.svg' extension
5. Add a file to /mappings/ using the same name but without the '.svg' extension. This file indicates which app names should match the icon. The format is `"App Name 1" | "App Name 2"`

## Incompatible SVG Features

Unfortunately the `svgtofont` library does not support all SVG Features. Therefore, you should check your icons before submitting by running `pnpm run build:dev`, looking at the command output and sight checking the font glyphs in your browser at <http://localhost:3003>.
You may also want to try the `oslllo-svg-fixer` npm package if you encounter issues with your svg: 
```bash
npx oslllo-svg-fixer -s svgs-to-fix -d svgs
```
