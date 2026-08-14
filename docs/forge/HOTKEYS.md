# Forge Hotkeys ⌨️⚒️

All hotkeys are wired in `components/forge/ForgeHotkeys.tsx` (250+ lines) and
mounted globally by `ForgePage.tsx`. They are Forge-only — they only fire when
a `/projects/*` route is active.

| Keys        | Action                                                              |
|-------------|---------------------------------------------------------------------|
| `?`         | Open hotkey help overlay                                            |
| `g` then `1`| Go to Foundry (`/projects`)                                         |
| `g` then `2`| Go to Quarry (`/projects/quarry`)                                   |
| `g` then `3`| Go to Smelter (`/projects/smelter`)                                 |
| `g` then `4`| Go to Vault (`/projects/vault`)                                     |
| `n`         | New task (opens STRIKE composer)                                    |
| `⌘K`/`Ctrl-K`| Open command palette (ActionNav spark-panel: jump, search, create) |
| `t`         | Jump to today on the Foundry calendar                               |
| `Esc`       | Close open modal / composer / palette                               |

The `g` prefix uses a two-key sequence (vim-style) — you have 1.2 s after
pressing `g` to press the digit.

### Spark particles on STRIKE

`ActionNav.tsx` spawns 14 amber spark particles that fly outward with random
rotation/scale when the STRIKE button (or `⌘K` palette entry) is fired. A small
CSS hammer icon rotates -35° on strike. This is pure CSS keyframes — no
animation library required.
