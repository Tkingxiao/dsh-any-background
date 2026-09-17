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
- **Background Wallpaper** — Upload any image as your wallpaper. Drag to pan and scroll to zoom inside a viewport-proportional editor (one finger to pan, two to pinch-zoom on touchscreens).
- **Video Wallpaper** — Use a video as a live wallpaper: muted looping playback that survives refreshes (file persistence + HTTP streaming with Range seek), with an auto-captured frame powering the preview, theme-color extraction, and the position editor.
- **Position Editor** — One shared editor for images and videos: drag to pan, scroll or pinch to zoom, one-click reset. Image and video placements are stored separately and never overwrite each other.
- **Layout Modes** — Fit / Fill / Stretch / Tile / Center for both images and videos; in Fit mode the editor-committed framing stays consistent across window resizes and cross-monitor moves.
- **Generated Dynamic Backgrounds** — Choose mesh gradient, Shader, or geometric patterns with adjustable spread, intensity, and seed locking.
- **Per-surface Interface Opacity** — Independent sliders for the main background, sidebar, cards & panels (including the dropdowns and menus around the dialog), the input & controls (composer box, Cordis panel), the settings panel, the conversation text frame, the trajectory view, the better-sidebar workbench, and produced / highlighted content.
- **Per-surface Interface Blur** — Frosted-glass `backdrop-filter` blur (0–60 px) per surface, including a real backdrop on the composer, the Cordis panel and popover surfaces via stable host selectors.
- **Produced / Highlights** — Code blocks in conversation content (with their language banner), inline `code` highlight chips and produced chips share one opacity + blur slider. The opacity is the alpha of **each surface's own background color** (no second color stacked on top of the original), and the blur frosts that same layer so the wallpaper shows through the content.
- **better-sidebar workbench** — With dsh-better-sidebar installed, a dedicated slider pair (`panelOpacity` / `blurs.panel`) takes over its bottom workbench panel and the native right sidebar's surface tokens. Without that plugin the row is hidden and the sliders are inert.
- **Sidebar "Theme" page** — With dsh-better-sidebar installed, its sidebar gains a "Theme" card: opening it shows **the very same five pages** as the settings panel (Color / Interface / Font / Background / Profiles) with a shell rebuilt for the panel — full height with the page body owning the scroll, and a compact one-row tab rail (not a side rail, which would spend 150px of a narrow panel). **The layout adapts to the panel width**: card grids fill as many columns as fit (two from roughly 430px, three or four in a wide panel), and only a narrow panel tightens padding and headings and falls back to a single column. The background type cards do the same. Both surfaces share one page implementation and one state store, so editing in either place shows up in the other. Without better-sidebar the page simply never registers, and nothing else changes.
- **Conversation View Cards** — The message list is wrapped in a translucent card automatically, and the trajectory page gets whole-page opacity & blur controls, letting the wallpaper shine through the content.
- **Theme Export / Import** — One-click export to a self-contained `dsh-any-theme.json` (config + wallpaper, video embedded as a data URL) and import to restore it anywhere.
- **Appearance Presets & Profiles** — Six one-click presets (Default / Frosted glass / Minimal / Midnight / Cyber / Warm daylight) plus named profiles: save the current look and re-apply it anytime. A two-step confirm guards deletion.
- **Wallpaper Rotation** — Add images to a rotation pool (thumbnail picker included) and let the wallpaper change by shuffle or order on every refresh, daily, or weekly. Advancing copies the chosen image into the active wallpaper slot, so export/import and color extraction keep working unchanged.
- **Day/Night Auto Switch** — Assign a day profile and a night profile; the plugin switches automatically at fixed clock times or by following the OS dark mode.
- **Custom Font** — Upload a ttf / otf / woff / woff2 file (up to 100 MB) and apply it to the whole interface through `@font-face`; toggle it off or remove it at any time. Fonts stream as raw bytes and persist in the plugin data dir; code blocks keep their monospace stack.
- **Per-part Text Outline** — The same nine surface groups as the interface page, each with its own `-webkit-text-stroke`: width 0–4 px (0 = off) and a color of auto-contrast / gray / black / white / accent / custom. Code blocks, inline `code` and icons are exempted automatically, so multi-color syntax never smears.
- **Forced Interface Scheme** — Force light or dark token palettes regardless of the accent color's lightness; in `Auto` both the surface and font directions follow the accent's lightness (dark pick → light fonts, light pick → dark fonts), falling back to the wallpaper's perceived brightness when no color is picked.
- **File-based Persistence** — All settings are stored on the filesystem under `~/.dsh/.dsh-any-background-data/`, not `localStorage`.
- **Bilingual** — Full Chinese / English UI with automatic locale detection.
- **Theme Watchdog** — Re-asserts the custom theme if the host resets it.

