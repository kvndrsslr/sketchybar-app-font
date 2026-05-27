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
```

## Configure Sketchybar

### Using icon_map.sh

```bash
source ./path/to/icon_map.sh

__icon_map "${app_name}"
symbol_ligature="${icon_result}"
```

### Batch lookup

`icon_map.sh` can also be called directly with multiple app names if you prefer to not source or inline it inside your script.

```bash
# Returns space-separated icon ligatures in the same order as the arguments
icons=$(./path/to/icon_map.sh "Safari" "Finder" "Terminal")
# ":safari: :finder: :terminal: "
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
# NOTE: On macOS, omit the -- separator
pnpm run build:install $HOME/.config/sketchybar/scripts/my-script.sh
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide on adding icons and submitting PRs.
