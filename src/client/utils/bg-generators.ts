import type { GeneratedBgParams, MeshGradientParams, ShaderParams, PatternParams } from '../types'

// The live full-screen canvas renders at a fraction of the CSS size — it sits
// behind frosted/translucent UI anyway, so ~0.5–0.6px backing keeps it looking
// sharp while drastically cutting fill/gradient cost per frame.
const RENDER_SCALE = 0.55
const FPS = 30
const FRAME_MS = 1000 / FPS

function newRaf(canvas: HTMLCanvasElement, draw: () => void): { stop: () => void } {
  canvas.dataset.dshAnyCanvas = '1'
  let running = true
  let last = 0
  // Draw the very first frame synchronously so snapshot() right after creation
  // already yields a real frame (used by the preview, palette and export).
  draw()
  const loop = (ts: number) => {
    if (!running) return
    if (ts - last >= FRAME_MS) { last = ts; draw() }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  return { stop: () => { running = false } }
}

function createCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;'
  return c
}

function liveSize(): { w: number; h: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const w = Math.max(320, Math.ceil(window.innerWidth * dpr * RENDER_SCALE))
  const h = Math.max(180, Math.ceil(window.innerHeight * dpr * RENDER_SCALE))
  return { w, h }
}

function fitLiveCanvas(c: HTMLCanvasElement): void {
  if (c.dataset.dshAnyStatic === '1') return
  const { w, h } = liveSize()
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
}

// ── Deterministic seeded RNG ─────────────────────────────────────────────────
function createRng(seed: number) {
  let s = seed > 0 ? seed : 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
}

// ── Seeded 2D noise (for canvas mesh / pattern motion) ──────────────────────
function createNoise(seed: number) {
  const rng = createRng(seed)
  const perm: number[] = []
  for (let i = 0; i < 256; i++) perm[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = perm[i]!; perm[i] = perm[j]!; perm[j] = t
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i]!
  function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10) }
  function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
  function grad(hash: number, x: number, y: number) {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : (h === 12 || h === 14) ? x : 0
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }
  return (x: number, y: number) => {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = fade(x)
    const v = fade(y)
    const A = perm[X]! + Y
    return lerp(
      lerp(grad(perm[A]!, x, y), grad(perm[A! + 1]!, x - 1, y), u),
      lerp(grad(perm[A! + 256]!, x, y - 1), grad(perm[A! + 257]!, x - 1, y - 1), u),
      v,
    )
  }
}

// ── Mesh gradient (animated) ──────────────────────────────────────────────────
export function createMeshGradient(params: MeshGradientParams, canvas?: HTMLCanvasElement): { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } {
  const c = canvas ?? createCanvas()
  fitLiveCanvas(c)
  const g = c.getContext('2d', { alpha: false })!
  const rng = createRng(params.seed)
  const noise = createNoise(params.seed)
  const dark = rng() < 0.5
  const baseHue = Math.round(rng() * 360)
  const count = Math.round(7 + 9 * params.scale * params.intensity)
  const blobs: { x: number; y: number; r: number; hx: number; hy: number; speed: number; hue: number; sat: number; lit: number }[] = []
  for (let i = 0; i < count; i++) {
    blobs.push({
      x: rng(), y: rng(),
      r: (0.22 + rng() * 0.6) * params.scale,
      hx: rng() * 4 - 2, hy: rng() * 4 - 2,
      speed: 0.05 + rng() * 0.1,
      hue: (baseHue + (rng() < 0.5 ? 30 : 180) + rng() * 60) % 360,
      sat: Math.round(45 + rng() * 50 * params.intensity),
      lit: dark ? Math.round(18 + rng() * 35 * params.intensity) : Math.round(60 + rng() * 25 * params.intensity),
    })
  }
  let t = 0
  const alpha = (0.22 + 0.3 * params.intensity).toFixed(3)
  const innerAlpha = (+alpha * 0.35).toFixed(3)
  const draw = () => {
    fitLiveCanvas(c)
    const w = c.width, h = c.height
    g.fillStyle = dark ? '#0a0b0e' : '#f5f7fa'
    g.fillRect(0, 0, w, h)
    for (const b of blobs) {
      const phase = t * b.speed
      const cx = (((b.x + noise(b.hx + phase * 0.3, b.hy) * 0.25 + phase * 0.03) % 1 + 1) % 1) * w
      const cy = (((b.y + noise(b.hx, b.hy + phase * 0.3) * 0.25 + phase * 0.012) % 1 + 1) % 1) * h
      const r = b.r * Math.min(w, h) * (0.8 + 0.4 * Math.sin(phase + b.hx))
      const rad = g.createRadialGradient(cx, cy, 0, cx, cy, r)
      rad.addColorStop(0, `hsla(${b.hue},${b.sat}%,${b.lit}%,${alpha})`)
      rad.addColorStop(0.55, `hsla(${b.hue},${Math.round(b.sat * 0.6)}%,${b.lit}%,${innerAlpha})`)
      rad.addColorStop(1, 'hsla(0,0%,0%,0)')
      g.fillStyle = rad
      g.fillRect(0, 0, w, h)
    }
    t += 0.028
  }
  return { canvas: c, ...newRaf(c, draw), snapshot: () => c.toDataURL('image/jpeg', 0.92) }
}