## Changelog (latest two releases)

### v0.2.10 （Last version 0.15 RC2 update）

- A "Theme" page in dsh-better-sidebar's sidebar: with better-sidebar installed, the sidebar gains a "Theme" card that opens the same five pages as the settings panel (Color / Interface / Font / Background / Profiles). Both surfaces share one page implementation and one state store, so a change in either place shows up in the other. The shell adapts to the panel width — card grids fill as many columns as fit (two from roughly 430px, three or four in a wider panel) and only a narrow panel tightens padding and drops back to a single column.
- Phone-width support for the settings panel: once the content column gets narrow, headings, card paddings, the color orb and the wheel card tighten up, and the card grids stop overflowing. Background type cards switch to width-based columns instead of being squeezed into one.
- The crash fallback now shows the error stack, so a broken panel explains itself without devtools.
- Fixed `getSnapshot is not a function` crashing the panel on some installs: the installed dsh-client-store is an older build whose `defineStore()` returns a declaration, not an instance, and the code treated it as an instance — which also silently disconnected the state sync (the settings panel kept showing defaults). The store is now normalized into one shared instance that both surfaces read; an unexpected shape in the future only warns and skips the sidebar page.
- Fixed the background editor's pan and pinch never working on touch devices: the listeners were attached to a node inside a Portal that has no node on its first render, and the effect's dependencies never changed, so it never ran again. The modal node is held in state now, so the effect runs as soon as the node exists. Touch handling also moved from the preview card to the full-screen overlay (pinching the backdrop no longer zooms the page), and a gesture that ends outside the preview no longer closes the editor.
- Fixed slider thumbs snapping back mid-drag: the sync effect depended on inline arrow functions, so any parent re-render wrote the last committed value back into the input. The formatter is read through a ref, and only a real value change moves the thumb.
- Fixed the Interface and Font pages showing stale values after applying a preset or importing a theme: they did not subscribe to the store. They follow `metaRev` now (the background page's layout chips follow `bgRev`).
- Fixed settings being silently lost when a healthy config file was mistaken for a corrupt one: any read failure (file in use, antivirus, permissions) used to archive the good file, and the next launch then treated the install as a first run and wrote defaults over it. Only a JSON parse failure counts as corruption now; a read failure just falls back to the defaults and leaves the file alone.
- Fixed oversized uploads failing silently: the server answered 413 but the client never read the body. All three upload entries (video / wallpaper / font) now say "file too large, limit 100 MB", and an oversized video no longer plays as if it had been saved.
- Fixed the night schedule throwing on hosts without `matchMedia`, which aborted the boot restore and repeated every 30 seconds.
- Streaming no longer re-runs the full blur/opacity pass on every token (the observer's short-circuit condition could never hold on the real host). Bursts are coalesced into one animation frame and skipped when neither the values nor the targets moved.
- Also: config writes are atomic now (temp file + rename, temp cleaned up on failure) with the parsed result cached by mtime/size; and a batch of leak and race fixes (document listeners left behind when a panel closed mid-drag, stale animation frames overwriting a regenerated background, rotation writes clobbering debounced saves, leftover styles after disabling the plugin).
### v0.2.9

- **Fixed: opacity and blur sliders looked inert until each was dragged once** — Not a defaults problem: two gates stood in the application path. ① `applyCustomTokensNow()` returned early whenever there was no palette, and `paletteTokens()` returns exactly null when **no color is picked and no scheme is forced** — so the four opacity sliders' alpha variables were never written at all. ② `applyWp()` additionally gated the call behind `rHasColor() || rBgDark() !== null || ...`, all false on a fresh install, so it was never even invoked. Opacity now applies unconditionally, falling back to the host's own resolved surface tokens when the plugin has no palette (`readHostOpacityTokens()`, the same host fallback the workbench-panel slider already used). The sliders only supply the alpha — colors still come from the host skin, so a custom host theme survives.
- **Defaults moved to mid-scale** — Every per-part opacity now defaults to 0.5 and every blur to 30px (half of the 0–60px range), so a fresh install shows the controls working instead of appearing to do nothing. **Fresh installs only:** existing `theme-config.json` files are untouched. The wallpaper's own alpha (`wallpaperOpacity`) stays at 100% — halving it would dim every newly uploaded picture. The server-side `DEFAULT_CONFIG` was updated in lockstep, since one-sided declarations are exactly what silently dropped fields in v0.2.8.
- **Fresh installs now persist immediately and re-read once** — When `theme-config.json` is missing, the `read` RPC writes the defaults straight to disk and returns `firstRun`; the client then persists the browser half's full default set, calls `loadPersisted()` again, and runs `applyWp()` so the interface paints from a config that genuinely exists on disk.
- **Mobile / touch support for the background editor** — The editor only understood a mouse, so on a phone or tablet the wallpaper could neither be dragged nor zoomed. One finger now pans the picture and two fingers pinch to zoom, with the image point that started under your fingers staying pinned to them — which means a two-finger drag pans while it scales, both falling out of the same relation. The touch listeners are attached natively with `passive: false` on purpose: React registers `touchmove` passively at the root, where `preventDefault()` is a no-op, so the page would scroll and the browser would pinch-zoom the whole viewport behind the open dialog; the preview also declares `touch-action: none` to cover the same ground declaratively. Lifting one of two fingers re-baselines the pan against the finger still down, so the picture no longer snaps back by its offset.

- **New "Font" settings page** — A fifth page, right after "Interface", holding two new capabilities: the custom interface font and per-part text outlines.
- **Custom font** — Upload a ttf / otf / woff / woff2 file and apply it to the entire interface. Raw bytes POST to `/dsh-any-background/font/upload` (never base64 through the RPC channel, capped at 100 MB); the server sniffs the real container from its magic bytes, names the slot accordingly, and serves it back from `/dsh-any-background/font` as an `@font-face` source. The host's base font token `--dsw-font-family` is re-scoped to `'DAnyFont', <original host stack>` while the code stack stays untouched. The font can be disabled (file kept) or removed (file deleted), and a rejected upload rolls back to whatever was applied before. Like wallpapers, font files are machine-local — they stay out of profiles and theme exports.
- **Per-part text outline** — Nine groups, each with its own outline width (0–4 px, 0.5 steps, 0 = off) and color. Colors are stored as **preset keys**, not resolved values: "auto" inverts the font direction (light glyphs get a dark outline) and "accent" follows the current primary, so both re-derive automatically with the theme. Code blocks, inline `code`, icons and placeholders are explicitly exempted.
- **Known trade-off** — `-webkit-text-stroke` may clip by about 1px inside some single-line ellipsis containers; multi-line containers are unaffected.

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
- **[DSHA](https://github.com/DSH-APP/DSHA)** — DeepSeek Harness Android launcher (ROOT-free, Termux-free). Its bundled `dsh` is `0.1.5-rc.2`, the exact release this plugin targets, so it is compatible; the mobile UI shell is provided by `dsh-web-mobile`.
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — Supported

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## License

MIT
