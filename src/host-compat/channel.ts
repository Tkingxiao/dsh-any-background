/**
 * Single source of truth for what a DSH release IS, and which adapter answers
 * for a release the plugin has never seen.
 *
 * Shared by both halves of the plugin: the node half resolves the release from
 * disk (see `detect.ts`) and ships the verdict to the client half, which uses it
 * to pick a per-version adapter (see `client/host-compat/versions/`). Keeping the
 * bucketing here means the two halves can never disagree about what `0.2.0-rc`
 * means — a drifted matcher on one side would silently hand the client a channel
 * the client's registry has no adapter for.
 *
 * @module
 */

/** Adapter channels the plugin ships an adapter for: a patch line plus its
 *  prerelease channel, so `0.2.0-rc.1` and a hypothetical `0.2.0-beta.1` are NOT
 *  the same answer. `unknown` is the "could not determine the release" bucket,
 *  not a release.
 *
 *  `0.2.0-rc.2` is keyed down to the BUILD because the line split against that
 *  scheme: `0.2.0-rc.1` and `0.2.0-rc.2` are the same patch line AND the same
 *  prerelease channel, yet rc.2 renamed the token a sticky menu group heading
 *  paints from, so the rc.1 answer is no longer complete for it. When one channel
 *  name cannot hold both halves of a line, the half that opened the new facts is
 *  named for the build that opened them, and `classifyRelease`'s "highest verified
 *  row at or below the host" hands every later `0.2.0-rc` (and `0.2.0` stable) to
 *  it.
 *
 *  `0.2.1` IS KEYED TO THE PATCH LINE, not to a prerelease name, because the line's
 *  alpha builds and its rc builds answer with the same facts: checked per tag from
 *  `0.2.1-alpha.1` through `0.2.1-rc.2`, no file the adapter speaks for moved (the
 *  one shape change, the job list moving onto `MenuSurface` at `alpha.3`, is
 *  absorbed by DOM-shape selectors rather than by a per-release answer). A channel
 *  name that splits alpha from rc would be two folders asserting identical facts.
 *
 *  The 0.1.5 / 0.1.6 / 0.1.7 channels are GONE: their folders went with them, and a
 *  channel with no folder is a compile error, not a fallback. A host still sitting
 *  on that era clamps to the oldest row here and says so (`nearest`). */
export type HostChannel =
  | '0.2.0-rc'
  | '0.2.0-rc.2'
  | '0.2.1'
  | 'unknown'

/** A known channel — one that has a real adapter. */
export type KnownChannel = Exclude<HostChannel, 'unknown'>

/** A release the plugin verified an adapter against. Oldest first. */
export interface SupportedRelease {
  readonly channel: KnownChannel
  /** The build the folder's facts were checked against. It orders the table, so
   *  bumping it is part of re-verifying an adapter against a newer build. */
  readonly release: string
}

/** What this plugin supports, in upgrade order. One row = one build whose facts
 *  were checked; several rows may share a `channel` when a newer build was
 *  verified as needing no change to that folder's adapter (as `0.2.1-alpha.2` was) —
 *  a row then reports `exact` instead of `line`, and no new folder appears.
 *  Rows may ALSO share a patch line while carrying different channels, which is
 *  how a line says "the facts changed halfway through it" (`0.2.0-rc.2` opens a
 *  second answer on a line that had one — see the note on `HostChannel` for why
 *  that row is keyed to the build).
 *  Adding an ADAPTER means adding a channel plus a folder in
 *  `client/host-compat/versions/`. */
export const SUPPORTED_RELEASES: readonly SupportedRelease[] = [
  { channel: '0.2.0-rc', release: '0.2.0-rc.1' },
  { channel: '0.2.0-rc.2', release: '0.2.0-rc.2' },
  { channel: '0.2.1', release: '0.2.1-alpha.1' },
  { channel: '0.2.1', release: '0.2.1-alpha.2' },
  { channel: '0.2.1', release: '0.2.1-alpha.3' },
  { channel: '0.2.1', release: '0.2.1-alpha.4' },
  { channel: '0.2.1', release: '0.2.1-alpha.5' },
  { channel: '0.2.1', release: '0.2.1-rc.1' },
  { channel: '0.2.1', release: '0.2.1-rc.2' },
]

/** How the chosen adapter relates to the release that was detected. Reported so a
 *  guess never reads as a verified match:
 *  · `exact` — the host is on a build this table was checked against.
 *  · `line` — a different build of a VERIFIED patch line (`0.2.1-alpha.3`, or a
 *    future `0.2.1` stable); same line, so the adapter normally holds.
 *  · `nearest` — no verified line covers it, so the closest one is clamped to:
 *    the newest above everything for a newer host, the oldest for an older one.
 *  · `unresolved` — no release parsed at all; the DOM arbitrates. */
export type ChannelMatch = 'exact' | 'line' | 'nearest' | 'unresolved'

/** The adapter to use, and how much trust that answer deserves. */
export interface HostVerdict {
  readonly channel: HostChannel
  readonly match: ChannelMatch
}