// ── Shader backgrounds (animated WebGL) ───────────────────────────────────────
export function createShaderBg(params: ShaderParams, canvas?: HTMLCanvasElement): { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } {
  const c = canvas ?? createCanvas()
  fitLiveCanvas(c)
  const gl = c.getContext('webgl', { alpha: false }) || c.getContext('experimental-webgl', { alpha: false }) as WebGLRenderingContext | null
  if (!gl) return createMeshGradient({ type: 'mesh', seed: params.speed * 1000, scale: params.scale, intensity: 0.6 }, c)

  const vs = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `
  const program = createProgram(gl, vs, shaderFragment(params.preset))
  if (!program) return createMeshGradient({ type: 'mesh', seed: params.speed * 1000, scale: params.scale, intensity: 0.6 }, c)

  const posLoc = gl.getAttribLocation(program, 'a_position')
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
  gl.useProgram(program)
  const uRes = gl.getUniformLocation(program, 'u_resolution')
  const uTime = gl.getUniformLocation(program, 'u_time')
  const uScale = gl.getUniformLocation(program, 'u_scale')
  const uSeed = gl.getUniformLocation(program, 'u_seed')
  const seed01 = (params.seed >>> 0) / 0xffffffff
  let t = 0
  const draw = () => {
    fitLiveCanvas(c)
    gl.viewport(0, 0, c.width, c.height)
    gl.uniform2f(uRes, c.width, c.height)
    gl.uniform1f(uTime, t)
    gl.uniform1f(uScale, params.scale)
    gl.uniform1f(uSeed, seed01)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    t += 0.32 * params.speed
  }
  return { canvas: c, ...newRaf(c, draw), snapshot: () => c.toDataURL('image/jpeg', 0.95) }
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const v = gl.createShader(gl.VERTEX_SHADER)
  const f = gl.createShader(gl.FRAGMENT_SHADER)
  if (!v || !f) return null
  gl.shaderSource(v, vs); gl.compileShader(v)
  gl.shaderSource(f, fs); gl.compileShader(f)
  if (!gl.getShaderParameter(v, gl.COMPILE_STATUS) || !gl.getShaderParameter(f, gl.COMPILE_STATUS)) {
    gl.deleteShader(v); gl.deleteShader(f)
    return null
  }
  const p = gl.createProgram()
  if (!p) return null
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return null }
  return p
}

function shaderFragment(preset: ShaderParams['preset']): string {
  const common = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_scale;
    uniform float u_seed;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 hueRotate(vec3 rgb, float angle) {
      float c = cos(angle), s = sin(angle);
      mat3 m = mat3(
        0.299 + 0.701*c + 0.168*s, 0.587 - 0.587*c + 0.330*s, 0.114 - 0.114*c - 0.497*s,
        0.299 - 0.299*c - 0.328*s, 0.587 + 0.413*c + 0.035*s, 0.114 - 0.114*c + 0.292*s,
        0.299 - 0.300*c + 1.250*s, 0.587 - 0.588*c - 1.050*s, 0.114 + 0.886*c - 0.203*s
      );
      return rgb * m;
    }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    float fbm(vec3 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * snoise(p);
        p *= 2.0; a *= 0.5;
      }
      return v;
    }
  `
  if (preset === 'aurora') {
    return common + `
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float t = u_time;
        float n1 = fbm(vec3(uv * 2.5 * u_scale, t));
        float n2 = fbm(vec3(uv * 4.0 * u_scale + 7.0, t * 1.4));
        float n3 = fbm(vec3(uv * 1.2 * u_scale - 3.0, t * 0.7));
        float bands = smoothstep(0.15, 0.85, 0.5 + 0.5 * sin((uv.y + n3 * 0.08) * 8.0 + n1 * 1.5));
        vec3 c1 = vec3(0.03, 0.08, 0.14);
        vec3 c2 = vec3(0.05, 0.28, 0.32);
        vec3 c3 = vec3(0.18, 0.62, 0.42);
        vec3 c4 = vec3(0.55, 0.22, 0.52);
        vec3 c5 = vec3(0.85, 0.35, 0.25);
        vec3 col = mix(c1, c2, bands);
        col = mix(col, c3, smoothstep(0.25, 0.75, n1));
        col = mix(col, c4, smoothstep(0.45, 0.85, n2) * 0.75);
        col = mix(col, c5, smoothstep(0.7, 0.95, n2 + n1 * 0.3) * 0.45);
        col = hueRotate(col, u_seed * 6.28318530718);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  }
  if (preset === 'nebula') {
    return common + `
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float t = u_time * 0.8;
        float n = fbm(vec3(uv * 2.2 * u_scale, t));
        float n2 = fbm(vec3(uv * 5.0 * u_scale - 4.0, t * 0.65));
        float n3 = fbm(vec3(uv * 0.9 * u_scale + 2.0, t * 0.4));
        vec3 c1 = vec3(0.02, 0.02, 0.08);
        vec3 c2 = vec3(0.12, 0.04, 0.22);
        vec3 c3 = vec3(0.32, 0.10, 0.35);
        vec3 c4 = vec3(0.10, 0.18, 0.42);
        vec3 c5 = vec3(0.55, 0.30, 0.55);
        vec3 col = mix(c1, c2, smoothstep(-0.5, 0.6, n));
        col = mix(col, c3, smoothstep(0.15, 0.8, n2) * 0.75);
        col = mix(col, c4, smoothstep(0.35, 0.85, n + n3 * 0.3) * 0.55);
        col = mix(col, c5, smoothstep(0.6, 0.95, n2) * 0.35);
        col = hueRotate(col, u_seed * 6.28318530718);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  }
  // noise
  return common + `
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float t = u_time;
      float n = fbm(vec3(uv * 3.5 * u_scale, t));
      float n2 = fbm(vec3(uv * 9.0 * u_scale + 15.0, t * 1.6));
      float n3 = fbm(vec3(uv * 1.5 * u_scale - 5.0, t * 0.5));
      vec3 c1 = vec3(0.06, 0.06, 0.08);
      vec3 c2 = vec3(0.16, 0.18, 0.22);
      vec3 c3 = vec3(0.30, 0.32, 0.36);
      vec3 c4 = vec3(0.46, 0.48, 0.52);
      vec3 col = mix(c1, c2, 0.5 + 0.5 * n + n3 * 0.15);
      col = mix(col, c3, smoothstep(0.3, 0.8, n2) * 0.45);
      col = mix(col, c4, smoothstep(0.6, 0.95, n2) * 0.25);
      col = hueRotate(col, u_seed * 6.28318530718);
      gl_FragColor = vec4(col, 1.0);
    }
  `
}

