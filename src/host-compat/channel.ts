/**
 * Single source of truth for what a DSH release IS, and which adapter answers
 * for a release the plugin has never seen.
 *
 * Shared by both halves of the plugin: the node half resolves the release from
 * disk (see `detect.ts`) and ships the verdict to the client half, which uses it
 * to pick a per-version adapter (see `client/host-compat/versions/`). Keeping the
 * bucketing here means the two halves can never disagree about what `0.1.6-alpha`
 * means — a drifted matcher on one side would silently hand the client a channel
 * the client's registry has no adapter for.
 *
 * @module
 */

/** Adapter channels the plugin ships an adapter for: a patch line plus its
 *  prerelease channel, so `0.1.5-rc.2` and a hypothetical `0.1.5-beta.1` are NOT
 *  the same answer. `unknown` is the "could not determine the release" bucket,
 *  not a release. */
export type HostChannel = '0.1.5-rc' | '0.1.6-alpha' | '0.1.7-alpha' | 'unknown'

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
 *  verified as needing no change to that folder's adapter (as `0.1.7-rc.1` was) —
 *  a row then reports `exact` instead of `line`, and no new folder appears.
 *  Adding an ADAPTER means adding a channel plus a folder in
 *  `client/host-compat/versions/`. */
export const SUPPORTED_RELEASES: readonly SupportedRelease[] = [
  { channel: '0.1.5-rc', release: '0.1.5-rc.2' },
  { channel: '0.1.6-alpha', release: '0.1.6-alpha.2' },
  { channel: '0.1.7-alpha', release: '0.1.7-alpha.2' },
  { channel: '0.1.7-alpha', release: '0.1.7-rc.1' },
]

/** How the chosen adapter relates to the release that was detected. Reported so a
 *  guess never reads as a verified match:
 *  · `exact` — the host is on a build this table was checked against.
 *  · `line` — a different build of a VERIFIED patch line (`0.1.6-alpha.4`, or a
 *    future `0.1.6` stable); same line, so the adapter normally holds.
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
 *  A release is matched by PATCH LINE before anything else: `0.1.6-alpha.4` and a
 *  future `0.1.6` stable both belong to the line verified at `0.1.6-alpha.2`, and
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
    // channel-only test would call `0.1.7-alpha.4` exact against a table verified
    // at `alpha.2`, and `line` exists precisely so an unverified build says so.
    const exact = sameLine.find(row => row.release === version)
    if (exact !== undefined) return { channel: exact.channel, match: 'exact' }
    // A line may carry several verified builds (`0.1.7-alpha.2` and `0.1.7-rc.1`
    // both speak for `0.1.7-alpha`), so take the highest row at or below the host:
    // an unverified newer build gets the newest verification that precedes it, and
    // one older than every row falls back to the line's first, since the folder's
    // facts were derived from that shape.
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

/** Prerelease tag of a release string (`alpha.2` in `0.1.6-alpha.2`), or null
 *  when the version is bare/undetermined. Needed because a channel is coarser
 *  than reality: `conversation.session.header.leading` ships in exactly one
 *  build within the 0.1.6-alpha line. */
export function prereleaseOf(version: string | null): string | null {
  if (version === null) return null
  const m = /^\d+\.\d+\.\d+-([0-9A-Za-z.-]+)$/.exec(version)
  return m?.[1] ?? null
}
