/**
 * Color Utility Functions
 * Provides color manipulation functions for theme system.
 */

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r = r / 255
  g = g / 255
  b = b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6
    } else {
      h = ((r - g) / d + 4) / 6
    }
  }
  return [h * 360, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360
  s = s / 100
  l = l / 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return [r * 255, g * 255, b * 255]
}

function parseColor(color: string): string {
  if (color.startsWith('#')) {
    return color.length === 4
      ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
      : color
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1])
    const g = parseInt(rgbMatch[2])
    const b = parseInt(rgbMatch[3])
    return rgbToHex(r, g, b)
  }
  return color
}

function clamp(value: number, minVal: number, maxVal: number): number {
  return Math.max(minVal, Math.min(maxVal, value))
}

export function darken(color: string, factor: number): string {
  const hex = parseColor(color)
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const newL = clamp(l * (1 - factor), 0, 100)
  const [newR, newG, newB] = hslToRgb(h, s, newL)
  return rgbToHex(newR, newG, newB)
}

export function lighten(color: string, factor: number): string {
  const hex = parseColor(color)
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const newL = clamp(l + (100 - l) * factor, 0, 100)
  const [newR, newG, newB] = hslToRgb(h, s, newL)
  return rgbToHex(newR, newG, newB)
}

export function transparent(color: string, factor: number): string {
  const hex = parseColor(color).replace(/^#/, '')
  const alpha = Math.round(255 * (1 - clamp(factor, 0, 1))).toString(16).padStart(2, '0')
  return '#' + hex + alpha
}

export function mix(color1: string, color2: string, ratio = 0.5): string {
  const [r1, g1, b1] = hexToRgb(parseColor(color1))
  const [r2, g2, b2] = hexToRgb(parseColor(color2))
  const r = r1 * (1 - ratio) + r2 * ratio
  const g = g1 * (1 - ratio) + g2 * ratio
  const b = b1 * (1 - ratio) + b2 * ratio
  return rgbToHex(r, g, b)
}