// ── Geometric patterns (animated) ─────────────────────────────────────────────
export function createPatternBg(params: PatternParams, canvas?: HTMLCanvasElement): { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } {
  if (params.preset === 'waves') return createWaves(params, canvas)
  if (params.preset === 'poly') return createLowPoly(params, canvas)
  return createDots(params, canvas)
}

function createDots(params: PatternParams, canvas?: HTMLCanvasElement): { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } {
  const c = canvas ?? createCanvas()
  fitLiveCanvas(c)
  const g = c.getContext('2d', { alpha: false })!
  const rng = createRng(params.seed)
  const dark = rng() < 0.5
  const baseHue = Math.round(rng() * 360)
  const spacing = Math.max(26, 150 * params.scale / (0.25 + params.density))
  const dots: { cx: number; cy: number; r: number; hue: number; sat: number; lit: number; phase: number; speed: number }[] = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      dots.push({
        cx: x / 7, cy: y / 7,
        r: spacing * 0.16 * params.scale * (0.6 + rng() * 0.7),
        hue: (baseHue + rng() * 80) % 360,
        sat: Math.round(35 + rng() * 55),
        lit: dark ? Math.round(30 + rng() * 35) : Math.round(55 + rng() * 30),
        phase: rng() * Math.PI * 2,
        speed: 0.5 + rng() * 1.2,
      })
    }
  }
  let t = 0
  const draw = () => {
    fitLiveCanvas(c)
    const w = c.width, h = c.height
    g.fillStyle = dark ? '#0a0b0d' : '#f6f7f9'
    g.fillRect(0, 0, w, h)
    for (const d of dots) {
      const pulse = 0.75 + 0.35 * Math.sin(t * d.speed + d.phase)
      const r = Math.max(1, d.r * pulse)
      const x = d.cx * w + (d.r * 0.3) * Math.sin(t * d.speed * 0.5 + d.phase)
      const y = d.cy * h + (d.r * 0.3) * Math.cos(t * d.speed * 0.7 + d.phase)
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fillStyle = `hsla(${d.hue},${d.sat}%,${d.lit}%,${(0.18 + 0.25 * pulse).toFixed(2)})`
      g.fill()
    }
    t += 0.032
  }
  return { canvas: c, ...newRaf(c, draw), snapshot: () => c.toDataURL('image/jpeg', 0.94) }
}

