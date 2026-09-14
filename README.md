# dsh-any-background

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm version" src="https://img.shields.io/npm/v/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm monthly downloads" src="https://img.shields.io/npm/dm/dsh-any-background?color=4d6bfe"></a>
  <a href="https://github.com/Tkingxiao/dsh-any-background/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/npm/l/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/@deepseek-ai/dsh?activeTab=versions"><img alt="Supported DSH version: 0.1.5-rc.2" src="https://img.shields.io/badge/DSH-0.1.5--rc.2-4d6bfe" /></a>
  <a href="https://github.com/topics/dsh-better-sidebar"><img alt="Plugin ecosystem: GitHub topic dsh-better-sidebar" src="https://img.shields.io/badge/plugin%20ecosystem-topic%20dsh--better--sidebar-4d6bfe" /></a><br /><br />
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

English | [中文](README.zh.md)

A **DeepSeek Harness** appearance plugin: custom theme color, background wallpaper (image / video / algorithmically generated), and fine-grained per-surface opacity & blur controls. This release targets **DSH 0.1.5-rc.2**.

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
- **Background Wallpaper** — Upload any image as your wallpaper. Drag to pan and scroll to zoom inside a viewport-proportional editor.
- **Video Wallpaper** — Use a video as a live wallpaper: muted looping playback that survives refreshes (file persistence + HTTP streaming with Range seek), with an auto-captured frame powering the preview, theme-color extraction, and the position editor.
- **Position Editor** — One shared editor for images and videos: drag to pan, scroll to zoom, one-click reset. Image and video placements are stored separately and never overwrite each other.
- **Layout Modes** — Fit / Fill / Stretch / Tile / Center for both images and videos; in Fit mode the editor-committed framing stays consistent across window resizes and cross-monitor moves.
- **Generated Dynamic Backgrounds** — Choose mesh gradient, Shader, or geometric patterns with adjustable spread, intensity, and seed locking.
- **Per-surface Interface Opacity** — Independent sliders for the main background, sidebar, cards & panels (including the dropdowns and menus around the dialog), the input & controls (composer box, Cordis panel), the settings panel, the conversation text frame, the trajectory view, the better-sidebar workbench, and produced / highlighted content.
- **Per-surface Interface Blur** — Frosted-glass `backdrop-filter` blur (0–60 px) per surface, including a real backdrop on the composer, the Cordis panel and popover surfaces via stable host selectors.
- **Produced / Highlights** — Code blocks in conversation content (with their language banner), inline `code` highlight chips and produced chips share one opacity + blur slider. The opacity is the alpha of **each surface's own background color** (no second color stacked on top of the original), and the blur frosts that same layer so the wallpaper shows through the content.
- **better-sidebar workbench** — With dsh-better-sidebar installed, a dedicated slider pair (`panelOpacity` / `blurs.panel`) takes over its bottom workbench panel and the native right sidebar's surface tokens. Without that plugin the row is hidden and the sliders are inert.
- **Conversation View Cards** — The message list is wrapped in a translucent card automatically, and the trajectory page gets whole-page opacity & blur controls, letting the wallpaper shine through the content.
- **Theme Export / Import** — One-click export to a self-contained `dsh-any-theme.json` (config + wallpaper, video embedded as a data URL) and import to restore it anywhere.
- **Appearance Presets & Profiles** — Six one-click presets (Default / Frosted glass / Minimal / Midnight / Cyber / Warm daylight) plus named profiles: save the current look and re-apply it anytime. A two-step confirm guards deletion.
- **Wallpaper Rotation** — Add images to a rotation pool (thumbnail picker included) and let the wallpaper change by shuffle or order on every refresh, daily, or weekly. Advancing copies the chosen image into the active wallpaper slot, so export/import and color extraction keep working unchanged.
- **Day/Night Auto Switch** — Assign a day profile and a night profile; the plugin switches automatically at fixed clock times or by following the OS dark mode.
- **Forced Interface Scheme** — Force light or dark token palettes regardless of the accent color's lightness; in `Auto` both the surface and font directions follow the accent's lightness (dark pick → light fonts, light pick → dark fonts), falling back to the wallpaper's perceived brightness when no color is picked.
- **File-based Persistence** — All settings are stored on the filesystem under `~/.dsh/.dsh-any-background-data/`, not `localStorage`.
- **Bilingual** — Full Chinese / English UI with automatic locale detection.
- **Theme Watchdog** — Re-asserts the custom theme if the host resets it.

## Changelog

### v0.2.7

