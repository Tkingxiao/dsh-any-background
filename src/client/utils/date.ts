/**
 * Formatting helpers that must be unit-testable without a browser.
 *
 * Kept out of the page component so `scripts/state-check.mjs` can import the
 * real function under Node's type stripping instead of asserting on a copy.
 */

/** Saved-at stamp for a profile row.
 *
 *  The list used to print `toLocaleDateString()` (date only), so two saves on
 *  the same day were indistinguishable — issue #42 ② asked for hours, minutes
 *  and seconds. An unparseable stamp renders empty rather than "Invalid Date". */
export function profileStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}
