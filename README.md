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

### Batch lookup

`icon_map.sh` can also be called directly with multiple app names if you prefer to not source or inline it inside your script.

```bash
# Returns space-separated icon ligatures in the same order as the arguments
icons=$(./path/to/icon_map.sh "Safari" "Finder" "Terminal")
# ":safari: :finder: :terminal: "
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide on adding icons and submitting PRs.

## Maintainer automation

PR validation, merging, and releases are fully automated via GitHub Actions so the repo can be run hands-off:

- **`validate.yml`** runs on every PR — including fork PRs — and only has a read-only token. It validates SVGs and mappings. There are **no custom/user secrets in this repo**; the only secret referenced anywhere is GitHub's auto-generated `GITHUB_TOKEN`, so running workflows on fork PRs is safe.
- **`auto-merge.yml`** is triggered via `workflow_run` when `Validate PR` succeeds. It runs in the base-repository context (so it can hold a write token) and only performs GitHub API operations — it never checks out or runs PR code. It automatically merges eligible icon-only PRs.
- **`auto-release.yml`** runs daily (06:00 UTC, or manually via `workflow_dispatch`). If `main` has commits since the latest tag, it bumps the patch version, pushes the tag, and dispatches **`release.yml`** to build and cut a GitHub release.

Two manual settings must be checked once in **Settings → Actions → General** (public repo):

1. **Approval for running fork pull request workflows from contributors** — fork PR workflows always run with a read-only token and no secrets, so the only question is whether brand-new contributors prompt an approval. To be fully hands-off for newcomers, set it to **"Require approval for first-time contributors who are new to GitHub"** (least restrictive). Note the API warning: anyone who gets any merge is never re-gated, so a malicious actor could get one tiny PR in and then run unapproved workflows — acceptable here since the fork token has no secrets and runs on ephemeral GitHub-hosted runners only.
2. **Workflow permissions** — leave on the restricted default ("Read repository contents and packages permissions"). `auto-merge.yml` declares `contents: write` / `pull-requests: write`, and `auto-release.yml` declares `contents: write` / `actions: write`, which override the repo default, so no change is needed here.

To exclude a PR from auto-merge, add the `no-auto-merge` label to it.