function createWaves(params: PatternParams, canvas?: HTMLCanvasElement): { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } {
  const c = canvas ?? createCanvas()
  fitLiveCanvas(c)
  const g = c.getContext('2d', { alpha: false })!
  const rng = createRng(params.seed)
  const dark = rng() < 0.5
  const hue = Math.round(rng() * 360)
  const layers = Math.round(5 + params.density * 8)
  const waves: { yBase: number; amp: number; freq: number; phase: number; speed: number; hue: number; sat: number; lit: number; alpha: number }[] = []
  for (let i = 0; i < layers; i++) {
    waves.push({
      yBase: 0.25 + (i / layers) * 0.55,
      amp: (25 + rng() * 45) * params.scale,
      freq: (0.006 + rng() * 0.01) / params.scale,
      phase: rng() * Math.PI * 2,
      speed: (0.3 + rng() * 0.7) * (rng() < 0.5 ? 1 : -1),
      hue: (hue + i * 12) % 360,
      sat: Math.round(40 + rng() * 45),
      lit: dark ? Math.round(14 + (i / layers) * 32) : Math.round(72 - (i / layers) * 28),
      alpha: 0.22 + rng() * 0.32,
    })
  }
  let t = 0
  const draw = () => {
    fitLiveCanvas(c)
    const w = c.width, h = c.height
    g.fillStyle = dark ? '#07080a' : '#f8f9fb'
    g.fillRect(0, 0, w, h)
    for (const wave of waves) {
      g.beginPath()
      g.moveTo(0, h)
      for (let x = 0; x <= w; x += Math.max(6, Math.floor(w / 180))) {
        const y = h * wave.yBase
          + Math.sin(x * wave.freq + wave.phase + t * wave.speed) * wave.amp
          + Math.sin(x * wave.freq * 2.1 + wave.phase * 1.3 - t * wave.speed * 1.5) * wave.amp * 0.5
        g.lineTo(x, y)
      }
      g.lineTo(w, h)
      g.closePath()
      g.fillStyle = `hsla(${wave.hue},${wave.sat}%,${wave.lit}%,${wave.alpha.toFixed(2)})`
      g.fill()
    }
    t += 0.032
  }
  return { canvas: c, ...newRaf(c, draw), snapshot: () => c.toDataURL('image/jpeg', 0.94) }
}

