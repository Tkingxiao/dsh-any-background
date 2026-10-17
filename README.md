# dsh-any-background

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm version" src="https://img.shields.io/npm/v/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm monthly downloads" src="https://img.shields.io/npm/dm/dsh-any-background?color=4d6bfe"></a>
  <a href="https://github.com/Tkingxiao/dsh-any-background/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/npm/l/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/@deepseek-ai/dsh?activeTab=versions"><img alt="Supported DSH versions: 0.2.0-rc.1 ~ 0.2.1-rc.2 and above" src="https://img.shields.io/badge/DSH-0.2.0--rc.1%20~%200.2.1--rc.2%2B-4d6bfe" /></a>
  <a href="https://github.com/topics/dsh-better-sidebar"><img alt="Plugin ecosystem: GitHub topic dsh-better-sidebar" src="https://img.shields.io/badge/plugin%20ecosystem-topic%20dsh--better--sidebar-4d6bfe" /></a><br /><br />
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

English | [中文](README.zh.md)

A **DeepSeek Harness** appearance plugin: custom theme color, background wallpaper (image / video / algorithmically generated), and fine-grained per-surface opacity & blur controls. Compatible with **DSH `0.2.0-rc.1` through `0.2.1-rc.2` — and every host release above it** (official-Sidebar UI such as the "Theme" card enables itself where the host exposes the Sidebar registry extension point, and is skipped silently where it does not).

---

## Screenshots

<p align="center">
  <img src="example_img/image.png" alt="Custom homepage" width="720">
  <br/>
  <em>Custom homepage · wallpaper + theme color applied</em>
</p>

<p align="center">
  <img src="example_img/image-2.png" alt="Theme color picker" width="720">
  <br/>
  <em>Theme color picker · PS-style wheel + precise HSL/RGB inputs</em>
</p>

<p align="center">
  <img src="example_img/image-3.png" alt="Per-part opacity and blur" width="720">
  <br/>
  <em>Per-part opacity and blur · main background, sidebar, cards, settings</em>
</p>

<p align="center">
  <img src="example_img/image-4.png" alt="Background editor" width="720">
  <br/>
  <em>Background editor · image/video wallpapers support drag-to-pan and scroll-to-zoom</em>
</p>

<p align="center">
  <img src="example_img/image-6.png" alt="Generated dynamic background" width="720">
  <br/>
  <em>Generated dynamic background · mesh gradient / Shader / geometric presets</em>
</p>

<p align="center">
  <img src="example_img/image-9.png" alt="Geometric background, low-poly mode" width="720">
  <br/>
  <em>Generated dynamic background · geometric low-poly mode preview</em>
</p>

<p align="center">
  <img src="example_img/image-10.png" alt="Config export and import" width="720">
  <br/>
  <em>Export and import configs to share</em>
</p>

## Features

