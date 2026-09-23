# dsh-any-background

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm version" src="https://img.shields.io/npm/v/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm monthly downloads" src="https://img.shields.io/npm/dm/dsh-any-background?color=4d6bfe"></a>
  <a href="https://github.com/Tkingxiao/dsh-any-background/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/npm/l/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/@deepseek-ai/dsh?activeTab=versions"><img alt="Supported DSH versions: 0.1.5-rc.2 ~ 0.1.7-rc.1" src="https://img.shields.io/badge/DSH-0.1.5--rc.2%20~%200.1.7--rc.1-4d6bfe" /></a>
  <a href="https://github.com/topics/dsh-better-sidebar"><img alt="Plugin ecosystem: GitHub topic dsh-better-sidebar" src="https://img.shields.io/badge/plugin%20ecosystem-topic%20dsh--better--sidebar-4d6bfe" /></a><br /><br />
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

English | [中文](README.zh.md)

A **DeepSeek Harness** appearance plugin: custom theme color, background wallpaper (image / video / algorithmically generated), and fine-grained per-surface opacity & blur controls. Compatible with **DSH 0.1.5-rc.2 ~ 0.1.7-rc.1** (official-Sidebar UI such as the "Theme" card enables itself where the host exposes the Sidebar registry extension point, and is skipped silently where it does not).

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
- **Per-surface Interface Opacity** — Independent sliders for the main background, sidebar, cards & panels (including the dropdowns and menus around the dialog), the input & controls (composer box, Cordis panel), the settings panel, the conversation text frame, the trajectory view, the right sidebar (or bettersidebar), produced / highlighted content, and the header popovers (Agent Team panel, background-job list and the session-header dropdowns).
- **Per-surface Interface Blur** — Frosted-glass `backdrop-filter` blur (0–60 px) per surface, including a real backdrop on the composer, the Cordis panel and popover surfaces via stable host selectors.
- **Produced / Highlights** — Code blocks in conversation content (with their language banner), inline `code` highlight chips and produced chips share one opacity + blur slider. The opacity is the alpha of **each surface's own background color** (no second color stacked on top of the original), and the blur frosts that same layer so the wallpaper shows through the content.
- **Right sidebar / bettersidebar surface** — One slider pair (`panelOpacity` / `blurs.panel`), two identities: without dsh-better-sidebar it reads "右方侧边栏" (Right sidebar) and drives the official right Sidebar's surface tokens and frosted blur (works on 0.1.5-rc.2 through 0.1.7); with dsh-better-sidebar installed it reads "bettersidebar" and takes over that plugin's bottom workbench panel (the official sidebar keeps responding too). The row is always visible.
- **Header popovers** — The session-header dropdowns get their own opacity + blur pair: the Agent Team panel, the background-job list, the open-in-app / session-log menus and the subagent lineage tree. On 0.1.7 the open-in-app picker moved to a portal and the session-row menu became a dynamic slot, so the plugin observes the stable `conversation.session.header*` slot anchors and tags the open popover at runtime instead of relying on class shapes.
- **Sidebar "Theme" page (dual mode)** — The same five pages (Color / Interface / Font / Background / Profiles) register into two surfaces: without dsh-better-sidebar, a "Theme" card is contributed to the **official right Sidebar's guide page** through its public extension points (`sidebarRightTabs` + the `sidebar.right.pane.tab` keyed seat); with dsh-better-sidebar installed, the page registers in that plugin's sidebar instead and the official guide card withdraws itself, so the two never duplicate. Settings panel, official sidebar and better-sidebar all share one page implementation and one state store — a change in any of them shows up everywhere. The shell adapts to the panel width, and a narrow panel tightens padding and falls back to a single column. On a host without the right Sidebar the registration silently never happens.
- **Conversation View Cards** — The message list is wrapped in a translucent card automatically, and the trajectory page gets whole-page opacity & blur controls, letting the wallpaper shine through the content.
- **Theme Export / Import** — One-click export to a self-contained `dsh-any-theme.json` (config + wallpaper, video embedded as a data URL) and import to restore it anywhere.
- **Appearance Presets & Profiles** — Six one-click presets (Default / Frosted glass / Minimal / Midnight / Cyber / Warm daylight) plus named profiles: save the current look and re-apply it anytime. A two-step confirm guards deletion.
- **Wallpaper Rotation** — Add images to a rotation pool (thumbnail picker included) and let the wallpaper change by shuffle or order on every refresh, daily, or weekly. Advancing copies the chosen image into the active wallpaper slot, so export/import and color extraction keep working unchanged.
- **Day/Night Auto Switch** — Assign a day profile and a night profile; the plugin switches automatically at fixed clock times or by following the OS dark mode.
- **Custom Font** — Upload a ttf / otf / woff / woff2 file (up to 100 MB) and apply it to the whole interface through `@font-face`; toggle it off or remove it at any time. Fonts stream as raw bytes and persist in the plugin data dir; code blocks keep their monospace stack.
- **Per-part Text Outline** — The same surface groups as the interface page (now ten, including the header popovers), each with its own `-webkit-text-stroke`: width 0–4 px (0 = off) and a color of auto-contrast / gray / black / white / accent / custom. Code blocks, inline `code`, icons and the host's `background-clip: text` shimmer chrome (the "深度求索中" turn-status line and the turn-process rows) are exempted automatically, so multi-color syntax never smears and gradient text is never flattened into a stroke-coloured blob.
- **Forced Interface Scheme** — Force light or dark token palettes regardless of the accent color's lightness; in `Auto` both the surface and font directions follow the accent's lightness (dark pick → light fonts, light pick → dark fonts), falling back to the wallpaper's perceived brightness when no color is picked.
- **File-based Persistence** — All settings are stored on the filesystem under `~/.dsh/.dsh-any-background-data/`, not `localStorage`.
- **Bilingual** — Full Chinese / English UI with automatic locale detection.
- **Theme Watchdog** — Re-asserts the custom theme if the host resets it.