function createLowPoly(params: PatternParams, canvas?: HTMLCanvasElement): { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } {
  const c = canvas ?? createCanvas()
  fitLiveCanvas(c)
  const g = c.getContext('2d', { alpha: false })!
  const rng = createRng(params.seed)
  const dark = rng() < 0.5
  const hue = Math.round(rng() * 360)
  const cols = Math.round(10 + params.density * 20)
  const rows = Math.max(6, Math.round(cols * 0.65))
  const points: { x: number; y: number; dx: number; dy: number; speed: number }[][] = []
  for (let y = 0; y <= rows; y++) {
    const row: { x: number; y: number; dx: number; dy: number; speed: number }[] = []
    for (let x = 0; x <= cols; x++) {
      row.push({
        x: x / cols, y: y / rows,
        dx: (rng() - 0.5) * 0.02, dy: (rng() - 0.5) * 0.02,
        speed: 0.3 + rng() * 0.5,
      })
    }
    points.push(row)
  }
  const cells: { y: number; x: number; hue: number; sat: number; lit: number; phase: number }[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({ y, x, hue: (hue + rng() * 60) % 360, sat: Math.round(35 + rng() * 40), lit: dark ? Math.round(12 + rng() * 35) : Math.round(65 - rng() * 10), phase: rng() * Math.PI * 2 })
    }
  }
  let t = 0
  const px: { x: number; y: number }[][] = points.map(row => row.map(() => ({ x: 0, y: 0 })))
  const draw = () => {
    fitLiveCanvas(c)
    const w = c.width, h = c.height
    g.fillStyle = dark ? '#08090c' : '#f5f6f8'
    g.fillRect(0, 0, w, h)
    for (let y = 0; y <= rows; y++) {
      const row = points[y]!
      const out = px[y]!
      for (let x = 0; x <= cols; x++) {
        const p = row[x]!
        out[x]!.x = (p.x + Math.sin(t * p.speed + p.dx * 100) * p.dx) * w
        out[x]!.y = (p.y + Math.cos(t * p.speed + p.dy * 100) * p.dy) * h
      }
    }
    for (const cell of cells) {
      const p1 = px[cell.y]![cell.x]!, p2 = px[cell.y]![cell.x + 1]!, p3 = px[cell.y + 1]![cell.x]!, p4 = px[cell.y + 1]![cell.x + 1]!
      const cx = (p1.x + p2.x + p3.x) / 3 / w
      const lit = Math.max(0, Math.min(100, cell.lit + Math.sin(t * 0.6 + cell.phase) * 6))
      g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y); g.closePath()
      g.fillStyle = `hsla(${cell.hue + cx * 40},${cell.sat}%,${lit}%,0.92)`
      g.fill()
      g.beginPath(); g.moveTo(p2.x, p2.y); g.lineTo(p4.x, p4.y); g.lineTo(p3.x, p3.y); g.closePath()
      g.fillStyle = `hsla(${(cell.hue + cx * 40 + 12) % 360},${cell.sat}%,${Math.max(0, lit - 4)}%,0.92)`
      g.fill()
    }
    t += 0.03
  }
  return { canvas: c, ...newRaf(c, draw), snapshot: () => c.toDataURL('image/jpeg', 0.94) }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export function createDynamicBackground(params: GeneratedBgParams, canvas?: HTMLCanvasElement): { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } {
  if (params.type === 'mesh') return createMeshGradient(params, canvas)
  if (params.type === 'shader') return createShaderBg(params, canvas)
  return createPatternBg(params, canvas)
}

function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}

/** Build default params for a newly selected background type. */
export function defaultParamsFor(type: Exclude<GeneratedBgParams['type'], 'image'>): GeneratedBgParams {
  if (type === 'mesh') return { type: 'mesh', seed: randomSeed(), scale: 1.1, intensity: 0.65 }
  if (type === 'shader') return { type: 'shader', preset: 'aurora', speed: 0.35, scale: 1, seed: randomSeed() }
  return { type: 'pattern', preset: 'dots', density: 0.5, scale: 1, seed: randomSeed() }
}

// ── Static snapshot helpers ───────────────────────────────────────────────────
const STATIC_W = 1280
const STATIC_H = Math.round(STATIC_W * 9 / 16)

function createStaticCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = STATIC_W; c.height = STATIC_H
  c.dataset.dshAnyStatic = '1'
  return c
}

export function renderMeshGradient(params: MeshGradientParams): string {
  const { stop, snapshot } = createMeshGradient(params, createStaticCanvas())
  stop()
  return snapshot()
}

export function renderShader(params: ShaderParams): string {
  const { stop, snapshot } = createShaderBg(params, createStaticCanvas())
  stop()
  return snapshot()
}

export function renderPattern(params: PatternParams): string {
  const { stop, snapshot } = createPatternBg(params, createStaticCanvas())
  stop()
  return snapshot()
}

export function renderGeneratedBg(params: GeneratedBgParams): string {
  if (params.type === 'mesh') return renderMeshGradient(params)
  if (params.type === 'shader') return renderShader(params)
  return renderPattern(params)
}
