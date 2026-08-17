import type { GeneratedBgParams, MeshGradientParams, ShaderParams, PatternParams } from '../types'

export const RENDER_W = 1920
export const RENDER_H = Math.round(RENDER_W * 9 / 16)
const RENDER_SIZE = RENDER_W

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

// ── Deterministic seeded RNG ─────────────────────────────────────────────────
// A simple xorshift-based PRNG so the same seed always produces the same
// background. Used by mesh gradients and geometric patterns.
function createRng(seed: number) {
  let s = seed > 0 ? seed : 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
}

// ── Mesh gradient ────────────────────────────────────────────────────────────
// Overlapping radial gradients placed on a jittered grid, with a subtle noise
// overlay for texture. Produces soft, organic wallpapers similar to macOS
// Sonoma screensavers.
export function renderMeshGradient(params: MeshGradientParams): string {
  const w = RENDER_SIZE
  const h = Math.round(RENDER_SIZE * 9 / 16)
  const c = createCanvas(w, h)
  const g = c.getContext('2d')!
  const rng = createRng(params.seed)
  const scale = params.scale
  const intensity = params.intensity

  // Base: very dark or very light depending on a deterministic value derived
  // from the seed. We keep the wallpaper itself relatively neutral so the
  // extracted palette does not fight with the UI.
  const dark = rng() < 0.5
  g.fillStyle = dark ? '#0b0c10' : '#f4f6f8'
  g.fillRect(0, 0, w, h)

  const count = Math.round(6 * scale)
  for (let i = 0; i < count; i++) {
    const cx = rng() * w
    const cy = rng() * h
    const r = (0.25 + rng() * 0.55) * Math.min(w, h) * scale
    const hue = Math.round(rng() * 360)
    const sat = Math.round(40 + rng() * 50 * intensity)
    const lit = dark ? Math.round(15 + rng() * 35 * intensity) : Math.round(65 + rng() * 25 * intensity)
    const rad = g.createRadialGradient(cx, cy, 0, cx, cy, r)
    const alpha = (0.25 + rng() * 0.35 * intensity).toFixed(2)
    rad.addColorStop(0, `hsla(${hue},${sat}%,${lit}%,${alpha})`)
    rad.addColorStop(1, 'hsla(0,0%,0%,0)')
    g.fillStyle = rad
    g.fillRect(0, 0, w, h)
  }

  // Soft noise grain overlay.
  addNoise(g, w, h, dark ? 12 : 8)
  return c.toDataURL('image/jpeg', 0.92)
}

function addNoise(g: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  const id = g.getImageData(0, 0, w, h)
  const d = id.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount
    d[i] = Math.max(0, Math.min(255, d[i]! + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1]! + n))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2]! + n))
  }
  g.putImageData(id, 0, 0)
}