- **New "Produced / Highlights" sliders** — Code blocks in conversation content (language banner included), inline `code` highlight chips and produced chips now share one opacity + blur slider. The opacity is the alpha of each surface's **own background color**: 100% reproduces the host look byte-for-byte, and lowering it fades exactly that color out instead of stacking a second one on top of the original (previously the code block's outer wrapper stayed opaque, so the slider merely blended the plugin palette into it and the blur had nothing to reveal). The blur frosts that same layer with `backdrop-filter`. Code blocks in the document preview — which live outside `.md-code-block` and take their color from `--shiki-background` alone — are covered too.
- **New better-sidebar workbench sliders** — `panelOpacity` / `blurs.panel` drive dsh-better-sidebar's bottom workbench panel through `[data-dsh-bottom-panel]` and the native right sidebar through `[data-sidebar-right-panel]`, re-scoping the panel's surface tokens to the plugin palette (dedicated token remap + panel blur rules). Without that plugin the row is hidden and the sliders are inert.
- **Popover blur fixed** — A new `POPOVER_BLUR_RULE` makes the "card" blur slider land on dropdown / popover surfaces as well, not just the panels inside the dialog.
- **Host support narrowed to DSH 0.1.5-rc.2** — `engines.dsh` and `dsh.compatibility.dshReleases` now declare that single release (verified on it) and the old 8-version matrix is gone from the README. `panelOpacity` joined the full profile / export / day-night-schedule pipeline.
- **Six presets carry the new parameters** — workbench opacity follows each preset (Frosted glass 0.85, Midnight 0.8, Warm daylight 0.75, …); the produced slider defaults to 100% (the untouched host look).

### v0.2.6

- **Fixed the narrow-viewport (mobile layout) title bar splitting from the content area** — On narrow viewports the host renders a 52px fixed session-title bar (`.dsh-mobile-app-header`) outside the AppFrame columns. The main-background opacity only lived on the columns, so the bar showed the raw wallpaper and visibly split from the translucent content below it ([#11](https://github.com/Tkingxiao/dsh-any-background/issues/11)). The bar now rides the plugin-owned `--dsh-any-op-bg` variable, following the main-background opacity slider and theme switches automatically; it falls back to the host's default look when unset.
- **Main-background blur mirrored to `:root`** — A new global variable `--dsh-any-part-blur-global` (following the main-background blur slider) lets the title bar frost in sync; third-party styles can reference it too, matching the existing globals `--dsh-any-input-blur` / `--dsh-any-blur-settings` / `--dsh-any-blur-card-panels` (the element-scoped `--dsh-any-part-blur` never leaves the columns' subtree).
- **Fast boot, no white-screen wait** — Wallpapers no longer cross the RPC channel as base64. Uploads stream raw bytes straight to disk, and the persisted picture is served over HTTP and decoded by the browser natively, exactly like any `<img>`. A shared decode cache turns the four URL-keyed decodes of one wallpaper (palette extract, brightness verdict, low-res drag copy, intrinsic size) into one. Boot restore on a large wallpaper dropped from ~5.5 s to ~1.2 s (RPC read 3010 ms → ~170 ms, first decode 1464 ms → ~780 ms).
- **In-place wallpaper swaps always paint the new picture** — Upload, URL download and rotation all replace the file behind the same serve URL, which left every URL-keyed cache — the layer re-set guard, decode cache, brightness verdict and low-res copy — holding the old pixels. The image slot now carries a query-string revision like the video slot, so every swap gets a fresh URL and a fresh decode.
- **Race-free auto color extraction** — A wallpaper swap during the palette decode can no longer let the old picture's color overwrite the new one (guarded the same way as the brightness verdict).
- **Sturdier uploads** — Video uploads are capped at 2 GB, use their own temp file (a concurrent wallpaper upload can't corrupt them) and record the MIME server-side immediately; both upload routes now carry the same Host/Origin fence as the RPC channel.
- **Four new generated backgrounds** — Shader gains **Starfield** (three layers of twinkling stars over a slow nebula veil); patterns gain **Rain** (falling light streaks), **Contours** (drifting topographic flow lines) and **Fluid orbs** (slow drifting glow blobs). All are seeded and parameterized exactly like the existing presets.
- **Pause for generated backgrounds** — A pause/play button next to Regenerate stops the canvas animation loop without tearing the background down (session-only; regenerate or reload starts the loop again).
- **Reduced-motion respect** — With the OS `prefers-reduced-motion` preference set, generated backgrounds render their first frame and skip the animation loop entirely.
- **Network video URL wallpaper** — The "From URL" flow now recognizes video links: the server streams the download into the video slot (2 GB cap, 60 s inactivity timeout, MIME taken from Content-Type or the file extension) and records the MIME in the config; playback, snapshot capture and color extraction continue through the existing serve route.
- **Cleanup** — Removed the boot performance probe and dead static-snapshot helpers; URL-downloaded wallpapers are written to disk directly with no transient base64 string.

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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness) 0.1.5-rc.2** — This release targets `0.1.5-rc.2` only (verified on it); `engines.dsh` and `dsh.compatibility.dshReleases` in `package.json` declare that single release as well.
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — Supported

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## License

MIT
