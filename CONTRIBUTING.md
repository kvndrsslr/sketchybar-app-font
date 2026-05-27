# Contributing to sketchybar-app-font

Thanks for wanting to contribute! Adding an icon is straightforward — here's everything you need to know.

> **Can't contribute yourself?** Open an [icon request issue](https://github.com/kvndrsslr/sketchybar-app-font/issues/new/choose) and someone from the community may pick it up.

---

## How to add an icon

_(Core method originally from [simple-bar #164](https://github.com/Jean-Tinland/simple-bar/issues/164#issuecomment-896912216))_

### 1. Get or draw the SVG

- Use the app's original vector icon if available.
- If no vector exists, redraw it in [Figma](https://www.figma.com) or any vector editor. It doesn't need to be pixel-perfect — icons are displayed at a very small size.
- **All solid shapes become part of the glyph.** Anything you want to appear as a hole must be a proper mask/clip-path. Colors (including transparency) are ignored.

#### Icon style: glyph vs. container

**Prefer the logo/glyph only** — draw the symbol without any surrounding background shape (circle, rounded square, etc.). This keeps the icon set consistent and lets users apply their own background styling in sketchybar.

A background container is acceptable in two cases:
1. The container is an integral part of the official logo (e.g. the shape itself defines the brand).
2. The logo consists primarily of thin lines and the container meaningfully improves readability at small sizes.

### 2. Set the viewBox to 24×24

Your SVG must have `viewBox="0 0 24 24"` (or equivalent). The build tool normalises the glyph size, but a correct viewBox ensures consistent proportions.

### 3. Optimise with SVGOMG

Run the SVG through [SVGOMG](https://jakearchibald.github.io/svgomg/) or similar tools to strip unnecessary metadata. Keep the defaults — just paste the SVG and copy the output.

### 4. Add the SVG file

Place the file in `svgs/` using this naming convention:

```
svgs/:snake_case_app_name:.svg
```

Examples: `svgs/:visual_studio_code:.svg`, `svgs/:arc:.svg`

### 5. Add a mapping file

Create a file in `mappings/` with the **same name** (no `.svg` extension):

```
mappings/:snake_case_app_name:
```

The file content lists every app name variant that should resolve to this icon, separated by `|`:

```
"App Name" | "App Name (variant)"
```

Use the exact string as it appears in macOS — check Activity Monitor or the menu bar. Wildcard `*` is supported for suffix-matching (e.g. `"My App*"` matches `"My App 2"`, `"My App Pro"`, etc.).

### 6. Test locally

```bash
pnpm install          # first time only
pnpm run build:dev
```

Open <http://localhost:3003> in your browser and verify:

- Your glyph appears and looks correct
- No errors in the terminal output

### 7. Troubleshooting incompatible SVG features

`svgtofont` doesn't support all SVG features. If the build fails or the glyph looks wrong, try:

```bash
npx oslllo-svg-fixer -s svgs-to-fix -d svgs
```

Place the problematic SVG in `svgs-to-fix/`, run the command, then test again with `pnpm run build:dev`.

---

## Submitting a PR

- The PR template includes a checklist — please tick everything that applies.
- If your PR addresses an open icon request issue, add `Closes #<issue-number>` to the PR description. GitHub will close the issue automatically when the PR is merged.
- PRs are validated automatically in CI (`pnpm run validate`). Fix any reported errors before requesting review.

All PRs are merged as quickly as possible.
