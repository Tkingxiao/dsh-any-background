# dsh-any-background

<a href="https://github.com/Tkingxiao/dsh-any-background" target="_blank">
  <img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars" />
</a>

English | [中文](README.zh.md)

A **DeepSeek Harness** appearance plugin that lets you fully customize the Web UI with a custom theme color, background wallpaper, and fine-grained opacity controls.

<p align="center">
  <a href="https://star-history.com/#/Tkingxiao/dsh-any-background" target="_blank">
    <img src="https://api.star-history.com/svg?repos=Tkingxiao/dsh-any-background&type=Date" alt="Star History Chart" width="600" />
  </a>
</p>

---

## Features

- **PS-style Color Wheel** — Pick hue on the ring, adjust saturation & lightness in the inscribed square. Generates a full set of 30+ CSS design tokens in real time and applies them instantly.
- **Background Wallpaper** — Choose any image as your wallpaper. Drag to pan, scroll to zoom inside a viewport-proportional editor. What you see is what you get.
- **Opacity Controls** — Separate sliders for main interface background opacity, settings panel opacity, and wallpaper opacity.
- **Blur Effect** — Adjustable wallpaper blur (0–60 px) for a frosted-glass look.
- **Persistent** — All settings (color, wallpaper, opacity, blur, editor position) are saved to `localStorage` and restored on next launch.
- **Bilingual** — Full Chinese / English UI with automatic locale detection.
- **Theme Watchdog** — A background watchdog re-asserts the custom theme if the host resets it, so your pick never silently disappears.

## Project Structure

```
dsh-any-background/
├── package.json          # Package metadata, dsh.client declaration, dependencies
├── cordis.patch.yml      # Bundle patch layer (inserted into profile composition)
├── cordis.yml            # Patch overlay for dev usage (pnpm dsh web --patch)
├── tsdown.config.ts      # Build config: node-half (ESM) + client-half (CJS browser bundle)
├── src/
│   ├── index.ts          # Node half — empty shell for Cordis loader mount
│   ├── invariant.ts      # Invariant companion (registers package ownership)
│   └── client/
│       └── index.tsx     # Browser half — ALL UI logic lives here
├── lib/                  # Built output, committed so installs need no build step
│   ├── index.js          # Node entry
│   ├── invariant.js      # Invariant entry
│   ├── client.js         # Browser bundle (wrapped for __ModuleLoader__)
│   └── client.js.map     # Source map
├── README.md             # This file (English)
└── README.zh.md          # 中文版
```

## Implementation

The plugin is a **pure client-side** Cordis plugin. The node half is an empty shell; all behavior lives in `src/client/index.tsx`.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  apply(ctx)  —  Plugin entry point                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Restore saved color → registerCustom() → setTheme   │
│  2. Inject gradient <style> into <head>                 │
│  3. Create state store (defineStore)                    │
│  4. applyWp() → wallpaper + token overrides             │
│  5. Listen theme/change → re-apply                      │
│  6. ResizeObserver → viewport-aware re-positioning      │
│  7. Locale registration (zh/en)                         │
│  8. Settings section injection (ThemeSection)           │
│  9. Deferred boot restore (300ms, 1500ms)               │
│ 10. Theme watchdog (1s interval)                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Color Wheel

- Single `<canvas>` element: hue ring (360° segments) + inscribed SL square (HSV S-V plane).
- `hitTest()` determines whether a click lands on the ring (hue) or square (saturation/lightness).
- HSV values from the canvas are converted to HSL via `hsvToHsl()` before passing to `genTokens()`.
- `genTokens()` generates 30+ CSS custom properties (`--dsw-alias-*`) for the picked color, choosing dark or light scheme based on lightness.
- The full token set is written as inline styles on `<body>`, so the theme color never depends on the theme service's timing.

### Background Wallpaper

- A `<div>` with `position:fixed; z-index:-1` is prepended to `<body>`.
- Image is compressed via Canvas API (max 1600px side, JPEG quality 0.75) and stored as base64 in `localStorage`.
- The editor modal shows a viewport-proportional rectangle; drag to pan, scroll to zoom (0.1×–10×).
- Committed position is stored as fractional center coordinates + natural image size, so the layout survives viewport changes.
- Wallpaper opacity is applied directly to the `<div>` element; background color opacity is applied via inline token overrides.

### Opacity System

Three independent opacity layers, each with its own slider and `localStorage` key:

| Layer | localStorage key | Default | Mechanism |
|-------|-----------------|---------|-----------|
| Main interface | `dsh-any-background:opacity` | 85% | Inline CSS variable on `<body>` |
| Settings panel | `dsh-any-background:settings-opacity` | 100% | CSS variable on `<html>` via `[aria-modal]` selector |
| Wallpaper | `dsh-any-background:wallpaper-opacity` | 100% | Direct `style.opacity` on wallpaper `<div>` |

## Installation

### Method 1: npm install (Recommended)

Install the plugin directly from GitHub into your Web profile:

```sh
dsh plugin --profile web add github:Tkingxiao/dsh-any-background
```

Then launch the Web UI:

```sh
dsh web
```

The plugin will appear as a **"Theme"** section in the Settings panel.

### Method 2: npx (No Global Install)

If you don't have `dsh` installed globally, use `npx`:

```sh
npx @deepseek-ai/dsh plugin --profile web add github:Tkingxiao/dsh-any-background
```

Then launch:

```sh
npx @deepseek-ai/dsh web
```

### Method 3: Local Build (Development)

The `lib/` directory is committed, so installs need no build step. To rebuild after
editing `src/`, run the bundle script (needs Node + pnpm):

```sh
# 1. Clone this repo
git clone https://github.com/Tkingxiao/dsh-any-background.git
cd dsh-any-background

# 2. Install the build tool
pnpm install

# 3. Rebuild lib/
pnpm run bundle

# 4. Install the plugin into the web profile (from the local checkout)
dsh plugin --profile web add -w .

# 5. Launch
dsh web
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@deepseek-ai/cordis` | Plugin framework (Cordis) |
| `@deepseek-ai/dsh-client-runtime` | Client runtime + `defineStore` |
| `@deepseek-ai/dsh-client-locale` | i18n (Chinese/English) |
| `@deepseek-ai/dsh-client-ui-theme` | Theme service (register/setTheme/overrideTokens) |
| `@deepseek-ai/dsh-invariants` | Package invariant companion |
| `react` ^18.2.0 | UI rendering |

## License

MIT