/** Resolved host facts, as they travel node → client over the `read` payload. */
export interface HostInfo {
  /** Full detected release string (`0.1.6-alpha.2`), or null when undetermined. */
  version: string | null
  /** Channel derived from `version`, used to pick an adapter. */
  channel: HostChannel
}

export const UNKNOWN_HOST_INFO: HostInfo = { version: null, channel: 'unknown' }

/** True when a string looks like a release version. A bare `~/.dsh` directory
 *  basename does not, which is why the disk probe sanity-checks before trusting
 *  a path segment. */
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

export function looksLikeVersion(value: string): boolean {
  return VERSION_RE.test(value)
}

/** A release broken into the parts that decide an adapter. `channel` is the FIRST
 *  prerelease identifier (`rc` in `0.1.5-rc.3`, `alpha` in `0.1.7-alpha.1`) — that
 *  is the half of the tag stating which development line the build belongs to;
 *  `build` is only a counter within that line. */
interface Parsed {
  readonly core: readonly [number, number, number]
  readonly channel: string | null
  readonly build: number | null
}

const PARSE_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

function parse(version: string): Parsed | null {
  const m = PARSE_RE.exec(version)
  if (m === null) return null
  const parts = m[4] === undefined ? [] : m[4].split('.')
  const build = parts.length > 1 ? Number(parts[1]) : NaN
  return {
    core: [Number(m[1]), Number(m[2]), Number(m[3])],
    channel: parts.length > 0 ? parts[0]! : null,
    build: Number.isFinite(build) ? build : null,
  }
}

/** The table, parsed once: every row is a literal this file controls. */
const TABLE = SUPPORTED_RELEASES.map(row => ({ ...row, parsed: parse(row.release)! }))

function cmpCore(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1
  }
  return 0
}

/** Total order over releases, following the semver rule that a prerelease sorts
 *  BELOW the release it precedes (`0.1.6-alpha.2 < 0.1.6`). */
function cmp(a: Parsed, b: Parsed): number {
  const core = cmpCore(a.core, b.core)
  if (core !== 0) return core
  if (a.channel === null || b.channel === null) {
    if (a.channel === b.channel) return 0
    return a.channel === null ? 1 : -1
  }
  if (a.channel !== b.channel) return a.channel < b.channel ? -1 : 1
  const ab = a.build ?? 0
  const bb = b.build ?? 0
  return ab === bb ? 0 : ab < bb ? -1 : 1
}

/** Pick the adapter for a release, clamping to the nearest verified line when the
 *  release is outside everything this plugin has seen.
 *
 *  A release is matched by PATCH LINE before anything else: `0.2.1-alpha.3` and a
 *  future `0.2.1` stable both belong to the line verified at `0.2.1-alpha.1…rc.2`, and
 *  handing them that adapter beats giving up — the DOM probes only cover panel
 *  mechanics, not the surface decisions the line is known for.
 *
 *  Outside every verified line the answer is a guess, so it is the closest one and
 *  it says so (`nearest`): newer than the newest line → that newest adapter, older
 *  than the oldest → the oldest, strictly between two → the LOWER one, because an
 *  adapter may only claim what it was verified for. A release that will not parse
 *  at all is `unknown`, and the DOM arbitrates there. */
export function classifyRelease(version: string | null): HostVerdict {
  const host = version === null ? null : parse(version)
  if (host === null) return { channel: 'unknown', match: 'unresolved' }

  const sameLine = TABLE.filter(row => cmpCore(row.parsed.core, host.core) === 0)
  if (sameLine.length > 0) {
    // `exact` names THE BUILD the row was checked against, not its channel: a
    // channel-only test would call `0.2.1-alpha.3` exact against a table verified
    // at `alpha.2`, and `line` exists precisely so an unverified build says so.
    const exact = sameLine.find(row => row.release === version)
    if (exact !== undefined) return { channel: exact.channel, match: 'exact' }
    // A patch line may carry several verified builds AND several channels, so take
    // the highest row at or below the host: an unverified newer build gets the
    // newest verification that precedes it, whichever folder that was
    // (`0.2.0-rc.3` → the rc.2 facts, not the rc.1 ones), and one older than every
    // row falls back to the line's first, since the folder's facts were derived from
    // that shape.
    const atOrBelow = sameLine.filter(row => cmp(row.parsed, host) <= 0)
    const chosen = atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1]! : sameLine[0]!
    return { channel: chosen.channel, match: 'line' }
  }

  const older = TABLE.filter(row => cmp(row.parsed, host) < 0)
  if (older.length === 0) return { channel: TABLE[0]!.channel, match: 'nearest' }
  const newer = TABLE.filter(row => cmp(row.parsed, host) > 0)
  if (newer.length === 0) return { channel: TABLE[TABLE.length - 1]!.channel, match: 'nearest' }
  return { channel: older[older.length - 1]!.channel, match: 'nearest' }
}

/** The channel a release maps onto — the verdict's answer without the confidence. */
export function channelOf(version: string | null): HostChannel {
  return classifyRelease(version).channel
}
