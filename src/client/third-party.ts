/**
 * Third-party plugin compatibility — the registry, and the boot self-check that names
 * collisions out loud.
 *
 * WHY THIS FILE EXISTS
 * This plugin does not restyle surfaces; it re-emits HOST TOKENS on `<body>` at a
 * slider's alpha (`OWNED_TOKENS`), and every element that fills from one of those names
 * fades with it — the host's own, and any other plugin's too. A third-party author has
 * no reason to expect that: a sticky bar painted with `background:var(--dsw-alias-bg-base)`
 * is correct on an unthemed host and invisible on ours, because our 「主界面」 slider
 * defaults to 0. That is issue-class §2-V, and it was found the slow way — a user
 * reported unreadable text, and someone had to grep another plugin's stylesheet to see
 * which token it drank.
 *
 * WHAT THE SELF-CHECK DOES
 * Third-party plugins tag their own stylesheets (`style[data-plugin="<package>"]` —
 * dsh-better-display mounts exactly that, at module load, before any of its views
 * exists). So the page can answer "who is installed and what of ours do they read"
 * without anyone reporting it: scan those sheets, look for `var(--<owned token>)`, and
 * name each hit once in the console. A registered pin says so and stays quiet; an
 * UNREGISTERED collision logs a warning, which turns "the user finds broken pixels and
 * files an issue" into "the boot log already knows which plugin and which token".
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * It never auto-pins an unknown surface. Guessing which of another plugin's elements are
 * "supposed to stay legible" would repaint someone else's design on a heuristic — the
 * §2-G lesson about heuristics with side effects. Detection is automatic; protection is
 * a reviewed table entry, and the settings card exposes it so a user can switch the
 * whole class off.
 */
import { OWNED_TOKENS } from './wallpaper'
import { watchDom } from './dom-watch'
import { rProtectThirdParty } from './state'
import { rHostInfo } from './host-compat/release'

/** One other plugin whose surface this plugin keeps legible. */
export interface ThirdPartyPin {
  /** npm package name — the same string that plugin puts in `data-plugin`. */
  plugin: string
  /** i18n key naming the protected surface on the settings card and in the log. */
  labelKey: string
  /** Body-side fallback presence probe, for a plugin that ships no tagged sheet. */
  probe?: string
  /** The tokens the pin holds steady. Declared rather than inferred so the card can
   *  still say something true when the plugin was detected by `probe` alone (its
   *  stylesheet may already have been removed, or it may tag them differently). */
  tokens: readonly string[]
  /** `pin` (default): a reviewed surface IS held steady by the `-third-party` sheet.
   *  `reviewed`: the collision was checked, but deliberately left under the slider's
   *  control — its whole surface is the thing the user is tuning, so pinning it would
   *  override a product decision (§2-V #2). The card and the boot log must say this
   *  instead of claiming protection, and must not ask for the same report again. */
  mode?: 'pin' | 'reviewed'
}

/** The table. Adding a plugin is one row here plus the CSS that honors it (a
 *  `reviewed` row is the exception: it is the documented decision NOT to add CSS).
 *
 *  The three rows below came from issue #34, reproduced on a real `0.2.2-rc.1` host
 *  (dshmarket 1.73.16 / dsh-better-sidebar 0.30.1 / dsh-update-checker 1.7.3). The
 *  token counts were re-counted in each installed bundle and match the report exactly;
 *  the chosen selectors are all 0-hit in that host's own artifacts (§2-V #7). */
export const THIRD_PARTY_PINS: readonly ThirdPartyPin[] = [
  {
    // The pinned surfaces are its sticky reading lanes; the CSS lives in
    // `wallpaper.ts` (`READER_LANE_RULE` / `applyThirdPartyPins`), which is also where
    // the `Reader.module.css:13 / :17 / :558` evidence is recorded.
    plugin: 'dsh-better-display',
    labelKey: 'tpReaderLanes',
    probe: '[data-dsh-better-display]',
    tokens: ['--dsw-alias-bg-base'],
  },
  {
    // Its 「任务」 popover (`Market.module.css` `.opPanel`, z-index 40, absolutely
    // positioned, no backdrop-filter) paints `var(--dsw-alias-bg-layer-1,#fff)`. The
    // root marker is the plugin's own (`data-dsh-market-root`), so the pin cannot
    // reach a host element even though `_opPanel` is a generic-looking suffix.
    plugin: 'dshmarket',
    labelKey: 'tpMarketTaskPopover',
    tokens: ['--dsw-alias-bg-layer-1'],
  },
  {
    // Two plain buttons with stable, unhashed names — `.dsh-update-btn` /
    // `.dsh-plugin-btn` — both `background:var(--dsw-alias-bg-layer-2,#374151)`.
    // Small enough that a plate literal is the whole fix; no geometry, no frost.
    plugin: 'dsh-update-checker',
    labelKey: 'tpUpdateButtons',
    tokens: ['--dsw-alias-bg-layer-2'],
  },
  {
    // `.pane` fills from `--dsw-alias-bg-base` and so does most of its workbench
    // (23 / 35 / 20 / 11 reads of bg-base / layer-1/2/3 respectively). Pinning that
    // whole surface would silently take the 「主界面」 slider away from the very panel
    // the user installed this plugin to tune. Reviewed, deliberately NOT pinned.
    plugin: 'dsh-better-sidebar',
    labelKey: 'tpSidebarReviewed',
    mode: 'reviewed',
    tokens: ['--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2', '--dsw-alias-bg-layer-3', '--dsw-specific-input-major', '--dsw-specific-menu'],
  },
]

