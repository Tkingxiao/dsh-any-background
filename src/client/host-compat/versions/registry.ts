/**
 * The registry: release channel → the adapter folder that speaks for it.
 *
 * The ONLY place in the plugin that maps a release onto code. Adding a new DSH
 * line is a three-step change with no existing file to touch:
 *   1. `KnownChannel` (and `channelOf`) in `src/host-compat/channel.ts`,
 *   2. a folder here, mirroring the others, NAMED FOR THE EXACT TAGS ITS FACTS
 *      WERE CHECKED AGAINST (`v0-2-1`, `v0-2-2`) so the precision of the table is
 *      readable from the tree, and the folder states inside it which prerelease
 *      gates it carries,
 *   3. the row below.
 * A newer build that turns out to need NO change does not get its own folder: it
 * joins the name of the folder whose facts held (`v0-2-1`, checked from `alpha.1`
 * through `rc.5`) and gains a `SUPPORTED_RELEASES` row, which is what moves that
 * host's verdict from `line` to `exact`.
 * Anything that reads an adapter then picks it up without an edit — which is the
 * point: version branching must not be reachable from the styling code.
 *
 * THE TABLE STARTS AT `0.2.1-alpha.1`. The 0.1.x / 0.2.0 folders were removed:
 * hosts below 0.2.1 are no longer supported, and nothing in the plugin still
 * asserts a fact earned on those lines. An older host is not unsupported in the
 * sense of crashing — `classifyRelease` clamps it to the oldest row and reports
 * `nearest`, and `detect.ts` logs that verdict, so an old host gets the 0.2.1
 * styling with the mismatch stated out loud rather than a silent guess.
 *
 * @module
 */
import type { HostAdapter, HostChannel, HostInfo } from './types'
import { createAdapter as adapterFor021 } from './v0-2-1/adapter'
import { createAdapter as adapterFor022 } from './v0-2-2/adapter'
import { createAdapter as adapterForUnknown } from './unknown/adapter'

const ADAPTERS: Record<HostChannel, (host: HostInfo) => HostAdapter> = {
  '0.2.1': adapterFor021,
  '0.2.2': adapterFor022,
  unknown: adapterForUnknown,
}

/** Pick the adapter for a resolved host. `host.channel` is already narrowed to
 *  the union by `adoptHostInfo`, so every channel here has a row by construction —
 *  a new channel in `HostChannel` fails to compile until it is added. */
export function buildAdapter(host: HostInfo): HostAdapter {
  return ADAPTERS[host.channel](host)
}