// ── Shader backgrounds (static frame) ────────────────────────────────────────
// WebGL fragment shaders: aurora, nebula, noise. Each renders one frame at
// RENDER_SIZE. The `speed` parameter shifts the phase so different presets
// still look distinct even without animation.
export function renderShader(params: ShaderParams): string {
  const w = RENDER_SIZE
  const h = Math.round(RENDER_SIZE * 9 / 16)
  const c = createCanvas(w, h)
  const gl = c.getContext('webgl') || c.getContext('experimental-webgl') as WebGLRenderingContext | null
  if (!gl) return renderMeshGradient({ type: 'mesh', seed: params.speed * 1000, scale: params.scale, intensity: 0.6 })

  const vs = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `
  const fs = shaderFragment(params.preset)
  const program = createProgram(gl, vs, fs)
  if (!program) return renderMeshGradient({ type: 'mesh', seed: params.speed * 1000, scale: params.scale, intensity: 0.6 })

  const posLoc = gl.getAttribLocation(program, 'a_position')
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

  gl.useProgram(program)
  gl.viewport(0, 0, w, h)
  gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), w, h)
  gl.uniform1f(gl.getUniformLocation(program, 'u_time'), params.speed * 10)
  gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), params.scale)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  return c.toDataURL('image/jpeg', 0.95)
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

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
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
        float t = u_time * 0.1;
        float n1 = fbm(vec3(uv * 2.0 * u_scale, t));
        float n2 = fbm(vec3(uv * 3.0 * u_scale + 5.2, t * 1.3));
        float bands = smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(uv.y * 6.0 + n1 * 2.0));
        vec3 c1 = vec3(0.05, 0.12, 0.18);
        vec3 c2 = vec3(0.08, 0.35, 0.35);
        vec3 c3 = vec3(0.25, 0.65, 0.45);
        vec3 c4 = vec3(0.55, 0.25, 0.55);
        vec3 col = mix(c1, c2, bands);
        col = mix(col, c3, smoothstep(0.3, 0.7, n1));
        col = mix(col, c4, smoothstep(0.5, 0.9, n2) * 0.6);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  }
  if (preset === 'nebula') {
    return common + `
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float t = u_time * 0.08;
        float n = fbm(vec3(uv * 1.8 * u_scale, t));
        float n2 = fbm(vec3(uv * 4.0 * u_scale - 3.0, t * 0.7));
        vec3 c1 = vec3(0.04, 0.03, 0.12);
        vec3 c2 = vec3(0.15, 0.05, 0.25);
        vec3 c3 = vec3(0.35, 0.12, 0.35);
        vec3 c4 = vec3(0.12, 0.18, 0.45);
        vec3 col = mix(c1, c2, smoothstep(-0.4, 0.6, n));
        col = mix(col, c3, smoothstep(0.2, 0.8, n2) * 0.7);
        col = mix(col, c4, smoothstep(0.4, 0.9, n) * 0.5);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  }
  // noise
  return common + `
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float t = u_time * 0.05;
      float n = fbm(vec3(uv * 3.0 * u_scale, t));
      float n2 = fbm(vec3(uv * 8.0 * u_scale + 12.0, t * 1.5));
      vec3 c1 = vec3(0.08, 0.08, 0.10);
      vec3 c2 = vec3(0.18, 0.20, 0.24);
      vec3 c3 = vec3(0.32, 0.34, 0.38);
      vec3 col = mix(c1, c2, 0.5 + 0.5 * n);
      col = mix(col, c3, smoothstep(0.35, 0.85, n2) * 0.4);
      gl_FragColor = vec4(col, 1.0);
    }
  `
}

// ── Geometric patterns ───────────────────────────────────────────────────────
export function renderPattern(params: PatternParams): string {
  if (params.preset === 'waves') return renderWaves(params)
  if (params.preset === 'poly') return renderLowPoly(params)
  return renderDots(params)
}

function renderDots(params: PatternParams): string {
  const w = RENDER_SIZE
  const h = Math.round(RENDER_SIZE * 9 / 16)
  const c = createCanvas(w, h)
  const g = c.getContext('2d')!
  const rng = createRng(Math.round(params.density * 1000 + params.scale * 100))
  const dark = rng() < 0.5
  g.fillStyle = dark ? '#0a0b0d' : '#f6f7f9'
  g.fillRect(0, 0, w, h)
  const spacing = Math.max(20, 120 * params.scale / (0.3 + params.density))
  const baseR = spacing * 0.25
  for (let y = spacing / 2; y < h; y += spacing) {
    for (let x = spacing / 2; x < w; x += spacing) {
      const r = baseR * (0.4 + rng() * 0.8)
      const hue = Math.round(rng() * 360)
      const sat = Math.round(30 + rng() * 50)
      const lit = dark ? Math.round(35 + rng() * 35) : Math.round(55 + rng() * 30)
      g.beginPath()
      g.arc(x + (rng() - 0.5) * spacing * 0.3, y + (rng() - 0.5) * spacing * 0.3, r, 0, Math.PI * 2)
      g.fillStyle = `hsla(${hue},${sat}%,${lit}%,${(0.15 + rng() * 0.35).toFixed(2)})`
      g.fill()
    }
  }
  addNoise(g, w, h, dark ? 10 : 6)
  return c.toDataURL('image/jpeg', 0.94)
}