/** A plugin seen on this page, and the owned tokens its own CSS consumes. */
export interface Sighting {
  plugin: string
  tokens: string[]
  pinned: boolean
  /** i18n key naming which of its surfaces the pin holds, when there is one — the
   *  settings card would otherwise say "pinned" about something the user cannot see
   *  the point of. */
  labelKey?: string
  /** Mirrors the registry row. Only a `pin` row claims protection; `reviewed` is a
   *  documented non-decision and must never render as "pinned". */
  mode?: 'pin' | 'reviewed'
}

/** This plugin's own sheets are tagged with its name (plus a suffix per table); they
 *  consume the tokens by design, so they must never count as a collision. */
const SELF = 'dsh-any-background'

/** The host's own client modules tag their stylesheets the same way — measured on
 *  0.2.1-rc.3: **157 of the 172 `style[data-plugin]` sheets on a real page belong to
 *  `@deepseek-ai/…`**, and they read these tokens on purpose (fading them IS the
 *  product). Treating them as collisions would concatenate ~540 KB of host CSS per
 *  scan, warn about the host's own UI, and fill the settings card with a hundred rows.
 *  So the host namespace is excluded by prefix. The cost of that rule is asymmetric on
 *  purpose: a scoped third-party package gets missed (no log, no wrong pixel), while a
 *  false positive would spam and mislead. */
const HOST_NAMESPACE = '@deepseek-ai/'

function isHost(name: string): boolean {
  return name.startsWith(HOST_NAMESPACE)
}

function isSelf(name: string): boolean {
  return name === SELF || name.startsWith(SELF + '-')
}

/** The package a sheet came from. Scoped names keep their scope (`@hytime/dsh-x` →
 *  `@hytime/dsh-x`, not `@hytime`), and a `pkg/module.css`-style tag trims to its
 *  package. Ordering matters: this runs AFTER the host/self tests, which must see the
 *  raw attribute — truncating first turned `@deepseek-ai/dsh-client-ui-chat` into
 *  `@deepseek-ai`, which no longer matches the `@deepseek-ai/` prefix and so let 157
 *  host sheets through as one phantom "plugin" (found on the real host, not in the
 *  mock: the mock only ever had one host-ish sheet to begin with). */
function pluginKey(name: string): string {
  if (name.startsWith('@')) {
    const i = name.indexOf('/', 1)
    return i > 0 ? name.slice(0, i) : name
  }
  const i = name.indexOf('/')
  return i > 0 ? name.slice(0, i) : name
}

let sightings: Sighting[] = []
const subs = new Set<() => void>()
const logged = new Set<string>()

/** Read every tagged third-party stylesheet in `<head>` and report the collisions.
 *  Runs at boot and again whenever a sheet appears; per sheet, not concatenated — the
 *  real page has 170+ sheets and the difference is measurable. */
