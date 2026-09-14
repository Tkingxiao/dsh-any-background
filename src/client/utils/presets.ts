import type { ProfileAppearance } from '../types'

/**
 * Built-in appearance presets. Each bundles the surface parameters a profile
 * stores (color, per-part opacities/blurs, tints) — never the wallpaper
 * itself, which stays machine-local. Applying a preset is identical to
 * applying a saved profile.
 */
export interface BuiltinPreset {
  key: string
  appearance: ProfileAppearance
}

const zeroBlurs = { bg: 0, sidebar: 0, card: 0, settings: 0, chat: 0, trajectory: 0, input: 0, panel: 0, produced: 0 }

export const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    key: 'default',
    appearance: {
      color: null,
      opacities: { bg: 0.85, sidebar: 0.93, card: 1, input: 1 },
      blurs: { ...zeroBlurs },
      settingsOpacity: 1,
      wallpaperOpacity: 1,
      blur: 0,
      chatTextOpacity: 0,
      trajectoryOpacity: 1,
      panelOpacity: 1,
      producedOpacity: 1,
    },
  },
  {
    // Frosted glass: translucent surfaces over a sharp wallpaper, blurred shell.
    key: 'glass',
    appearance: {
      color: [212, 0.5, 0.38],
      opacities: { bg: 0.62, sidebar: 0.55, card: 0.62, input: 0.58 },
      blurs: { ...zeroBlurs, bg: 20, sidebar: 14, card: 12, settings: 20, trajectory: 8, input: 14, panel: 12 },
      settingsOpacity: 0.88,
      wallpaperOpacity: 1,
      blur: 0,
      chatTextOpacity: 0,
      trajectoryOpacity: 0.85,
      panelOpacity: 0.85,
      producedOpacity: 1,
    },
  },
  {
    // Minimal: near-solid surfaces, no frost, system theme color.
    key: 'minimal',
    appearance: {
      color: null,
      opacities: { bg: 0.97, sidebar: 0.97, card: 1, input: 1 },
      blurs: { ...zeroBlurs },
      settingsOpacity: 1,
      wallpaperOpacity: 1,
      blur: 0,
      chatTextOpacity: 0,
      trajectoryOpacity: 1,
      panelOpacity: 1,
      producedOpacity: 1,
    },
  },
  {
    // Midnight: deep violet accent, dark scheme, heavy frost.
    key: 'midnight',
    appearance: {
      color: [262, 0.45, 0.16],
      opacities: { bg: 0.5, sidebar: 0.45, card: 0.55, input: 0.6 },
      blurs: { ...zeroBlurs, bg: 24, sidebar: 18, card: 14, settings: 22, trajectory: 10, input: 16, panel: 16 },
      settingsOpacity: 0.85,
      wallpaperOpacity: 0.92,
      blur: 2,
      chatTextOpacity: 0,
      trajectoryOpacity: 0.8,
      panelOpacity: 0.8,
      producedOpacity: 1,
    },
  },
  {
    // Cyber: vivid magenta accent over barely-there surfaces.
    key: 'cyber',
    appearance: {
      color: [315, 0.7, 0.22],
      opacities: { bg: 0.42, sidebar: 0.5, card: 0.45, input: 0.55 },
      blurs: { ...zeroBlurs, bg: 16, sidebar: 12, card: 10, settings: 18, trajectory: 6, input: 20, panel: 18 },
      settingsOpacity: 0.8,
      wallpaperOpacity: 1,
      blur: 0,
      chatTextOpacity: 0,
      trajectoryOpacity: 0.78,
      panelOpacity: 0.75,
      producedOpacity: 1,
    },
  },
  {
    // Warm daylight: amber accent, solid light surfaces.
    key: 'warm',
    appearance: {
      color: [28, 0.6, 0.72],
      opacities: { bg: 0.92, sidebar: 0.95, card: 1, input: 1 },
      blurs: { ...zeroBlurs },
      settingsOpacity: 1,
      wallpaperOpacity: 1,
      blur: 0,
      chatTextOpacity: 0,
      trajectoryOpacity: 1,
      panelOpacity: 1,
      producedOpacity: 1,
    },
  },
]
