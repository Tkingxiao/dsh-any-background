/**
 * The registry: release channel → the adapter folder that speaks for it.
 *
 * The ONLY place in the plugin that maps a release onto code. Adding a new DSH
 * line is a three-step change with no existing file to touch:
 *   1. `KnownChannel` (and `channelOf`) in `src/host-compat/channel.ts`,
 *   2. a folder here, mirroring the others, NAMED FOR THE EXACT TAGS ITS FACTS
 *      WERE CHECKED AGAINST (`v0-1-6-alpha-1-2`, not `v0-1-6-alpha`) so the
 *      precision of the table is readable from the tree, and the folder states
 *      inside it which prerelease gates it carries,
 *   3. the row below.
 * A newer build that turns out to need NO change does not get its own folder: it
 * joins the name of the folder whose facts held (`v0-1-7-alpha-1-2-rc-1`, checked
 * at rc.1) and gains a `SUPPORTED_RELEASES` row, which is what moves that host's
 * verdict from `line` to `exact`.
 * Anything that reads an adapter then picks it up without a edit — which is the
 * point: version branching must not be reachable from the styling code.
 *
 * @module
 */
import type { HostAdapter, HostChannel, HostInfo } from './types'
import { createAdapter as adapterFor015rc } from './v0-1-5-rc-2-3/adapter'
import { createAdapter as adapterFor016alpha } from './v0-1-6-alpha-1-2/adapter'
import { createAdapter as adapterFor017alpha } from './v0-1-7-alpha-1-2-rc-1/adapter'
import { createAdapter as adapterForUnknown } from './unknown/adapter'

const ADAPTERS: Record<HostChannel, (host: HostInfo) => HostAdapter> = {
  '0.1.5-rc': adapterFor015rc,
  '0.1.6-alpha': adapterFor016alpha,
  '0.1.7-alpha': adapterFor017alpha,
  unknown: adapterForUnknown,
}

/** Pick the adapter for a resolved host. `host.channel` is already narrowed to
 *  the union by `adoptHostInfo`, so every channel here has a row by construction —
 *  a new channel in `HostChannel` fails to compile until it is added. */
export function buildAdapter(host: HostInfo): HostAdapter {
  return ADAPTERS[host.channel](host)
}