## Changelog (latest two releases)

### v0.3.1 (Isolated per-version adaptation: one folder per host release)

- **Front-loaded release detection**: resolving the host release and bucketing its channel now lives in `src/host-compat/` (the Node half reads the release out of the very `@deepseek-ai/dsh/package.json` the process was composed from — `ctx.profileContext.installAnchor` — falling back to the manifest beside the launcher's `homes/<ver>` and then to the directory name; the verdict travels in the `read` RPC payload), with `src/client/host-compat/` receiving it on the client, broadcasting changes, and re-cutting the static stylesheet the moment the verdict lands. Version logic that used to be spread across `src/client/host.ts` and its call sites is consolidated there; that module is gone.
- **One folder per release**: under `src/client/host-compat/versions/`, the `v0-1-5-rc-2-3` / `v0-1-6-alpha-1-2` / `v0-1-7-alpha-1-2-rc-1` / `unknown` folders each describe that version's panel mechanics (which layer carries the promotion and the blur) and its header slot keys, and `versions/registry.ts` is the plugin's only release → code mapping. Base code only asks the adapter questions (who owns the guide surface, which slot selectors apply) and never compares version strings — supporting a new host means adding a folder and registering it, leaving base code untouched.
- **Release identity is named down to the channel**: an adapter key is no longer a bare patch number like `0.1.5` but "patch line + prerelease channel" — `0.1.5-rc`, `0.1.6-alpha`, `0.1.7-alpha`. Each folder's mechanics were checked tag by tag against a specific channel, so recording `0.1.5-rc.3` and a hypothetical `0.1.5-beta.1` under one key would let an unverified shape inherit a verified conclusion. Folders and adapter ids now name the exact tags behind them (`v0-1-6-alpha-1-2` reporting `0.1.6-alpha.1/alpha.2`), so how far a table reaches is readable without opening it — and where two builds on one line genuinely differ (`leading` header slot and the plugin-manager page only exist from `0.1.6-alpha.2`), the folder carries that prerelease gate itself.
- **Releases outside the verified table take the nearest adapter**: the `SUPPORTED_RELEASES` table in `src/host-compat/channel.ts` (`0.1.5-rc.2` / `0.1.6-alpha.2` / `0.1.7-alpha.2` / `0.1.7-rc.1`, oldest first — one row per build whose facts were checked, so one line may carry two) is matched by PATCH LINE first: a machine on `0.1.6-alpha.4` gets the `0.1.6-alpha` adapter even though verification stopped at `alpha.2`, because the number after the channel is only a build counter on that line — and `0.1.6-beta.1` or a future channel-less `0.1.6` count as the same line too. Only when no verified line covers the patch number does it clamp: newer than the newest → that newest adapter, older than the oldest → the oldest, strictly between two → the LOWER one, since an adapter may only claim what it was verified for. A clamped verdict logs one line saying the host is outside the verified range and which adapter is standing in, so a report against a new host build starts from that fact. Falling into `unknown` — where the DOM arbitrates — is left for the case where no release parses at all (a plain `~/.dsh` install, for instance).
- **`0.1.7-rc.1` joins the verified range without an adapter change**: diffed against `0.1.7-alpha.2`, every anchor this plugin matches is still emitted where it was, so the 0.1.7 folder only gained that build in its name (`v0-1-7-alpha-1-2-rc-1`) plus a `SUPPORTED_RELEASES` row — which turns an rc.1 host's verdict from `line` into `exact`. What did change is how the host reads the manifest: from rc.1 the profile composition checks each plugin's `@deepseek-ai/dsh*` `peerDependencies` against the running release and **disables its row before importing a single module** when a declared range does not match, the only way past that being an exact-version exemption the plugin manager stores in the profile's own `compatibility.json`. `engines.dsh` remains declarative, so the peer list is what decides whether the plugin runs — hence `|| 0.1.7-rc.1` on all seven `@deepseek-ai/dsh-*` peers.
- **No `:has()` dependency once the host is known**: a resolved release emits its own targeted branches, ungated. That also fixes a latent problem: on an engine without `:has()` the previous gate dropped the panel promotion entirely on 0.1.5 / 0.1.6. An unresolvable release still falls into `unknown` and lets the DOM shape arbitrate (`:has()` dual arms) instead of guessing a version.
- **Header popover selectors spelled once**: the top-bar surface list was duplicated three times inside `wallpaper.ts`; it is now composed once and shared by the opacity rule and the outline rule (the latter deliberately keeps the bare tag without `[role]`, with the reason documented in place). Slot keys come from the adapter, so the `leading` slot unique to `0.1.6-alpha.2` no longer leaks into base code.
- **The plugin page's card list is framed**: `Settings → Plugins` renders each group's plugins in a `ul` that has no surface of its own, so with the settings surfaces faded the whole table floated straight on the wallpaper. Each group's list now gets what the composer capsule gets — a rounded frosted block on an `::before` underlay, painted from the settings-interface opacity and frosted by the settings blur (the page is a sibling of the settings dialog on 0.1.7, so reading the dialog's own token re-scope would have left it on the homepage alpha). It is contributed only by the adapters whose release ships that page, so the selector never rides a host that cannot match it.
- **Fixed the wallpaper disappearing while the right Sidebar animates**: the AppFrame's own translucent background was cleared with an inline `background: transparent`, and the host's `style` rewrite during the sidebar open/close animation dropped it — the frame snapped back to an opaque layer, hiding the wallpaper and flattening every frost above it, because a `backdrop-filter` with nothing behind it has nothing to blur. The clear is a class rule with `!important` now, which the host's style writes cannot reach (measured on the live frame: `rgb(200,207,218)` opaque → `rgba(0,0,0,0)` with the class, opaque again without it).
- **Fixed the chat card landing on a settings page at startup**: while no conversation view is mounted (starting the host with the settings panel open, for instance), the marker-less chat-card fallback picked "the largest scrollable element" by geometry — so the settings page got card chrome plus a frost underlay (`<div class="dab-part-underlay">`) spread over the whole window. The fallback can now only refine a conversation that already exists: with none of `[data-chat-flow]` / `[data-conversation-scroll]` / `[data-composer-seat]` / `[data-conversation-composer-overlay]` present in the center column it no longer guesses, and candidates inside the settings dialog are still rejected.
- **Fixed the covered area of the per-part frosted blur**: the class rule for the hosting element was missing its leading dot (`dab-part-blur{isolation:isolate}`), so that layer never created a stacking context and the `z-index:-1` frost underlay fell into the page-level one — its sampling region and its painted position both stopped matching the surface (measured live: the host element's computed `isolation` was `auto`). With the dot restored, the frost stays inside its own surface. This defect predates v0.3.0.
- Corrected several wrong assumptions about the host: the native right Sidebar and `ctx.sidebarRightTabs` are not a new-host feature (`0.1.5-rc.2` already ships them), and dockkit itself predates 0.1.7 — only its `host` / `empty` attributes are 0.1.7 markers.
- README: the Compatibility section gains a "Isolated per-version adaptation" entry and Known limitations names the layer where version-specific selectors live; the intro no longer implies the official-Sidebar UI exists only on newer hosts.

### v0.3.0 (DSH 0.1.7 adaptation, compatible with 0.1.5-rc.2 ~ 0.1.7-alpha.1)

- **0.1.7 right Sidebar**: the host reworked that panel — it is now a *stationary* frame whose docked children (`[data-dockkit-host="dock"]` / `[data-dockkit-empty]`) carry the slide transform, and the panel no longer paints its own background. The plugin follows the new shape: the blur rides the sliding children so it travels with the sidebar instead of staying pinned, and the surface tokens are re-scoped where the panel actually renders. The previous unconditional `position:fixed` promotion was removed — on 0.1.7 it detached the panel from the animated track.
- **0.1.6 right Sidebar blur restored**: `[data-dockkit-host]` only exists from 0.1.7, so the child-based blur selector matched nothing on 0.1.6 (which slides the panel itself). A second, `:has()`-gated arm now frosts the panel wrapper there, and the pre-0.1.7 promotion is re-applied only where it is needed.
- **Gradient "shimmer" text is no longer flattened by the outline feature**: `-webkit-text-stroke` is inherited, so the conversation-frame rule reached the `background-clip: text` activity chrome — the "深度求索中" turn-status line (0.1.5/0.1.6) and the turn-process/shimmer rows (0.1.7) turned into a flat stroke-coloured blob. They are now explicitly exempt, matched by `[role="status"]`, `[data-turn-process]` and the TextShimmer marker.
- **New "Header popovers" surface**: the Agent Team panel, background-job list, open-in-app / session-log menus and the subagent lineage tree get their own opacity + blur sliders, plus a matching outline group. Because these popovers are portalled to `<body>` (severed from the header) and 0.1.7 moved open-in-app to a portal and made the session-row menu a dynamic slot, a runtime tagger watches the stable `conversation.session.header*` slot anchors and marks the open popover. The exempt confirm dialogs and session-row menu are pinned opaque with real color literals — no self-referencing `var()` fallback, which is a CSS cycle that would render them fully transparent.
- **Host release detection**: the client context exposes no host version (`window.__DSH_BOOT__.version` is a module-table tag, not a release), so the release plus a generation bucket is resolved on the Node half from the launcher's on-disk layout and handed to the client through the `read` RPC payload. Feature gates use it; when it cannot be determined they fall back to capability probing rather than guessing.
- **Native support for the official right Sidebar**: a "Theme" card is contributed to the official Sidebar's guide page through its public extension points (a page type in `ctx.sidebarRightTabs` plus the keyed `sidebar.right.pane.tab` body seat), opening the same five pages as the settings panel. Active without dsh-better-sidebar; when that plugin is present, its own "Theme" page takes over and the official guide card withdraws itself. Registration waits on the service at runtime — hosts without the Sidebar registry API skip it silently, so older hosts are unaffected.
- **The right-sidebar slider row follows the environment**: the Interface page's panel group (`panelOpacity` / `blurs.panel`) reads "右方侧边栏" (Right sidebar) without better-sidebar — driving the official right Sidebar's surface tokens and frosted blur on 0.1.5-rc.2 through 0.1.7 — and "bettersidebar" with it. The row is now always visible instead of hiding when better-sidebar is absent.
- The better-sidebar presence probe no longer counts `[data-sidebar-right-panel]`: on every host generation that is the official right Sidebar's stable marker (present whenever a session is open), so counting it pinned the "bettersidebar" verdict to true forever.
- Compatibility declarations now cover `0.1.5-rc.2`, `0.1.5-rc.3`, `0.1.6-alpha.1`, `0.1.6-alpha.2` and `0.1.7-alpha.1`; peerDependencies widened to span every generation of the client packages; `@deepseek-ai/dsh-home-paths` stays at the lockfile-consistent `^0.1.0-rc.6` (build-time only — the host injects its own copy at runtime).

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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness) 0.1.5-rc.2 ~ 0.1.7-rc.1** — The range covers all seven published releases (`0.1.6-alpha.2` and `0.1.7-alpha.1` / `0.1.7-alpha.2` verified hands-on, `0.1.7-rc.1` verified by diffing it against `0.1.7-alpha.2`); `engines.dsh`, the `@deepseek-ai/dsh-*` `peerDependencies` and `dsh.compatibility.dshReleases` list them explicitly — from `0.1.7-rc.1` the host itself enforces the peer list, so naming a release there is what makes the plugin load, not documentation. The host release is resolved on the Node half at runtime, and features that depend on a specific host release channel (the right Sidebar's panel blur, the official Sidebar's "Theme" card) enable themselves only where the corresponding host structure exists; everything else behaves identically across the range.
- **Isolated per-version adaptation**: the release is resolved on the Node half from the app manifest the process was composed from (`ctx.profileContext.installAnchor`, with the launcher's on-disk layout behind it — the client context exposes no version) and, once handed down through the `read` RPC, is routed only by the front-layer adapter — `src/host-compat/` detects and buckets channels, while `src/client/host-compat/versions/` holds **one folder per release** (`v0-1-5-rc-2-3` / `v0-1-6-alpha-1-2` / `v0-1-7-alpha-1-2-rc-1` / `unknown`), each describing that version's panel mechanics and header slot keys. Base code just asks the adapter questions (who owns the guide surface, which layer carries the blur) and never compares version strings. Another build on a verified patch line (`0.1.6-alpha.4` against a table checked at `alpha.2`) keeps that line's adapter, and a patch line nothing was checked against clamps to the nearest one with a log line saying so. Only a release that will not parse at all falls into `unknown` and probes the DOM shape instead of guessing (`:has()` dual arms); supporting a new host means adding one folder and registering it.
- **[DSHA](https://github.com/DSH-APP/DSHA)** — DeepSeek Harness Android launcher (ROOT-free, Termux-free). Its bundled `dsh` is `0.1.5-rc.2`, inside the supported range; the mobile UI shell is provided by `dsh-web-mobile`.
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — Supported

## Permissions, side effects & boundaries

- **Integration form**: official Profile Bundle — `package.json` declares `dsh.bundle.patch: ./cordis.patch.yml` (a loader insert layer), the repository ships prebuilt runtime artifacts ready to use (`lib/index.js`, `lib/invariant.js`, `lib/client.js`), and there are no install scripts, no `postinstall`, no native binaries, and no build step at install time.
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