- **PS-style Color Wheel** — Pick hue on the ring, adjust saturation & lightness in the inscribed square. Generates 30+ CSS design tokens in real time.
- **Precise HSL / RGB Input** — Enter exact color values numerically with instant bidirectional sync to the wheel.
- **Smart Color Extraction** — One click derives a theme color from your wallpaper by sampling the visible region, quantizing, and filtering out gray / near-black / near-white pixels. Video wallpapers contribute via an auto-captured frame. Fully client-side.
- **Eyedropper** — Hover the wallpaper to preview a color and click to pick it as the theme color.
- **Background Wallpaper** — Upload any image as your wallpaper. Drag to pan and scroll to zoom inside a viewport-proportional editor (one finger to pan, two to pinch-zoom on touchscreens).
- **Video Wallpaper** — Use a video as a live wallpaper: muted looping playback that survives refreshes (file persistence + HTTP streaming with Range seek), with an auto-captured frame powering the preview, theme-color extraction, and the position editor.
- **Position Editor** — One shared editor for images and videos: drag to pan, scroll or pinch to zoom, one-click reset. Image and video placements are stored separately and never overwrite each other.
- **Layout Modes** — Fit / Fill / Stretch / Tile / Center for both images and videos; in Fit mode the editor-committed framing stays consistent across window resizes and cross-monitor moves.
- **Generated Dynamic Backgrounds** — Choose mesh gradient, Shader, or geometric patterns with adjustable spread, intensity, and seed locking.
- **Per-surface Interface Opacity** — Independent sliders for the main background, sidebar, cards & panels (including the dropdowns and menus around the dialog), the input & controls (composer box, Cordis panel), the settings panel, the conversation text frame, the trajectory view, the right sidebar (or bettersidebar), produced / highlighted content, the header popovers (Agent Team panel, background-job list and the session-header dropdowns), and the header bar (the conversation's title / view-tab row).
- **Per-surface Interface Blur** — Frosted-glass `backdrop-filter` blur (0–60 px) per surface, including a real backdrop on the composer, the Cordis panel and popover surfaces via stable host selectors. A slider at 0 leaves the surface's OWN host frost in place rather than clearing it: the host frosts its menus by default (`--dsw-menu-backdrop-filter: blur(40px) saturate(150%)`), and a plugin value only takes over once the slider moves — the same "compete for nothing at 0" rule the composer capsule follows.
- **Left sidebar + the caption band above it** — On the Windows desktop shell the sidebar's opacity + blur pair drives the sidebar column AND the segment of the window caption strip that sits directly above it. The host paints that strip as one full-width box; the plugin cuts it at the sidebar's own published width (`--dsh-windows-sidebar-width`), so the left part carries the sidebar's material and frost and the rest stays the 「标题栏」 card's. Drag the sidebar wider, or collapse it to `0px`, and the cut moves with it. The split is deliberate (issue #29, item 3): the left strip IS the sidebar column's own surface, so the header-bar sliders are not meant to reach it.
- **Produced / Highlights** — Code blocks in conversation content (with their language banner), inline `code` highlight chips and produced chips share one opacity + blur slider. The opacity is the alpha of **each surface's own background color** (no second color stacked on top of the original), and the blur frosts that same layer so the wallpaper shows through the content.
- **Right sidebar / bettersidebar surface** — One slider pair (`panelOpacity` / `blurs.panel`), two identities: without dsh-better-sidebar it reads "右方侧边栏" (Right sidebar) and drives the official right Sidebar's surface tokens and frosted blur (works on 0.1.5-rc.2 through 0.1.7); with dsh-better-sidebar installed it reads "bettersidebar" and takes over that plugin's bottom workbench panel (the official sidebar keeps responding too). The row is always visible.
- **Header popovers** — The session-header dropdowns get their own opacity + blur pair: the Agent Team panel, the background-job list, the open-in-app / session-log menus and the subagent lineage tree. On 0.1.7 the open-in-app picker moved to a portal and the session-row menu became a dynamic slot, so the plugin observes the stable `conversation.session.header*` slot anchors and tags the open popover at runtime instead of relying on class shapes.
- **Header bar (the session title row)** — The row carrying the session title, its actions and the view tabs gets a slider pair of its own. The host paints nothing there (the centre column's background shows straight through), so once a wallpaper is up the title and tabs sat on the raw picture while every masked surface around them did not. It now paints as a region tint, the same recipe as the chat column's card: the material is the plugin's main-background surface at this part's own opacity, so the bar reads as one band over the column rather than a second colour stacked on it, and the frost rides the row's own `backdrop-filter`, and because that filter turns the row into a stacking context the row also carries a compensating `z-index:10` — the overlays it hosts (the background-job list through `0.2.1-alpha.1`, the schedule task menu on every release) hang out of it with `z-index:100` and would otherwise be confined under the conversation. 10 clears the in-column chrome it overlaps (seat 9, back-to-bottom 8) and stays under every page-level surface (100 / 1000 / 1100), so nothing about the part's look changes when a menu opens. No `position` is written — the row is a flex item, where `z-index` applies on its own. See v0.3.7. On the Windows desktop shell the band it drives is split with the sidebar (previous bullet), dims itself while a modal is open (the host mask deliberately stops below the caption), and its generated segment is paint-only — `pointer-events:none` and no `app-region` declaration — so it can never swallow clicks meant for the native caption menubar (issue #29). It also paints below the
controls (`z-index:-1`) and carries its own ink (`--dsh-any-caption-ink`), so the sidebar toggle and the
应用 / 编辑 menubar stay readable even when a low sidebar opacity makes the strip light. The anchor is expressed in CSS (the row is the `conversation.session.header` slot's direct parent) instead of guessing a hashed class or tagging a host element at runtime; before `0.1.7-alpha.1` the host mounts that slot bare with no such element, so there the rule matches nothing and the part is simply inert. On the Windows desktop shell the same slider pair also drives the window caption band — except for the segment that sits above the left sidebar, which belongs to that sidebar's own pair (see **Left sidebar + the caption band above it**) — and the native minimize/maximize/close block is handed `transparent` so Windows paints no background of its own, leaving the band itself showing through. A blank session marks the row `headerBlank` (a placeholder left with only its padding) and the plugin skips claiming it.
- **Sidebar "Theme" page (dual mode)** — The same five pages (Color / Interface / Font / Background / Profiles) register into two surfaces: without dsh-better-sidebar, a "Theme" card is contributed to the **official right Sidebar's guide page** through its public extension points (`sidebarRightTabs` + the `sidebar.right.pane.tab` keyed seat); with dsh-better-sidebar installed, the page registers in that plugin's sidebar instead and the official guide card withdraws itself, so the two never duplicate. Settings panel, official sidebar and better-sidebar all share one page implementation and one state store — a change in any of them shows up everywhere. The shell adapts to the panel width, and a narrow panel tightens padding and falls back to a single column. On a host without the right Sidebar the registration silently never happens.
- **Conversation View Cards** — The message list is wrapped in a translucent card automatically, and the trajectory page gets whole-page opacity & blur controls, letting the wallpaper shine through the content.
- **Theme Export / Import** — One-click export to a self-contained `dsh-any-theme.json` (config + wallpaper, video embedded as a data URL) and import to restore it anywhere.
- **Appearance Presets & Profiles** — Six one-click presets (Default / Frosted glass / Minimal / Midnight / Cyber / Warm daylight) plus named profiles: save the current look and re-apply it anytime. A two-step confirm guards deletion.
- **Wallpaper Rotation** — Add images to a rotation pool (thumbnail picker included) and let the wallpaper change by shuffle or order on every refresh, daily, or weekly. Advancing copies the chosen image into the active wallpaper slot, so export/import and color extraction keep working unchanged.
- **Day/Night Auto Switch** — Assign a day profile and a night profile; the plugin switches automatically at fixed clock times or by following the OS dark mode.
- **Custom Font** — Upload a ttf / otf / woff / woff2 file (up to 100 MB) and apply it to the whole interface through `@font-face`; toggle it off or remove it at any time. Fonts stream as raw bytes and persist in the plugin data dir; code blocks keep their monospace stack.
- **Per-part Text Outline** — The same surface groups as the interface page (now eleven, including the header popovers and the header bar), each with its own `-webkit-text-stroke`: width 0–4 px (0 = off) and a color of auto-contrast / gray / black / white / accent / custom. Code blocks, inline `code`, icons and the host's `background-clip: text` shimmer chrome (the "深度求索中" turn-status line and the turn-process rows) are exempted automatically, so multi-color syntax never smears and gradient text is never flattened into a stroke-coloured blob.
- **Forced Interface Scheme** — Force light or dark token palettes regardless of the accent color's lightness; in `Auto` both the surface and font directions follow the accent's lightness (dark pick → light fonts, light pick → dark fonts), falling back to the wallpaper's perceived brightness when no color is picked.
- **File-based Persistence** — All settings are stored on the filesystem under `~/.dsh/.dsh-any-background-data/`, not `localStorage`.
- **Bilingual** — Full Chinese / English UI with automatic locale detection.
- **Theme Watchdog** — Re-asserts the custom theme if the host resets it.

## Changelog (latest two releases)

### v0.3.8 (Issues #28/#29 and the desktop sidebar: the header-bar card persists, its band stops eating clicks, the mask reaches the caption, and the sidebar is one surface again)

- **The 「标题栏」 settings survive a restart now.** The host half whitelists every key before it writes (`normalizeConfig` → `theme-config.json`), and its copy of the config shape had never learned that card's three keys: `blurs.headerBar` fell back to 30 px, `strokes.headerBar` to width 0, and `headerBarOpacity` was dropped outright at write time — while the browser half restored the file with its own defaults (`clamp01(undefined, .5) → 50%`), so the card looked like it saved and then reset on every reload. The profile sanitizer had the same hole, and was also dropping `blurs.header` from saved profiles. All three keys now exist in the host's `PartBlurs`, `DEFAULT_CONFIG`, `STROKE_GROUPS`, both normalizers and `ProfileAppearance`; `npm test` boots the built host half against a throwaway `$DSH_HOME` and asserts the whole round trip (disk + reload + profile), including the "ignoring unknown config field" warning staying silent.
- **The caption band's left segment no longer swallows clicks.** Chromium collects `-webkit-app-region` items in paint order, and the drag annotation 0.3.7 put on the generated band segment (`::after`) overrode the `no-drag` holes the native caption menubar punches for its own buttons — the top-left navigation stopped responding while dragging still worked. The segment is paint-only now: `pointer-events:none` and no app-region declaration at all; the host's own `.frame::before` still carries the band's drag region.
- **A modal's dim now reaches the caption strip.** The host's mask deliberately starts below the caption (`--dsh-frame-chrome-top` = the titlebar height) so the native drag strip keeps working, which left the top 40 px bright once a wallpaper was showing. The band is the plugin's own paint, so it dims itself while a modal exists — `[data-windows-titlebar]:has([role="dialog"][aria-modal="true"])`, with the host's own `--dsw-alias-bg-mask-1` and no interaction change. Measured in a browser: `box-shadow: none` closed → inset mask while open → none again.
- **The sidebar toggle over the caption is readable again — and no longer painted over.** Two faults stacked on the same control. First, the band's left segment (0.3.7) was a positioned box painted AFTER the sidebar column in tree order, and that column becomes a stacking context whenever the sidebar blur is on, so the fixed toggle the host floats over the strip was being washed out by our own plate. Second, the toggle's ink comes from `--dsw-alias-label-secondary`, which the plugin flips white against the PICKED PALETTE, while the strip shows that palette at the **sidebar opacity** over the wallpaper: at 22% over a bright wallpaper the strip is light, and white ink disappeared (the reported desktop regression). The segment now paints at `z-index:-1` — above the wallpaper, below every control — and the caption strip derives its own ink from what it is actually painted on: past ~85% opacity the surface dominates and the palette direction decides, below it the wallpaper's brightness verdict does. It is published as `--dsh-any-caption-ink`, with a collapsed variant switched by the host's own `data-sidebar-collapsed` marker (a collapsed sidebar hands the whole strip back to the 标题栏 card), applied to the native caption menubar host and to the sidebar's fixed caption controls — the toggle and, while collapsed, the new-session button. Nothing else is re-inked, and the whole thing is paint only.
- **The band has two owners ON PURPOSE.** The segment above the left sidebar follows the 「侧栏」 pair (same material literal, same blur mirror); everything right of the sidebar width follows the 「标题栏」 pair. That is why moving the header-bar sliders only changes the right part (issue #29 item 3) — the boundary is `--dsh-windows-sidebar-width`, published by the host, so it follows a dragged or collapsed sidebar by itself.
- **The sidebar reads as ONE surface now, so its top strip and its body stop splitting.** `--dsw-specific-sidebar-fill` is a theme token the host ships OPAQUE, and three elements inside the sidebar's box each declare `background:var(--dsw-specific-sidebar-fill)` on top of one another: `AppFrame`'s `.sidebarCol` (the grid track), `SidebarRoot`'s `.root` (the shell inside it) and the workspace tree's `.fade` (a 24 px bottom gradient into that same fill). Over an opaque color that stacking is invisible; with the 「侧栏」 opacity slider it is not, and on the desktop it became a hard line — the caption strip above the sidebar is the plugin's own plate, painted with the same variable at the same alpha exactly once, so the strip sat at one density and the column under it at another (the reported desktop split). The token is now re-declared `transparent` for the column's descendants (`SIDEBAR_ONE_LAYER_RULE`), which leaves the outermost box as the single painter — the same owner the host already picked on macOS, where `SidebarRoot.module.css` clears its own `.root` fill for precisely this reason. Measured in a mock built from the installed bundles: before, column 0.22 over root 0.22 (≈0.39) against a 0.22 strip; after, one 0.22 everywhere. Bound by the CSS-Module class shape (`[class*="_sidebarCol"]`, identical in `0.2.0-rc.1` / `0.2.1-alpha.3` / `0.2.1-rc.2`), so a build that renames the track just keeps the untouched host look.
- **The plugin-install dialog's npm-registry panel keeps the host's opacity.** `<fieldset data-install-registry>` is `createPortal`ed to `document.body` as a `position:fixed; z-index:1100` panel and paints from `--dsw-alias-bg-layer-2` (itself and its toggle) and `--dsw-alias-bg-layer-3` (the expanded toggle, the typed-address input) — tokens the 「卡片」 slider owns globally, so the panel faded with the card slider while the host's own comment on that rule says the layer is opaque *"to keep the registry form controls readable over the dialog"*. It joins the exemption set `applyExemptDefaults` already pins for confirm dialogs and the session-row menu: the current theme color at alpha 1, no translucency, nothing else re-inked or re-tinted, and the pin spelled for the subtree as well because a custom property travels downward and the options live inside it.
- **The `0.2.1` line is one channel, and every checked build is named.** `0.2.1-alpha.3` moved the background-job list onto the shared `MenuSurface` — the surface root carries no `role`, and the fill plus the frost live on its `.material` child — so the runtime tagger now also claims body-level `[data-menu-material]` surfaces and the header selector set gained the matching arm; the older self-painting `<ul class*="_menu">` shape stays matched. Verified per tag from `alpha.3` through `rc.2`: no file the adapter speaks for moved (`design-platform.css`, `MenuSurface`, `MenuGroup`, `AppFrame`, `ConversationRoot`, `TaskMenu`, `preload-windows`, the five header slots). `SidebarRight.module.css` only gained `overflow:clip` on the panel wrapper (fixed floating children still escape), and the plugin-manager page was refactored with all three list anchors intact. The `0.2.1-alpha` and `0.2.1-rc` channels therefore collapse into one `0.2.1` channel covering `alpha.1`…`rc.2`, with a `SUPPORTED_RELEASES` row per build (each `exact`), `engines`/peers/`dsh.compatibility` naming them, and the folder renamed `v0-2-1`.

### v0.3.7 (Menus keep the host's frost at blur 0, the left sidebar owns the band above it, and the release table is 0.2.x only)

- **The reported "the background-job list is under the conversation" was caused by the 「标题栏」 card's own frost, and the fix is a stacking order, not a state switch.** The session header row is not an empty strip: the host mounts its header chrome INTO it (`conversation.session.header.actions|.utilities`), and that chrome raises its overlays from inside the row. `ui-jobs/JobListAction` hangs `.menu{position:absolute; top:calc(100% + 5px); z-index:100}` off a `.root{position:relative}` on every release through `0.2.1-alpha.1` — the captured DOM's `style="left: 0px"` with no `top` and no `role` IS that in-place shape, and the `0.2.1-alpha.2` portal is what hid the symptom on the newest tag, not what fixed it. `ui-schedule/TaskMenu` (`role="menu"`, `position:absolute; z-index:100` whenever the primitive is not in portal mode) sits in the same row on every release in range. Putting `backdrop-filter` on the row makes the row a STACKING CONTEXT, so those `z-index:100` values stop being page-level and only order the overlays WITHIN the row; the row then paints at its own level — under the conversation body, the composer seat and `.root`'s background. The menu was never demoted by the host: it was confined by us. The row now carries a compensating `z-index:10` — above the in-column chrome the menu hangs over (`.seat` 9, back-to-bottom 8, footer 7, `.tabs` 1) and far below every page-level surface (portaled menus 100, modals 1000, stat / context panels 1100) — so the frost, the tint and the drag region never change state, and a portaled list still covers the title row exactly as the host intends. No `position` is written: the row is a flex item of `ConversationRoot .root{display:flex}`, where `z-index` applies on its own, which keeps the plugin out of deciding a host box's positioning (issue #24). The first attempt at this in the same release was a `:has()` valve that dropped the frost while a header overlay was open — it cleared the occlusion but re-tinted the whole title bar every time anyone opened a menu, which reads as the part's two sliders moving themselves. That attempt is gone.

- **A menu's blur slider at 0 no longer deletes the host's frost.** The host frosts every menu by itself — `--dsw-menu-backdrop-filter: blur(40px) saturate(150%)`, declared on `body` — and both paint shapes read that inherited value: a self-painting list through its own `backdrop-filter`, a `MenuSurface` card through its `.material` layer. The plugin re-declared that token on the menu with a `none` fallback, and an element's own declaration always beats what it inherits, so at slider 0 the frost was not "left alone", it was REMOVED — a faded menu with nothing frosted behind it lets the conversation show straight through it. (A second and separate defect made the same popup get buried outright — see the first bullet of this release.) Both menu groups' frost now rides a `:where()` gate on `<html>` (`dab-card-frost` / `dab-header-frost`) that switches on only while the slider is non-zero — the idiom the composer capsule already uses. `:where()` is what keeps the gate free: this plugin's menu cascade is ordered at equal specificity (card group → header group → exemptions), and a plain class prefix would have lifted the card group over the exemption it must lose to. The exemption's own `none` stays, because `applyExemptDefaults` pins those surfaces at alpha 1 beside it — opaque by design, not broken.

- **The background-job list is where the bug became visible.** `0.2.1-alpha.2` portaled it out of the header row to `document.body` as `position:fixed; z-index:100`, a bare `<ul>` with no `role` — so the missing-frost defect below finally had something to be seen on — a list facing the whole page instead of hanging inside the column. The occlusion reported alongside it had the different cause spelled out in the first bullet. `MenuSurface`'s own `data-menu-material` marker joins the card group for the same reason: `ModelSelect` renders its model pane as `role="group"`, so keyed on `[role="menu"]` alone that card faded with the slider and never frosted with it.

- **The left sidebar and the caption band above it are one surface now.** `AppFrame`'s band is a single full-width box (`.frame::before`) whose left segment sits directly above the sidebar column, and the host publishes that column's width on the frame itself (`--dsh-windows-sidebar-width`, inline, Windows builds only). The plugin cuts the band at exactly that width: `::before` is clipped to everything right of it — keeping the 「标题栏」 card's material, frost and drag region — and a new `::after` paints the left segment from `--dsh-any-op-sidebar`, the very literal the sidebar column is painted with, frosted from a root-level mirror of the sidebar blur. One opacity + blur pair drives the column and the strip above it, and the cut follows a dragged or collapsed sidebar with no observer of ours (`0px` returns the whole band to the 标题栏 card).

- **The custom font now wins the cascade it was silently losing on `0.2.1-alpha.2`.** That tag moved the user font list into `--dsh-font-family-text` and made the host compose `body{--dsw-font-family:var(--dsh-font-family-text,…)}` in its own `base.css` — the same token, the same `body` selector and the same specificity as the rule this plugin's custom font writes, so which one applied became a question of which stylesheet landed last. The font rule now carries `!important`, the way the token sheet already does; code typography is left alone, as always.

- **The release table now speaks only for `0.2.x`.** The `0.1.5-rc`, `0.1.6-alpha`, `0.1.7-alpha` and `0.1.7-rc` folders, channels and rows are gone: nothing in the plugin still asserts a fact checked against them, and a table nobody verifies is worse than no table. `engines.dsh`, the gated peers and `dsh.compatibility` now start at `0.2.0-rc.1`, which means an older host is refused at profile composition instead of being quietly styled with the wrong adapter — the DSHA launcher's bundled `0.1.5-rc.2` among them. `0.2.1-alpha.2` … `0.2.1-rc.2` were verified by diffing each tag against the folder's facts (`design-platform.css`, `MenuSurface`, `MenuGroup`, the `--dsw-menu-backdrop-filter` consumers, `AppFrame`, `ConversationRoot`, `TaskMenu`, the header slot keys and the right-sidebar panel — none of them moved) and join that folder, renamed `v0-2-1`, so each verdict reads `exact`.

## Installation

### Method 1: npm install (Recommended)

```sh
# published on the npm registry
dsh plugin --profile web add dsh-any-background

# or straight from the GitHub repository
dsh plugin --profile web add github:Tkingxiao/dsh-any-background
```

Then launch:

```sh
dsh web
```

The plugin appears as a **"Theme"** section in Settings.

### Method 2: npx (No Global Install)

```sh
npx @deepseek-ai/dsh plugin --profile web add dsh-any-background
npx @deepseek-ai/dsh web
```

### Method 3: Local Build (Development)

The `lib/` directory is committed, so installs need no build step. To rebuild after editing `src/`:

```sh
git clone https://github.com/Tkingxiao/dsh-any-background.git
cd dsh-any-background
pnpm install
pnpm run bundle
pnpm dsh plugin --profile web add "dsh-any-background"
pnpm dsh web
```

## Compatibility

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness) `0.2.0-rc.1` ~ `0.2.1-alpha.2`, and everything above it with it** — `engines.dsh`, the gated `@deepseek-ai/dsh-*` `peerDependencies` and `dsh.compatibility.dsh` name the builds this plugin was checked against one by one (`0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-alpha.1`, `0.2.1-alpha.2`) and close with an uncapped `>=0.2.0-rc.1`, so every later release loads. The uncapped umbrella is the deliberate choice: the host enforces exactly this peer list — a release it does not name is disabled before a single module is imported — so a range that runs out is a wall in front of a plugin that would have gone on working. An unseen release gets the closest verified adapter plus a log line saying how far from `exact` that is, and the worst a stale guess can cost is one slider no longer fading a surface the host has since moved; a version check that failed closed would have cost the whole plugin. `dsh.compatibility.dshReleases` records which builds were checked and how: every release in the list was checked by diffing its tag against the adapter folder that answers for it. That enforcement still means a `dsh web` restart when the plugin is installed or updated — the check runs while the profile is composed, not when the plugin is updated — but the uncapped umbrella is what spares a machine that has already moved to a newer host from needing a plugin release or a manual exact-version exemption (`dsh plugin allow-version`) first. The host release is resolved on the Node half at runtime, and features that depend on a specific host release channel (the right Sidebar's panel blur, the official Sidebar's "Theme" card) enable themselves only where the corresponding host structure exists; everything else behaves identically across the range. THE `0.1.5` / `0.1.6` / `0.1.7` ERA IS OUT OF THE SUPPORTED RANGE: those adapter folders asserted facts nothing re-checks any more, and the range above now starts at `0.2.0-rc.1`, so an older host is refused at composition rather than quietly styled with the wrong adapter.
- **Isolated per-version adaptation**: the release is resolved on the Node half from the app manifest the process was composed from (`ctx.profileContext.installAnchor`, with the launcher's on-disk layout behind it — the client context exposes no version) and, once handed down through the `read` RPC, is routed only by the front-layer adapter — `src/host-compat/` detects and buckets channels, while `src/client/host-compat/versions/` holds **one folder per set of verified facts** (`v0-2-0-rc-1` / `v0-2-0-rc-2` / `v0-2-1` / `unknown`), each describing that version's panel mechanics, header slot keys, plugin-page shape and where a menu's paint lives. A folder is keyed to what its facts cover, not to the shape of the version number: `0.2.0-rc.1` and `0.2.0-rc.2` are one prerelease channel, but rc.2 renamed the token a sticky menu group heading paints from, so the line carries two folders and the newer one is named for the build that opened it. A newer build whose facts did NOT move joins the folder that held instead of opening one of its own — the whole `0.2.1` line (`alpha.1` … `rc.2`) sits in `v0-2-1` for exactly that reason, with one `SUPPORTED_RELEASES` row per checked build so each verdict reads `exact` rather than `line`. Base code just asks the adapter questions (who owns the guide surface, which layer carries the blur, which token fades a menu) and never compares version strings. Another build on a verified patch line (`0.2.1-rc.3` against a table checked through `rc.2`) keeps that line's adapter, and a patch line nothing was checked against clamps to the nearest one with a log line saying so — which is the arm that now serves every release above `0.2.1-rc.2`. Only a release that will not parse at all falls into `unknown` and probes the DOM shape instead of guessing (`:has()` dual arms); supporting a new host means adding one folder and registering it.
- **[DSHA](https://github.com/DSH-APP/DSHA)** — DeepSeek Harness Android launcher (ROOT-free, Termux-free). Its bundled `dsh` is `0.1.5-rc.2`, BELOW this plugin's supported floor since v0.3.7: the peer gate refuses it at composition, so the plugin never loads there rather than restyling that shell with 0.2.x facts.
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — Supported

## Permissions, side effects & boundaries

- **Integration form**: official Profile Bundle — `package.json` declares `dsh.bundle.patch: ./cordis.patch.yml` (a loader insert layer), the repository ships prebuilt runtime artifacts ready to use (`lib/index.js`, `lib/client.js`), and there are no install scripts, no `postinstall`, no native binaries, and no build step at install time.
- **Filesystem**: the server half reads and writes only inside `<dsh home>/.dsh-any-background-data/` (config JSON, wallpaper, rotation pool, video, font) and touches nothing outside it; config writes are atomic (temp file + rename). These files live on the real disk, so they are **outside generation restore — it neither captures nor rolls them back**; deleting the directory is a full plugin reset.
- **Network**: one outbound fetch happens only when the user pastes an http/https image or video URL and presses Apply; no telemetry, no other external calls.
- **Shell / native**: none. No `child_process`, no native modules, no dynamically downloaded executables.
- **HTTP surface**: registers only `/dsh-any-background/{video,wallpaper,font}` (GET/HEAD streaming) with matching `*/upload` POST routes (100 MB cap) and the dedicated RPC channel `/dsh-any-background` under the local dsh web server; no extra listening ports.
- **Restart requirements**: the first install needs a (re)start of `dsh web` to load the client bundle; settings changes afterwards apply live and persist automatically. Updating the plugin requires a restart to pick up the new `lib/client.js`.
- **Tests & verification**: `pnpm run typecheck` (full tsc check) and `pnpm run bundle` (tsdown emits `lib/`); no automated unit tests — behavior is verified manually.
- **Known limitations**: the styling relies on stable host DOM markers (`[data-sidebar-right-panel]`, `[data-dsh-bottom-panel]`, …) and CSS token names; a host restyle of those layers can leave a slider ineffective for its surface (cosmetic only — nothing breaks). The version-specific half of those selectors lives inside its own version folder, so a host revision normally means editing that one file. `-webkit-text-stroke` may clip about 1px at the edge of some single-line ellipsis containers.

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## License

MIT
