# Skyc Downloader — Design System Master File

> **LOGIC:** When styling or extending a specific page or component, follow the rules defined here as the single source of truth for **Skyc Downloader** (v1.6.7).

---

**Project:** Skyc Downloader (elskyx/Skyc)  
**Version:** v1.6.7  
**Design Philosophy:** Claude-Inspired Warm Minimalism, 21st.dev Design-Engineering Craft, Zero-Cloud Privacy, Anti-Slop Studio Quality.  
**Platform Targets:** Responsive Web, Tauri Desktop (Windows x64), Capacitor Mobile (Android APK).

---

## 1. Color Palette Tokens

The design system employs a dual-theme surface system: **Warm Parchment** for Light Mode and **Deep Claude Obsidian** for Dark Mode, unified by the signature **Terracotta Accent** (`#D97757`) and **Gemini Cobalt** secondary highlights.

### Light Theme (Warm Parchment)
| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-primary` | `#F4F3EE` | App canvas background |
| `--bg-surface` | `#FAF9F5` | Cards, panels, inputs |
| `--bg-elevated` | `#ECEAE2` | Hover states, pill badges |
| `--bg-glass` | `rgba(250, 249, 245, 0.88)` | Backdrop-filtered docks & headers |
| `--text-primary` | `#141413` | Headings, high-contrast labels |
| `--text-secondary` | `#5E5D59` | Body paragraphs, secondary metadata |
| `--text-muted` | `#8C8A84` | Placeholders, inactive captions |
| `--accent-primary` | `#D97757` | Core brand CTA, active tabs |
| `--accent-hover` | `#C6613F` | Interactive hover accent |
| `--accent-subtle` | `rgba(217, 119, 87, 0.12)` | Badge backgrounds, active pill tints |
| `--border-subtle` | `#E5E3DA` | Hairline card & divider borders |
| `--border-strong` | `#D1CEBF` | Interactive inputs & button outlines |
| `--border-focus` | `#D97757` | Focus ring indicator (contrast ≥ 3:1) |

### Dark Theme (Deep Obsidian)
| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-primary` | `#0C0C0B` | Deep OLED black background |
| `--bg-surface` | `#141413` | Cards, elevated surfaces |
| `--bg-elevated` | `#1C1B19` | Hover states, card borders |
| `--bg-glass` | `rgba(20, 20, 19, 0.86)` | Backdrop-filtered docks & headers |
| `--text-primary` | `#FAF9F5` | Primary readable text |
| `--text-secondary` | `#B4B2A9` | Secondary captions & descriptions |
| `--text-muted` | `#76746D` | Subdued metadata & timestamps |
| `--accent-primary` | `#D97757` | Core brand CTA |
| `--accent-hover` | `#E3886B` | Glow accent on hover |
| `--accent-subtle` | `rgba(217, 119, 87, 0.18)` | Active pill badge backgrounds |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Translucent hairline borders |
| `--border-strong` | `rgba(255, 255, 255, 0.16)` | Specular highlights on cards |
| `--border-focus` | `#E3886B` | High-visibility focus rings |

---

## 2. Typography Hierarchy

- **Editorial Serif:** `Instrument Serif`, Georgia, serif  
  *Usage:* Hero greetings (`Save anything, from anywhere.`), section titles, editorial quotes.
- **UI Sans:** `Plus Jakarta Sans`, system-ui, sans-serif  
  *Usage:* Navigation, button labels, modal headers, body copy.
- **Monospace:** `JetBrains Mono`, monospace  
  *Usage:* Version tags (`v1.6.7`), scraper IDs, URL tokens, file size metrics, hashes.

---

## 3. Elevation & Radius Scales

- `--radius-xs`: `4px`
- `--radius-sm`: `8px`
- `--radius-md`: `14px`
- `--radius-lg`: `20px`
- `--radius-xl`: `28px`
- `--radius-pill`: `9999px`

**Shadows:**
- Card: `0 4px 20px -4px rgba(20, 20, 19, 0.06), 0 1px 3px rgba(20, 20, 19, 0.04)`
- Floating Dock: `0 20px 48px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)`
- Glow: `0 0 24px rgba(217, 119, 87, 0.22)`

---

## 4. UI/UX Pro Max Accessibility & Interaction Rules

1. **Touch Targets:** Minimum 44×44px hit-box on all interactive triggers, buttons, and nav tabs.
2. **Keyboard Focus Rings:** Never remove outlines without `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
3. **Cursor Pointer:** Enforce `cursor: pointer` on all buttons, tabs, interactive platform cards, and modal dismissals.
4. **Disabled States:** Use `disabled:opacity-50 disabled:cursor-not-allowed` instead of `pointer-events: none` to retain hover affordance and tooltip accessibility.
5. **Reduced Motion:** All spring transitions and canvas particles respect `@media (prefers-reduced-motion: reduce)`.
6. **No Emoji as Icons:** Use official crisp SVGs for all platform extractors, navigation tabs, and system controls.