function renderWaves(params: PatternParams): string {
  const w = RENDER_SIZE
  const h = Math.round(RENDER_SIZE * 9 / 16)
  const c = createCanvas(w, h)
  const g = c.getContext('2d')!
  const rng = createRng(Math.round(params.density * 1000 + params.scale * 100))
  const dark = rng() < 0.5
  g.fillStyle = dark ? '#07080a' : '#f8f9fb'
  g.fillRect(0, 0, w, h)
  const hue = Math.round(rng() * 360)
  const layers = Math.round(4 + params.density * 6)
  for (let i = 0; i < layers; i++) {
    const yBase = h * (0.3 + (i / layers) * 0.6)
    const amp = 30 * params.scale + rng() * 40
    const freq = (0.003 + rng() * 0.006) / params.scale
    const phase = rng() * Math.PI * 2
    g.beginPath()
    g.moveTo(0, h)
    for (let x = 0; x <= w; x += 8) {
      const y = yBase + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase) * amp * 0.5
      g.lineTo(x, y)
    }
    g.lineTo(w, h)
    g.closePath()
    const sat = Math.round(40 + rng() * 40)
    const lit = dark ? Math.round(15 + (i / layers) * 30) : Math.round(70 - (i / layers) * 25)
    g.fillStyle = `hsla(${hue + i * 15},${sat}%,${lit}%,${(0.25 + rng() * 0.3).toFixed(2)})`
    g.fill()
  }
  addNoise(g, w, h, dark ? 10 : 6)
  return c.toDataURL('image/jpeg', 0.94)
}

function renderLowPoly(params: PatternParams): string {
  const w = RENDER_SIZE
  const h = Math.round(RENDER_SIZE * 9 / 16)
  const c = createCanvas(w, h)
  const g = c.getContext('2d')!
  const rng = createRng(Math.round(params.density * 1000 + params.scale * 100))
  const dark = rng() < 0.5
  g.fillStyle = dark ? '#08090c' : '#f5f6f8'
  g.fillRect(0, 0, w, h)
  const hue = Math.round(rng() * 360)
  const cols = Math.round(8 + params.density * 16)
  const rows = Math.round(cols * h / w)
  const points: { x: number; y: number }[][] = []
  for (let y = 0; y <= rows; y++) {
    const row: { x: number; y: number }[] = []
    for (let x = 0; x <= cols; x++) {
      row.push({
        x: (x / cols) * w + (rng() - 0.5) * (w / cols) * 0.7,
        y: (y / rows) * h + (rng() - 0.5) * (h / rows) * 0.7,
      })
    }
    points.push(row)
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p1 = points[y]![x]!, p2 = points[y]![x + 1]!, p3 = points[y + 1]![x]!
      const cx = (p1.x + p2.x + p3.x) / 3 / w
      const lit = dark ? Math.round(12 + cx * 35 + rng() * 15) : Math.round(85 - cx * 25 + rng() * 10)
      g.beginPath()
      g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y)
      g.closePath()
      g.fillStyle = `hsla(${hue + cx * 60},${Math.round(35 + rng() * 35)}%,${lit}%,0.9)`
      g.fill()
      const p4 = points[y + 1]![x + 1]!
      g.beginPath()
      g.moveTo(p2.x, p2.y); g.lineTo(p4.x, p4.y); g.lineTo(p3.x, p3.y)
      g.closePath()
      g.fillStyle = `hsla(${hue + cx * 60 + 10},${Math.round(35 + rng() * 35)}%,${Math.max(0, lit - 5)}%,0.9)`
      g.fill()
    }
  }
  addNoise(g, w, h, dark ? 8 : 5)
  return c.toDataURL('image/jpeg', 0.94)
}

/** Dispatch to the right generator based on params type. */
export function renderGeneratedBg(params: GeneratedBgParams): string {
  if (params.type === 'mesh') return renderMeshGradient(params)
  if (params.type === 'shader') return renderShader(params)
  return renderPattern(params)
}

/** Build default params for a newly selected background type. */
export function defaultParamsFor(type: Exclude<GeneratedBgParams['type'], 'image'>): GeneratedBgParams {
  if (type === 'mesh') return { type: 'mesh', seed: Math.floor(Math.random() * 100000), scale: 1, intensity: 0.6 }
  if (type === 'shader') return { type: 'shader', preset: 'aurora', speed: 0.3, scale: 1 }
  return { type: 'pattern', preset: 'dots', density: 0.5, scale: 1 }
}
