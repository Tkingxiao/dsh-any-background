# dsh-any-background

<a href="https://github.com/Tkingxiao/dsh-any-background" target="_blank">
  <img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars" />
</a>

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
  <em>Background editor · image wallpapers support drag-to-pan and scroll-to-zoom</em>
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
- **Smart Color Extraction** — One click derives a theme color from your wallpaper by sampling the visible region, quantizing, and filtering out gray / near-black / near-white pixels. Fully client-side.
- **Eyedropper** — Hover the wallpaper to preview a color and click to pick it as the theme color.
- **Background Wallpaper** — Upload any image as your wallpaper. Drag to pan and scroll to zoom inside a viewport-proportional editor.
- **Generated Dynamic Backgrounds** — Choose mesh gradient, Shader, or geometric patterns with adjustable spread, intensity, and seed locking.
- **Per-part Interface Opacity** — Independent sliders for main background, sidebar, cards & panels, plus the settings panel and wallpaper.
- **Per-part Interface Blur** — Frosted-glass `backdrop-filter` blur (0–60 px) for each interface part.
- **Theme Export / Import** — One-click export to a self-contained `dsh-any-theme.json` (config + wallpaper) and import to restore it anywhere.
- **File-based Persistence** — All settings are stored on the filesystem under `~/.dsh/.dsh-any-background-data/`, not `localStorage`.
- **Bilingual** — Full Chinese / English UI with automatic locale detection.
- **Theme Watchdog** — Re-asserts the custom theme if the host resets it.

## Recent Optimizations

- **Boot flicker eliminated** — Theme tokens are injected through a dedicated `!important` stylesheet instead of inline `body` styles, surviving host theme service resets.
- **Color wheel overlap fixed** — The hue ring is drawn on top of the saturation/lightness square so the square corners no longer cover the ring.
- **Inspiration palette selection cleared** — Picking a theme color from the wheel deselects any previously selected inspiration swatch.
- **Debug telemetry removed** — Temporary boot-time logging and `MutationObserver` instrumentation have been cleaned out.
- **Per-part blur isolated** — Blur is applied on `::before` underlays so it never traps the host's fixed-position settings dialog.

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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness)** — Full support.
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — Supported; a known Electron packaging issue makes the left sidebar and center area opacity appear inverted — awaiting a desktop-client update to fix it.

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## License

MIT
