# dsh-any-background

<p align="center">
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

English | [中文](README.zh.md)

A **DeepSeek Harness** appearance plugin that lets you fully customize the Web UI — custom theme color, background wallpaper, and fine-grained per-part opacity & blur controls.

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
- **Per-part Interface Opacity** — Independent sliders for the main background, sidebar, cards & panels (including the dropdowns and menus around the dialog), the input & controls (composer box, Cordis panel), plus the settings panel and wallpaper.
- **Per-part Interface Blur** — Frosted-glass `backdrop-filter` blur (0–60 px) for each interface part, including a real backdrop on the composer and Cordis panel via stable host selectors.
- **Conversation View Cards** — The message list is wrapped in a translucent card automatically, and the trajectory page gets whole-page opacity & blur controls, letting the wallpaper shine through the content.
- **Theme Export / Import** — One-click export to a self-contained `dsh-any-theme.json` (config + wallpaper, video embedded as a data URL) and import to restore it anywhere.
- **Appearance Presets & Profiles** — Six one-click presets (Default / Frosted glass / Minimal / Midnight / Cyber / Warm daylight) plus named profiles: save the current look and re-apply it anytime. A two-step confirm guards deletion.
- **Wallpaper Rotation** — Add images to a rotation pool (thumbnail picker included) and let the wallpaper change by shuffle or order on every refresh, daily, or weekly. Advancing copies the chosen image into the active wallpaper slot, so export/import and color extraction keep working unchanged.
- **Day/Night Auto Switch** — Assign a day profile and a night profile; the plugin switches automatically at fixed clock times or by following the OS dark mode.
- **Forced Interface Scheme** — Force light or dark token palettes regardless of the accent color's lightness; in `Auto` both the surface and font directions follow the accent's lightness (dark pick → light fonts, light pick → dark fonts), falling back to the wallpaper's perceived brightness when no color is picked.
- **Scheme detection fix** — The scheme is now derived from the wallpaper's actual brightness (analyzed once per wallpaper frame) even when no theme color is picked, fixing light wallpapers showing with the host's dark-theme white fonts; forcing light/dark without a picked color now builds a neutral palette instead of doing nothing.
- **File-based Persistence** — All settings are stored on the filesystem under `~/.dsh/.dsh-any-background-data/`, not `localStorage`.
- **Bilingual** — Full Chinese / English UI with automatic locale detection.
- **Theme Watchdog** — Re-asserts the custom theme if the host resets it.

## Recent Optimizations

### v0.2.5

- **Wallpaper MIME fixed — GIF/APNG wallpapers now work** — `readWallpaper` unconditionally re-declared every stored image as `image/jpeg`, even though URL-fetched PNG/WebP/GIF bytes are written under the same file. The real format is now sniffed from the magic bytes on every read, so animated GIF wallpapers (and PNG/WebP color profiles) survive refreshes correctly.
- **Appearance presets** — Six built-in one-click looks (Default, Frosted glass, Minimal, Midnight, Cyber, Warm daylight) on the Profile page, each bundling the theme color, per-part opacities, blurs and tints — never touching your wallpaper.
- **Saved profiles** — Save the current appearance as a named profile, apply/delete with a two-step confirm, and let the day/night schedule (below) swap between them.
- **Wallpaper rotation** — A rotation pool on the Background page: add images (thumbnail strip), choose shuffle/in-order and every-refresh/daily/weekly cadence, or hit "Switch now". The chosen image is copied into the active wallpaper slot server-side, so all existing pipelines (boot restore, export, color extraction) work unchanged.
- **Day/night auto switch** — Pick a day and a night profile and a trigger — fixed clock times or the OS `prefers-color-scheme` — and the plugin applies the matching profile automatically (checked every 30 s; appearance only, wallpaper untouched).
- **Forced interface scheme** — A Light/Dark/Auto segmented control on the Color page regenerates the whole token palette in the forced direction instead of deriving it from the accent lightness.

### v0.2.5 fixes & polish

- **Forced light/dark now actually differ — truthiness bug in the scheme check** — `buildTokens` derived the direction with `scheme ?? lit < 0.55`; a `scheme='light'` string is truthy, so both forced directions rendered the dark branch. The comparison is now explicit and the two token sets (78 of 79 entries) differ correctly.
- **Accent lightness remapping under a forced scheme** — When the forced direction contradicts the pick's band (a light accent under forced dark), the lightness is mirrored into the target band (dark 0.14–0.44 / light 0.6–0.88) before building tokens; hue and saturation carry over and the stored pick itself is untouched.
- **Auto-mode light/dark rules rebuilt** — With a picked color, the font and surface directions both follow the accent lightness (very dark → white fonts, very light → black fonts; no more fighting the wallpaper verdict). Without a pick, the font direction follows the wallpaper's perceived (Rec.709) brightness, and the global scheme flag (native controls, `color-scheme`) stays aligned with the palette direction.
- **Auto color-extraction pipeline completed** — A wallpaper-extracted theme color used to land in the in-memory config only: the host skin was never re-registered (and never would be again), the pick was never persisted, and the editor wheel never synced. The auto path now performs the full adaptation, and extraction measures brightness with the same Rec.709 luma as the wallpaper verdict so both always agree on one image.
- **Flash-free wallpaper rotation** — A due rotation now advances server-side during the refresh itself (the `read` handler advances the pool before returning the wallpaper), so the first paint already shows the new picture — no more "old wallpaper flashes, then suddenly switches". The client re-extracts the theme color from the new picture and persists it; the client-side advance remains as a fallback.

## Installation

### Method 1: npm install (Recommended)

```sh
dsh plugin --profile web add github:Tkingxiao/dsh-any-background
# or, if published to the registry:
dsh plugin --profile web add dsh-any-background
```

Then launch:

```sh
dsh web
```

The plugin appears as a **"Theme"** section in Settings.

### Method 2: npx (No Global Install)

```sh
npx @deepseek-ai/dsh plugin --profile web add github:Tkingxiao/dsh-any-background
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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness)** — Full support on both the npm release and the new source build. The plugin auto-detects which client-module table the host ships (the new `@deepseek-ai/dsh-client-store` or the legacy `@deepseek-ai/dsh-client-runtime`) and resolves `defineStore` accordingly at runtime.
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — Supported

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## License

MIT
