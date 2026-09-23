/**
 * The plugin's ONE vocabulary for host-dependent decisions.
 *
 * Everything downstream asks a QUESTION ("who owns the guide surface?", "which CSS
 * arm applies?") and gets an answer from the current adapter. No consumer names a
 * release. That is what keeps the per-version folders honest: when 0.1.8 needs a
 * new behaviour, a consumer changes by reading a new adapter field, not by growing
 * another version comparison.
 *
 * @module
 */
import { adapterResolved, rHostAdapter } from './release'
import type { HostAdapter } from './versions/types'

/** Who should carry the plugin's appearance page on the host's guide surface.
 *
 * `host`    — the host's own right Sidebar already presents an appearance page, so
 *             the plugin's dsh-better-sidebar page stands down (a second identical
 *             card on the same surface).
 * `plugin`  — it does not, so the dsh-better-sidebar page registers and the native
 *             tab yields to it.
 * `pending` — the verdict has not landed yet (it is a Node round-trip). Callers
 *             must NOT treat this as `plugin`: register provisionally and arm a
 *             withdrawal, because a brief duplicate is recoverable while a missing
 *             page is invisible until someone looks. */
export type GuideOwner = 'host' | 'plugin' | 'pending'

export function sidebarGuideOwner(): GuideOwner {
  if (!adapterResolved()) return 'pending'
  return rHostAdapter().surface.ownsSidebarGuideSurface ? 'host' : 'plugin'
}

/** The `[data-slot="<key>"]` selectors marking the session header's surfaces.
 *  Built from the adapter so a release that adds or deletes an anchor needs no
 *  change here — see the `headerSlotKeys` notes in each version folder. */
export function headerSlotSelectors(): string[] {
  return rHostAdapter().surface.headerSlotKeys.map(key => `[data-slot="${key}"]`)
}

/** The current adapter, for callers that need more than one field from it (and to
 *  keep the snapshot identity stable across a single render pass). */
export function hostAdapter(): HostAdapter {
  return rHostAdapter()
}
