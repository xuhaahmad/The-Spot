// Checks the colour tokens in tokens.css against WCAG 2.2 AA contrast rules,
// so a future colour tweak can't silently make text unreadable.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

function block(selectorStart) {
  const start = css.indexOf(selectorStart)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

function parseColors(text) {
  return Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]))
}

const themes = {
  light: parseColors(block(":root[data-theme='light']")),
  dark: parseColors(block(":root[data-theme='dark']")),
}
const noJsDarkFallback = parseColors(block(':root:not([data-theme])'))

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT = 4.5 // normal-size text
const UI = 3 // focus rings, component boundaries, meaningful icons

// [foreground, background, minimum, where it's used]
const PAIRS = [
  ['color-text', 'color-bg', TEXT, 'body text'],
  ['color-text', 'color-surface', TEXT, 'text on cards'],
  ['color-text', 'color-surface-muted', TEXT, 'text on muted panels'],
  ['color-text', 'color-surface-elevated', TEXT, 'text on raised cards'],
  ['color-text', 'color-accent-soft', TEXT, 'selected chips and choices'],
  ['color-text', 'color-error-soft', TEXT, 'error messages'],
  ['color-text-muted', 'color-bg', TEXT, 'secondary text'],
  ['color-text-muted', 'color-surface', TEXT, 'secondary text on cards'],
  ['color-text-muted', 'color-surface-muted', TEXT, 'secondary text on muted panels'],
  ['color-accent', 'color-bg', TEXT, 'links'],
  ['color-accent', 'color-surface', TEXT, 'links on cards'],
  ['color-accent', 'color-surface-muted', TEXT, 'links on muted panels'],
  ['color-accent-contrast', 'color-accent-strong', TEXT, 'primary button text'],
  ['color-accent-contrast', 'color-accent-strong-hover', TEXT, 'primary button text on hover'],
  ['color-text', 'tone-sage', TEXT, 'moodboard tile labels'],
  ['color-text', 'tone-clay', TEXT, 'moodboard tile labels'],
  ['color-text', 'tone-sand', TEXT, 'moodboard tile labels'],
  ['color-text', 'tone-stone', TEXT, 'photo placeholders and their "No verified photo" note'],
  ['tone-ink-text', 'tone-ink', TEXT, 'dark tile and closing banner'],
  ['color-focus', 'color-bg', UI, 'focus ring'],
  ['color-focus', 'color-surface', UI, 'focus ring on cards'],
  ['color-input-border', 'color-surface', UI, 'form field and chip borders'],
  ['color-input-border', 'color-bg', UI, 'form field and chip borders'],
  ['color-error', 'color-surface', UI, 'saved heart, error marks'],
  ['color-error', 'color-bg', UI, 'error message edge'],
  ['color-accent', 'color-surface', UI, 'match icons and checkmarks'],
]

describe.each(Object.entries(themes))('%s theme contrast', (_name, colors) => {
  it.each(PAIRS)('%s on %s ≥ %s:1 (%s)', (fg, bg, minimum) => {
    expect(colors[fg], `missing --${fg}`).toBeDefined()
    expect(colors[bg], `missing --${bg}`).toBeDefined()
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(minimum)
  })
})

// Text on photographs: the overlay must keep it readable even in the worst
// case, where the part of the photo behind the text is pure white.
describe('text over photographs', () => {
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))
  const value = (name) => root.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim()
  const overlay = value('photo-overlay')
  const strength = parseFloat(value('photo-overlay-strong')) / 100

  function blendOverWhite(hex, alpha) {
    const channel = (i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * alpha + 255 * (1 - alpha))
    return '#' + [1, 3, 5].map((i) => channel(i).toString(16).padStart(2, '0')).join('')
  }

  it.each(['on-photo-text', 'on-photo-muted'])('--%s stays ≥ 4.5:1 over the strong overlay on a white photo', (name) => {
    expect(overlay).toMatch(/^#[0-9a-f]{6}$/i)
    expect(strength).toBeGreaterThan(0)
    const background = blendOverWhite(overlay, strength)
    expect(contrast(value(name), background)).toBeGreaterThanOrEqual(TEXT)
  })
})

describe('no-JavaScript dark fallback', () => {
  it('uses exactly the same colours as the dark theme', () => {
    for (const [name, value] of Object.entries(noJsDarkFallback)) {
      expect(value.toLowerCase(), `--${name}`).toBe(themes.dark[name]?.toLowerCase())
    }
    // Every dark colour is present in the fallback too.
    expect(Object.keys(noJsDarkFallback).sort()).toEqual(Object.keys(themes.dark).sort())
  })
})

describe('contrast helper', () => {
  it('matches known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
})
