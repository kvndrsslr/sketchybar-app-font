# sketchybar-app-font
A ligature-based symbol font and a mapping function for sketchybar, inspired by simple-bar's usage of community-contributed minimalistic app icons.
Please feel free to contribute icons or add applications to the mappings through PRs.

If you can't contribute yourself, you can ask for icons in issues and *maybe* someone will work on those issues, but please note that I'm not committed to work on those issues myself.

However, I will try to merge all PRs asap.

## Contribution Guideline

*(Core method copied from https://github.com/Jean-Tinland/simple-bar/issues/164#issuecomment-896912216)*

For each icon I'm following these steps:

1. I'm getting the original icon or, if not in a vector format I'm redrawing it in [Figma](https://www.figma.com). No need to be extremely precise as it is displayed in a really small size)
2. I'm setting the new icon in a `24x24` viewbox
3. Then I'm optimising it using [SVGOMG](https://jakearchibald.github.io/svgomg/)
4. Add the icon to /svgs/ folder, using a snake_case name surrounded by colons and a '.svg' extension
5. Add a file to /mappings/ using the same name but without the '.svg' extension. This file indicates which app names should match the icon. The format is `"App Name 1" | "App Name 2"`


## Using icon_map_fn.sh

```bash
source ./path/to/icon_map_fn.sh

icon_map "${app_name}"
symbol_ligature="${icon_result}"
```
