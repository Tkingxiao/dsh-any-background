/**
 * Harness-version-agnostic access to the client runtime.
 *
 * Before dsh 0.1.2 the store primitive lived on the composite package
 * `@deepseek-ai/dsh-client-runtime` (the `/client` subpath). The new harness
 * split it into `@deepseek-ai/dsh-client-store`. Both specifiers are kept
 * external so they resolve against the host client-module table; a missing
 * table entry on one side throws (the "missed the module table" error) and is
 * caught, falling through to the other package. This lets one bundle load on
 * both the old npm release and the new source.
 *
 * The host's synchronous `require` is injected by the loader into the bundle
 * factory; tsdown keeps these two bare specifiers as external CJS requires so
 * they bind to that factory `require`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface StoreModule {
  defineStore: any
}

function resolveStore(): StoreModule | null {
  try {
    // New harness (dsh >= 0.1.2): dedicated store package after the runtime
    // was split. Missing here means the loader table has no such row → throw.
    return require('@deepseek-ai/dsh-client-store') as StoreModule
  } catch {
    /* fall through to the legacy composite runtime below */
  }
  try {
    // Legacy harness (npm release): composite runtime, /client subpath.
    return require('@deepseek-ai/dsh-client-runtime/client') as StoreModule
  } catch {
    // Neither resolved (host variant with no store module at all). This MUST
    // not throw at import time: this module is evaluated while the client
    // bundle boots, so a throw here kills the whole plugin — no theme, no
    // wallpaper, nothing. Callers degrade to "no settings panel" instead.
    console.warn('dsh-any-background: no client store module resolved on this host; the settings panel will be disabled')
    return null
  }
}

/** null when neither store package resolves on this host (see resolveStore). */
export const defineStore: any = resolveStore()?.defineStore ?? null