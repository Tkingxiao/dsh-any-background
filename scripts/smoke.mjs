/**
 * Persistence smoke test — the config round trip that issues #28/#29 broke.
 *
 * Boots the BUILT host half (`lib/index.js`) against a fake host context and a
 * real HTTP server on two ephemeral ports, using a throwaway `$DSH_HOME`, then
 * drives the plugin's own RPC channel exactly the way the browser half does:
 *
 *   writeConfig -> theme-config.json on disk -> read -> same values back
 *
 * It exists because the config shape is declared in two halves and a key that
 * only one half knows is silently dropped by the server's sanitizer: the slider
 * moves, the write succeeds, and the value reverts on the next load (v0.2.8,
 * v0.2.9, and the「标题栏」 keys in 0.3.7). Run with `npm test`.
 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const home = mkdtempSync(join(tmpdir(), 'dab-smoke-'))
process.env.DSH_HOME = home
const RPC_PATH = '/dsh-any-background'
// The browser half calls `ctx.connection.rpc.call('/dsh-any-background',
// 'dshAnyBackground/<method>', payload)`, which the host transport turns into
// POST <channel>/<endpoint> with the endpoint repeated as the envelope method.
const NS = 'dshAnyBackground'

const warnings = []
const originalWarn = console.warn
console.warn = (...args) => { warnings.push(args.join(' ')) }

const routes = new Map()
const ctx = {
  profileContext: {},
  inject: (_deps, cb) => cb({
    effect: (fn) => { fn() },
    connection: { requestRejection: () => undefined },
    webServer: {
      register: (route) => {
        routes.set(route.path, route)
        return () => routes.delete(route.path)
      },
    },
  }),
}

const plugin = await import('../lib/index.js')
plugin.apply(ctx)

// The plugin registers `/dsh-any-background` as a prefix and serves its own
// envelope protocol; a plain HTTP relay is all the test needs.
const prefix = routes.get(RPC_PATH)
assert.ok(prefix !== undefined, 'plugin did not register its RPC prefix')

const server = createServer((req, res) => {
  void prefix.handler(req, res)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()

async function rpc(method, payload) {
  const endpoint = `${NS}/${method}`
  const res = await fetch(`http://127.0.0.1:${port}${RPC_PATH}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'smoke', method: endpoint, payload }),
  })
  const body = await res.json()
  assert.equal(body.type, 'server-response', `${method}: envelope type`)
  assert.equal(body.result.ok, true, `${method}: ${JSON.stringify(body.result.error)}`)
  return body.result.value
}

const configFile = join(home, '.dsh-any-background-data', 'theme-config.json')
const onDisk = () => JSON.parse(readFileSync(configFile, 'utf8'))

try {
  // 1. A fresh home materializes defaults, including the「标题栏」keys.
  const first = await rpc('read', {})
  assert.equal(first.firstRun, true, 'first read should report firstRun')
  assert.equal(first.config.blurs.headerBar, 30, 'default blurs.headerBar')
  assert.equal(first.config.headerBarOpacity, 0.5, 'default headerBarOpacity')
  assert.equal(first.config.strokes.headerBar.width, 0, 'default strokes.headerBar')
  assert.equal(first.config.captionInk, 'auto', 'default captionInk')

  // 2. Values written through the RPC survive the sanitizer, on disk and on read.
  await rpc('writeConfig', {
    config: {
      blurs: { headerBar: 42, header: 44 },
      headerBarOpacity: 0.77,
      headerOpacity: 0.33,
      captionInk: 'theme',
      strokes: { headerBar: { width: 2, color: 'theme', customColor: '#123456' } },
      profiles: [{
        id: 'smoke-profile',
        name: 'Smoke',
        createdAt: '2026-01-01T00:00:00.000Z',
        config: {
          blurs: { headerBar: 33, header: 22 },
          headerBarOpacity: 0.9,
          headerOpacity: 0.2,
          strokes: { headerBar: { width: 1, color: 'gray', customColor: '#808080' } },
        },
      }],
    },
  })

  const disk = onDisk()
  assert.equal(disk.blurs.headerBar, 42, 'disk: blurs.headerBar')
  assert.equal(disk.headerBarOpacity, 0.77, 'disk: headerBarOpacity')
  assert.equal(disk.strokes.headerBar.width, 2, 'disk: strokes.headerBar.width')
  assert.equal(disk.strokes.headerBar.color, 'theme', 'disk: strokes.headerBar.color')
  assert.equal(disk.blurs.header, 44, 'disk: existing blurs.header untouched')
  assert.equal(disk.headerOpacity, 0.33, 'disk: existing headerOpacity untouched')
  assert.equal(disk.captionInk, 'theme', 'disk: captionInk')
  assert.equal(disk.profiles.length, 1, 'disk: profile kept')
  assert.equal(disk.profiles[0].config.blurs.headerBar, 33, 'disk: profile blurs.headerBar')
  assert.equal(disk.profiles[0].config.blurs.header, 22, 'disk: profile blurs.header')
  assert.equal(disk.profiles[0].config.headerBarOpacity, 0.9, 'disk: profile headerBarOpacity')
  assert.equal(disk.profiles[0].config.strokes.headerBar.width, 1, 'disk: profile strokes.headerBar')

  // 3. A reload reads the same values back (the reported symptom was a reversion
  //    to defaults here).
  const reloaded = await rpc('read', {})
  assert.equal(reloaded.firstRun, false, 'second read is not a first run')
  assert.equal(reloaded.config.blurs.headerBar, 42, 'read: blurs.headerBar')
  assert.equal(reloaded.config.headerBarOpacity, 0.77, 'read: headerBarOpacity')
  assert.equal(reloaded.config.strokes.headerBar.width, 2, 'read: strokes.headerBar.width')
  assert.equal(reloaded.config.profiles[0].config.blurs.headerBar, 33, 'read: profile headerBar')
  assert.equal(reloaded.config.captionInk, 'theme', 'read: captionInk')

  // 4. A value the host half does not know collapses to the default rather than
  //    reaching the browser half, where `rCaptionInk` would have to guess again.
  await rpc('writeConfig', { config: { captionInk: 'hot-pink' } })
  assert.equal(onDisk().captionInk, 'auto', 'disk: an unknown captionInk falls back to auto')

  // 5. The rotation pool: same-millisecond adds get distinct file names, a
  //    manual activation persists the cursor server-side, and a remove keeps
  //    the cursor in range.
  const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const add1 = await rpc('rotationAdd', { dataUrl: PNG_1PX, thumb: PNG_1PX })
  assert.equal(add1.items.length, 1, 'rotationAdd: one item after the first add')
  const add2 = await rpc('rotationAdd', { dataUrl: PNG_1PX, thumb: PNG_1PX })
  assert.equal(add2.items.length, 2, 'rotationAdd: two items after the second add')
  assert.notEqual(add2.items[0].file, add2.items[1].file, 'rotationAdd: same-ms adds must not collide on one file name')
  assert.match(add2.items[1].file, /^wp-[\w-]+\.png$/i, 'rotationAdd: server-generated name shape')

  const activated = await rpc('rotationSet', { index: 1 })
  assert.equal(activated.wallpaperUrl, '/dsh-any-background/wallpaper', 'rotationSet: serve URL returned')
  assert.equal(onDisk().rotation.current, 1, 'rotationSet: cursor persisted server-side')

  const removed = await rpc('rotationRemove', { index: 0 })
  assert.equal(removed.items.length, 1, 'rotationRemove: one item left')
  assert.ok(onDisk().rotation.current <= removed.items.length - 1, 'rotationRemove: cursor stays in range')

  // 5b. Server-side advance inside `read`: a due pool advances the cursor and
  //     persists the new state — the shared cadence math (src/shared/rotation.ts)
  //     exercised end-to-end through the real handler.
  const extra = await rpc('rotationAdd', { dataUrl: PNG_1PX, thumb: PNG_1PX })
  assert.equal(extra.items.length, 2, 'rotationAdd: pool re-filled to two items')
  await rpc('writeConfig', { config: { rotation: { enabled: true, mode: 'order', interval: 'daily', current: 0, items: extra.items, lastRotate: '2020-01-01T00:00:00.000Z' } } })
  const advanced = await rpc('read', {})
  assert.equal(advanced.rotated, true, 'read: a due rotation reports rotated')
  assert.equal(onDisk().rotation.current, 1, 'read: advanced cursor persisted')
  assert.notEqual(onDisk().rotation.lastRotate, '2020-01-01T00:00:00.000Z', 'read: lastRotate refreshed')
  // And the steady state: a lastRotate from today must not advance again.
  await rpc('writeConfig', { config: { rotation: { ...onDisk().rotation, lastRotate: new Date().toISOString() } } })
  const steady = await rpc('read', {})
  assert.equal(steady.rotated, false, 'read: a fresh lastRotate is not due again')

  // 5c. The 'hourly' cadence survives the sanitizer; an unknown interval still
  //     collapses to 'daily'.
  await rpc('writeConfig', { config: { rotation: { enabled: true, mode: 'order', interval: 'hourly', current: 0, items: [], lastRotate: null } } })
  assert.equal(onDisk().rotation.interval, 'hourly', 'writeConfig: hourly interval persists')
  await rpc('writeConfig', { config: { rotation: { enabled: true, mode: 'order', interval: 'minute', current: 0, items: [], lastRotate: null } } })
  assert.equal(onDisk().rotation.interval, 'daily', 'writeConfig: unknown interval falls back to daily')

  // 5d. rotationRestore rebuilds the pool wholesale: bytes land under the
  //     exported names, the config list matches, and activation works.
  const restored = await rpc('rotationRestore', { items: [{ file: 'wp-export-test.png', thumb: '', dataUrl: PNG_1PX }] })
  assert.equal(restored.ok, true, 'rotationRestore: ok')
  assert.equal(restored.items.length, 1, 'rotationRestore: item list rebuilt')
  assert.ok(existsSync(join(home, '.dsh-any-background-data', 'rotation', 'wp-export-test.png')), 'rotationRestore: file written under the exported name')
  assert.equal(onDisk().rotation.items[0].file, 'wp-export-test.png', 'rotationRestore: config points at the restored file')
  const activatedRestored = await rpc('rotationSet', { index: 0 })
  assert.equal(activatedRestored.wallpaperUrl, '/dsh-any-background/wallpaper', 'rotationSet: a restored item activates')

  // And the name fence: a traversal-shaped name is refused at the handler
  // (the outer envelope is still ok:true — the refusal rides in value.ok).
  const badRestore = await fetch(`http://127.0.0.1:${port}${RPC_PATH}/${NS}/rotationRestore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'smoke', method: `${NS}/rotationRestore`, payload: { items: [{ file: '../evil.png', thumb: '', dataUrl: PNG_1PX }] } }),
  })
  const badBody = await badRestore.json()
  assert.equal(badBody.result.value.ok, false, 'rotationRestore: path traversal refused')

  // 6. The wallpaper upload route refuses a body whose bytes are not an image
  //    even when the Content-Type claims one (the same fence as the URL
  //    download), and accepts real PNG bytes.
  const uploadRoute = routes.get('/dsh-any-background/wallpaper/upload')
  assert.ok(uploadRoute !== undefined, 'wallpaper upload route registered')
  const uploadServer = createServer((req, res) => { void uploadRoute.handler(req, res) })
  await new Promise(resolve => uploadServer.listen(0, '127.0.0.1', resolve))
  try {
    const uploadBase = `http://127.0.0.1:${uploadServer.address().port}/dsh-any-background/wallpaper/upload`
    const bad = await fetch(uploadBase, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: Buffer.from('this is definitely not an image'),
    })
    assert.equal(bad.status, 415, 'wallpaper upload: non-image bytes refused with 415')
    const good = await fetch(uploadBase, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: Buffer.from(PNG_1PX.slice('data:image/png;base64,'.length), 'base64'),
    })
    assert.equal(good.status, 200, 'wallpaper upload: real PNG bytes accepted')
  } finally {
    await new Promise(resolve => uploadServer.close(resolve))
  }

  // 7. The sanitizer must not call any of these keys unknown — that warning is
  //    exactly what the bug report captured.
  const drift = warnings.filter(w => w.includes('ignoring unknown config field'))
  assert.deepEqual(drift, [], `unexpected config drift warnings: ${drift.join(' | ')}`)

  originalWarn('smoke: PASS — settings, profiles, rotation pool, and the upload fence round-trip through disk')
} finally {
  console.warn = originalWarn
  await new Promise(resolve => server.close(resolve))
  rmSync(home, { recursive: true, force: true })
}
