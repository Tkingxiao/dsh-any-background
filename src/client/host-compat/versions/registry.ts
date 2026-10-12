/**
 * The registry: release channel → the adapter folder that speaks for it.
 *
 * The ONLY place in the plugin that maps a release onto code. Adding a new DSH
 * line is a three-step change with no existing file to touch:
 *   1. `KnownChannel` (and `channelOf`) in `src/host-compat/channel.ts`,
 *   2. a folder here, mirroring the others, NAMED FOR THE EXACT TAGS ITS FACTS
 *      WERE CHECKED AGAINST (`v0-2-0-rc-1`, `v0-2-1-alpha-1-2`) so the precision
 *      of the table is readable from the tree, and the folder states inside it
 *      which prerelease gates it carries,
 *   3. the row below.
 * A newer build that turns out to need NO change does not get its own folder: it
 * joins the name of the folder whose facts held (`v0-2-1-alpha-1-2`, checked at
 * both) and gains a `SUPPORTED_RELEASES` row, which is what moves that host's
 * verdict from `line` to `exact`.
 * Anything that reads an adapter then picks it up without an edit — which is the
 * point: version branching must not be reachable from the styling code.
 *
 * The folder is keyed by what its FACTS cover, not by the version number's shape:
 * `v0-2-0-rc-2` sits beside `v0-2-0-rc-1` on a line that does not even differ in
 * prerelease name, because that rc renamed the token a sticky menu group heading
 * paints from. When the split is that fine-grained the channel key takes the build
 * that opened the new facts (`0.2.0-rc.2`), and `classifyRelease` routes everything
 * above it there — a folder named for a line is only honest while the line agrees.
 *
 * THE TABLE STARTS AT `0.2.0-rc.1`. The 0.1.5 / 0.1.6 / 0.1.7 folders were removed:
 * the line moved on and nothing in the plugin still asserts a 0.1.x fact, so a
 * table that reaches back there is a table nobody verifies any more. A 0.1.x host
 * is not unsupported in the sense of crashing — `classifyRelease` clamps it to the
 * oldest row and reports `nearest`, and `detect.ts` logs that verdict, so an old
 * host gets the 0.2.0-rc.1 styling with the mismatch stated out loud rather than a
 * silent guess.
 *
 * @module
 */
import type { HostAdapter, HostChannel, HostInfo } from './types'
import { createAdapter as adapterFor020rc } from './v0-2-0-rc-1/adapter'
import { createAdapter as adapterFor020rc2 } from './v0-2-0-rc-2/adapter'
import { createAdapter as adapterFor021alpha } from './v0-2-1-alpha-1-2/adapter'
import { createAdapter as adapterForUnknown } from './unknown/adapter'

const ADAPTERS: Record<HostChannel, (host: HostInfo) => HostAdapter> = {
  '0.2.0-rc': adapterFor020rc,
  '0.2.0-rc.2': adapterFor020rc2,
  '0.2.1-alpha': adapterFor021alpha,
  unknown: adapterForUnknown,
}

/** Pick the adapter for a resolved host. `host.channel` is already narrowed to
 *  the union by `adoptHostInfo`, so every channel here has a row by construction —
 *  a new channel in `HostChannel` fails to compile until it is added. */
export function buildAdapter(host: HostInfo): HostAdapter {
  return ADAPTERS[host.channel](host)
}
