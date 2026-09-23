/**
 * The front door: resolve which DSH release this plugin is running under.
 *
 * WHY IT RUNS HERE (node) AND NOT IN THE BROWSER
 * The client context exposes no host version — verified against the harness: no
 * `hostVersion`/`dshVersion` field on `ctx`, and `window.__DSH_BOOT__.version` is
 * the module-table format tag `'client'`, not a release. Capability probing alone
 * is also not enough, because the obvious probes do not separate the release
 * lines:
 * `ctx.sidebarRightTabs` and the `[data-sidebar-right-panel]` marker both exist on
 * 0.1.5-rc.2 already, so either one used as a "0.1.6+" test mis-classifies 0.1.5
 * as newer. The install the process was composed FROM states the release directly,
 * and only the node half can read it.
 *
 * Three hops, most authoritative first:
 *   1. `ctx.profileContext.installAnchor` — the absolute path of the running
 *      app's own manifest (`<…>/node_modules/@deepseek-ai/dsh/package.json`; the
 *      host passes exactly that file, `new URL('../package.json', import.meta.url)`
 *      of its `dsh` package). Whatever process is serving this plugin is what that
 *      manifest versioned, so it needs no path guessing. Provided by
 *      `dsh-app-boot` only in a dsh-launched profile, hence optional.
 *   2. The installed manifest next to the launcher home:
 *      `<root>/versions/<ver>/node_modules/@deepseek-ai/dsh/package.json`, reached
 *      from `$DSH_HOME`'s `homes/<ver>` layout. For a host that gives no
 *      `profileContext`.
 *   3. `$DSH_HOME`'s basename, because launcher homes live in a folder named after
 *      the release (`.../homes/0.1.6-alpha.2`). A user may point DSH_HOME at a
 *      plain `~/.dsh` (no launcher layout at all), whose basename is not a
 *      version — hence `looksLikeVersion` gates it.
 *
 * A release that resolves but matches no verified patch line is clamped to the
 * nearest adapter by `classifyRelease()`; only a release that will not parse at
 * all degrades to `version: null` / `channel: 'unknown'`, where the client half
 * falls back to DOM-shape probing. That fallback is not hypothetical: a plain
 * `~/.dsh` install lands here, and a wrong guess would silently restyle the
 * user's window.
 *
 * @module
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import { classifyRelease, looksLikeVersion, SUPPORTED_RELEASES, type HostInfo } from './channel'

export type { HostInfo } from './channel'

/** What "the verified lines" are, spelled out for the clamp log below. */
const SUPPORTED_HINT = SUPPORTED_RELEASES.map(row => row.release).join(' ~ ')

/** Read the `version` field of a package manifest, or null when the file is
 *  missing, unreadable, not JSON or does not declare a release-looking version —
 *  every one of which just means "this hop has no answer". */
async function manifestVersion(file: string): Promise<string | null> {
  try {
    const raw = JSON.parse(await readFile(file, 'utf8')) as { version?: unknown }
    if (typeof raw.version === 'string' && looksLikeVersion(raw.version.trim())) return raw.version.trim()
  } catch {
    /* not our layout, not our answer */
  }
  return null
}

/** Hop 1: the anchor the host itself hands us. A custom composition may point it
 *  at its own manifest, whose `version` is whatever that project calls itself —
 *  `looksLikeVersion` inside `manifestVersion` is what keeps a non-release out. */
async function versionFromAnchor(anchor: unknown): Promise<string | null> {
  if (typeof anchor !== 'string' || anchor === '') return null
  if (!/[/\\]package\.json$/.test(anchor)) return null
  return manifestVersion(anchor)
}

/** Hop 2: the installed manifest two levels up from a launcher home
 *  (`<root>/homes/<ver>` → `<root>/versions/<ver>`), or null when the layout does
 *  not apply (plain `~/.dsh`, non-launcher hosts). */
async function versionFromLauncher(homeDir: string): Promise<string | null> {
  const root = dirname(dirname(homeDir))
  const versionSeg = basename(homeDir)
  if (!looksLikeVersion(versionSeg)) return null
  return manifestVersion(
    join(root, 'versions', versionSeg, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'),
  )
}

/** Cached verdict: the probe touches the filesystem, and the host release never
 *  changes within a process lifetime. */
let cache: HostInfo | undefined

/** Resolve (and cache) the host release + channel. `installAnchor` is
 *  `ctx.profileContext?.installAnchor`, read at plugin mount time.
 *
 *  A clamped verdict (`nearest`) is logged once: it means the plugin is styling a
 *  release it was never verified against, and that is the first thing to know when
 *  a new host build reports a broken surface. */
export async function resolveHostInfo(installAnchor: unknown): Promise<HostInfo> {
  if (cache !== undefined) return cache
  const homeDir = dshHomePath()
  let version = await versionFromAnchor(installAnchor)
  if (version === null) version = await versionFromLauncher(homeDir)
  if (version === null) {
    const seg = basename(homeDir)
    if (looksLikeVersion(seg)) version = seg
  }
  const verdict = classifyRelease(version)
  if (verdict.match === 'nearest') {
    console.log(`dsh-any-background: host release ${version} is outside the verified lines, styling it as ${verdict.channel} (supports ${SUPPORTED_HINT})`)
  }
  cache = { version, channel: verdict.channel }
  return cache
}
