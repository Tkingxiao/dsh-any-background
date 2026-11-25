/**
 * Pure-state checks for the client half (issue #42).
 *
 * These two units are exactly the places the persistence bugs live, and neither
 * needs a DOM:
 *   · `adoptBgStateFor` / `rememberBgState` / `seedBgStateFor` — the per-picture
 *     framing map (content key → frame). The smoke test proves the CONFIG
 *     round-trip; this proves the runtime decision "A → B → A restores A".
 *   · `profileStamp` — the saved-at label, which must carry seconds.
 *
 * Imported from the real TypeScript sources (Node 24 type stripping), so a copy
 * of the logic cannot drift from the shipped one.
 */
import assert from 'node:assert/strict'
import {
  cfg, adoptBgStateFor, seedBgStateFor, rememberBgState, adoptConfig,
} from '../src/client/state.ts'
import { profileStamp } from '../src/client/utils/date.ts'

const A = 'aaaaaaaaaaaaaaaa'
const B = 'bbbbbbbbbbbbbbbb'

// ── Per-picture framing ──────────────────────────────────────────────────────

// No key (removal / host half without the field): default frame, matching the
// pre-0.6 behaviour of every wallpaper swap.
adoptBgStateFor(null)
assert.equal(cfg.bgState.iw, 0, 'null key resets to the default frame')

// Frame A, switch to unframed B, come back to A.
adoptBgStateFor(A)
rememberBgState({ zoom: 2, x: 0.25, y: 0.75, iw: 1600, ih: 900 })
assert.equal(cfg.bgStates[A]?.zoom, 2, 'A frame is remembered')
adoptBgStateFor(B)
assert.equal(cfg.bgState.iw, 0, 'B starts unframed instead of inheriting A')
adoptBgStateFor(A)
assert.deepEqual(cfg.bgState, { zoom: 2, x: 0.25, y: 0.75, iw: 1600, ih: 900 }, 'A frame is restored on switch back')

// Upgrade path: seed only when the picture has no entry yet, and only from a
// frame that describes a real picture (not the default).
seedBgStateFor('cccccccccccccccc')
assert.equal(cfg.bgStates['cccccccccccccccc']?.zoom, 2, 'seed adopts the legacy single frame')
seedBgStateFor('cccccccccccccccc')
assert.equal(Object.keys(cfg.bgStates).length, 2, 'seed is idempotent')
adoptBgStateFor('cccccccccccccccc')
assert.equal(cfg.bgState.zoom, 2, 'seeded entry resolves through adopt')

// Sanitizer: hex keys only, object values only, framed pictures only.
adoptConfig({ bgStates: {
  '0123456789abcdef': { zoom: 1.5, x: 0, y: 0, iw: 800, ih: 600 },
  'not-a-hash': { zoom: 2, x: 0, y: 0, iw: 10, ih: 10 },
  'fedcba9876543210': { zoom: 2, x: 0, y: 0, iw: 0, ih: 0 },
} })
assert.deepEqual(Object.keys(cfg.bgStates), ['0123456789abcdef'], 'sanitizer keeps only valid framed entries')
assert.equal(cfg.bgStates['0123456789abcdef']?.zoom, 1.5, 'valid entry survives normalization')

// Without a key the editor commit still renders, but must not invent an entry.
adoptBgStateFor(null)
rememberBgState({ zoom: 3, x: 0, y: 0, iw: 100, ih: 100 })
assert.equal(cfg.bgState.zoom, 3, 'frameless commit still updates the display frame')
assert.equal(Object.keys(cfg.bgStates).length, 1, 'frameless commit does not write an unreachable entry')

// A wholesale config swap — importing a theme file — replaces both the map and
// the bytes on screen. The key bound before the swap then names a picture that is
// gone, so a commit must not be filed under it (that would hand the imported
// picture's frame to the pre-import one the next time it comes up).
adoptBgStateFor(A)
rememberBgState({ zoom: 4, x: 0, y: 0, iw: 1600, ih: 900 })
assert.equal(cfg.bgStates[A]?.zoom, 4, 'A is framed and bound before the swap')
adoptConfig({
  bgState: { zoom: 1.25, x: 0, y: 0, iw: 640, ih: 480 },
  bgStates: { [B]: { zoom: 1.25, x: 0, y: 0, iw: 640, ih: 480 } },
})
rememberBgState({ zoom: 5, x: 0, y: 0, iw: 640, ih: 480 })
assert.equal(cfg.bgStates[A], undefined, 'a config swap unbinds the stale key')
assert.deepEqual(cfg.bgState, { zoom: 5, x: 0, y: 0, iw: 640, ih: 480 }, 'the post-swap edit still renders')
assert.equal(cfg.bgStates[B]?.zoom, 1.25, 'the imported entry is left alone')

// The host rebinds on the next picture change, so memory resumes after a swap.
adoptBgStateFor(B)
assert.deepEqual(cfg.bgState, { zoom: 1.25, x: 0, y: 0, iw: 640, ih: 480 }, 'the imported picture resolves its own frame')
rememberBgState({ zoom: 6, x: 0, y: 0, iw: 640, ih: 480 })
assert.equal(cfg.bgStates[B]?.zoom, 6, 'framing is remembered again once rebound')

// ── Saved-at stamp ───────────────────────────────────────────────────────────

const stamp = profileStamp('2026-01-02T03:04:05.000Z')
assert.match(stamp, /\d{2}:\d{2}:\d{2}/, 'profile stamp carries hours, minutes and seconds')
assert.match(stamp, /2026/, 'profile stamp carries the year')
assert.doesNotMatch(stamp, /AM|PM/i, 'profile stamp is 24-hour')
assert.equal(profileStamp('not-a-date'), '', 'unparseable stamp renders empty')

console.log('state-check: PASS (per-picture framing + profile stamp)')