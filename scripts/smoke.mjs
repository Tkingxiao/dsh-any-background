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
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
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

  // 5. The sanitizer must not call any of these keys unknown — that warning is
  //    exactly what the bug report captured.
  const drift = warnings.filter(w => w.includes('ignoring unknown config field'))
  assert.deepEqual(drift, [], `unexpected config drift warnings: ${drift.join(' | ')}`)

  originalWarn('smoke: PASS — headerBar + captionInk settings and profiles round-trip through disk')
} finally {
  console.warn = originalWarn
  await new Promise(resolve => server.close(resolve))
  rmSync(home, { recursive: true, force: true })
}