function scan(): void {
  if (typeof document === 'undefined') return
  const hits = new Map<string, Set<string>>()
  const seen = new Set<string>()
  const note = (plugin: string, tokens: string[]): void => {
    seen.add(plugin)
    if (tokens.length === 0) return
    const set = hits.get(plugin) ?? new Set<string>()
    for (const t of tokens) set.add(t)
    hits.set(plugin, set)
  }

  for (const el of Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-plugin]'))) {
    const raw = (el.getAttribute('data-plugin') ?? '').trim()
    if (raw === '' || isSelf(raw) || isHost(raw)) continue
    const plugin = pluginKey(raw)
    const text = el.textContent ?? ''
    // `var(--token)`, `var(--token, fallback)` and `var(--token )` — the three ways a
    // consumer spells a read. A bare mention in a comment would not match, which is the
    // point: only a surface that actually paints from the token can collide with us.
    note(plugin, OWNED_TOKENS.filter(t =>
      text.includes(`var(${t})`) || text.includes(`var(${t},`) || text.includes(`var(${t} `)))
  }
  // A plugin can also be present without a tagged sheet — the table's probe covers it,
  // so the settings card does not silently omit something we are actually pinning.
  for (const pin of THIRD_PARTY_PINS) {
    if (pin.probe !== undefined && !seen.has(pin.plugin) && document.querySelector(pin.probe) !== null) note(pin.plugin, [])
  }

  const next: Sighting[] = []
  for (const plugin of seen) {
    const read = [...(hits.get(plugin) ?? [])]
    const pin = THIRD_PARTY_PINS.find(p => p.plugin === plugin)
    // An unregistered plugin that reads none of them is not a collision; say nothing.
    if (pin === undefined && read.length === 0) continue
    const s: Sighting = {
      plugin,
      // Detected by probe alone (no sheet that reads one of ours): report what the pin
      // holds, so the card is never blank about something it is pinning.
      tokens: read.length > 0 ? read : [...(pin?.tokens ?? [])],
      pinned: pin !== undefined,
      labelKey: pin?.labelKey,
      mode: pin?.mode,
    }
    next.push(s)
    report(plugin, s)
  }
  const changed = JSON.stringify(next) !== JSON.stringify(sightings)
  sightings = next
  if (changed) subs.forEach(cb => cb())
}

/** The exact line a user should paste into an issue. Production builds open no
 *  DevTools and do not persist the renderer console (issue #34), so the settings card
 *  has to be able to hand this over directly: one copy button, no reconstruction.
 *  The host release rides along because a token collision is release-specific. */
export function diagnosticLine(s: Sighting): string {
  const host = rHostInfo()
  return `dsh-any-background: ${s.plugin} paints from ${s.tokens.join(', ')} — ` +
    `the same tokens the interface-opacity sliders own. ` +
    `host=${host.version ?? 'unknown'} channel=${host.channel} ` +
    `protectThirdParty=${rProtectThirdParty() ? 'on' : 'off'} ` +
    `status=${s.mode === 'reviewed' ? 'reviewed-no-pin' : s.pinned ? 'pinned' : 'unregistered'}`
}

function report(plugin: string, s: Sighting): void {
  if (logged.has(plugin)) return
  logged.add(plugin)
  if (s.pinned && s.mode === 'reviewed') {
    console.log(`dsh-any-background: ${plugin} detected — reviewed, deliberately not pinned: its whole surface is what the interface-opacity sliders are for (${s.tokens.join(', ')})`)
    return
  }
  if (s.pinned) {
    // Say whether the pin is actually active: the user may have switched the whole
    // class off, and a log line that claims protection then is just wrong.
    const state = rProtectThirdParty()
      ? 'the registered compatibility pin keeps them legible'
      : 'a pin exists for it but 「保护第三方表面」 is currently OFF'
    console.log(`dsh-any-background: ${plugin} detected — its surfaces fill from tokens this plugin fades, and ${state} (${s.tokens.join(', ')})`)
    return
  }
  console.warn(
    `dsh-any-background: ${plugin} paints from ${s.tokens.join(', ')} — the same tokens the interface-opacity sliders own, ` +
    `so those surfaces fade with them. No compatibility pin is registered for ${plugin}; if one of its surfaces goes ` +
    `transparent or unreadable, copy its line from 设置 → 主题 → 第三方插件兼容 and send it in.`)
}

/** Snapshot of what the scan found (for the settings card). */
export function thirdPartySightings(): Sighting[] {
  return sightings
}

/** Subscribe to sightings changing. */
export function subscribeThirdParty(cb: () => void): () => void {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

/** Run the scan at boot and keep it current. Returns an unsubscribe for teardown. */
export function startThirdPartyWatch(): () => void {
  scan()
  // Sheets are appended to `<head>`, and the shared observer carries that tree too, so
  // this costs no second MutationObserver (see dom-watch).
  return watchDom(records => {
    // §R — batch and early-exit: the scan walks every tagged sheet on the page (170+ on
    // a real host), so it must not run on unrelated head churn. Only a newly added
    // sheet from a NON-host, non-self plugin can change the answer.
    let relevant = false
    for (const r of records) {
      for (const n of r.addedNodes) {
        if (!(n instanceof HTMLStyleElement)) continue
        const name = n.getAttribute('data-plugin')
        if (name !== null && !isSelf(name) && !isHost(name)) { relevant = true; break }
      }
      if (relevant) break
    }
    if (relevant) scan()
  }, 'head')
}
