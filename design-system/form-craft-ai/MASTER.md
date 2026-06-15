# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/form-craft-ai/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. If not, follow the rules below.

---

**Project:** Form Craft AI
**Category:** AI form builder (web · Next.js 16 / React 19 on Cloudflare Workers)
**Palette direction:** Soft blue + sage green — modern, futuristic & **peaceful** (calm-tech)

---

## ⚠️ Source of Truth (read first)

This file is the **proposed brand color direction**. Colors ship **both hex and OKLCH**
so they port straight into `app/globals.css` (`:root` + `.dark`). Until ported, code truth lives in:

- **Colors:** `app/globals.css` — swap its neutral tokens for the OKLCH values below.
- **Components:** `components.json` — **shadcn/ui** (`base-nova`) on Base UI + CVA. Use
  `npx shadcn@latest add …`; the component CSS here is illustrative, not literal.
- **Fonts:** **Geist Sans + Geist Mono** (`--font-geist-sans` / `--font-geist-mono`).
- **Stack:** web app — ignore the ui-ux-pro-max SKILL.md's React Native guidance.

All foreground/background pairs below were contrast-checked (WCAG AA).

---

## Brand Direction — Calm Futurism

Modern and futuristic, but **serene** — think spatial/soft-glass UI (Apple visionOS,
Linear's calm), not sci-fi. The future here feels *quiet and weightless*, not loud.

- **Light-first & airy** — generous whitespace, soft depth, gentle layering.
- **Softened palette** — a calm **periwinkle blue** primary and a **sage green** accent,
  both lower-chroma (no vivid/electric saturation).
- **Soft glass + aurora** — frosted translucent surfaces, diffuse cool shadows, and slow
  pastel aurora gradients used at low opacity.
- **Explicitly NOT:** ❌ neon · ❌ electric/glow accents · ❌ cyberpunk (scanlines/glitch/HUD)
  · ❌ dark-by-default void · ❌ purple AI gradients · ❌ high-saturation or harsh shadows.

---

## Color Palette — Light (`:root`)

| Role | Hex | OKLCH | Token |
|------|-----|-------|-------|
| Background | `#F7F9FC` | `oklch(0.981 0.005 258.3)` | `--background` |
| Foreground | `#222C3D` | `oklch(0.292 0.034 260.8)` | `--foreground` |
| Card / Popover | `#FFFFFF` | `oklch(1 0 0)` | `--card` / `--popover` |
| **Primary (soft blue)** | `#4763D4` | `oklch(0.541 0.176 269.2)` | `--primary` |
| On Primary | `#FFFFFF` | `oklch(1 0 0)` | `--primary-foreground` |
| Secondary (blue tint) | `#E9EEFC` | `oklch(0.949 0.020 270.2)` | `--secondary` |
| On Secondary | `#36459E` | `oklch(0.431 0.145 271.7)` | `--secondary-foreground` |
| **Accent (sage green)** | `#4FAE8B` | `oklch(0.684 0.105 166.5)` | `--accent` |
| On Accent | `#0E261F` | `oklch(0.252 0.040 168)` | `--accent-foreground` |
| Muted | `#EEF1F7` | `oklch(0.958 0.009 264.5)` | `--muted` |
| Muted Foreground | `#647087` | `oklch(0.544 0.039 263.4)` | `--muted-foreground` |
| Border / Input | `#E5EAF3` | `oklch(0.936 0.013 262.4)` | `--border` / `--input` |
| Ring (focus) | `#4763D4` | `oklch(0.541 0.176 269.2)` | `--ring` |
| Destructive (soft) | `#C24A4A` | `oklch(0.571 0.154 23.3)` | `--destructive` |
| On Destructive | `#FFFFFF` | `oklch(1 0 0)` | `--destructive-foreground` |

**Charts (calm):** `#4763D4` · `#4FAE8B` · `#8AA0E8` · `#6FB3C2` · `#E2B07A`
(blue · sage · periwinkle · dusty teal · sand) — `--chart-1…5`.

## Color Palette — Dark (`.dark`) — calm, no glow

| Role | Hex | OKLCH | Token |
|------|-----|-------|-------|
| Background | `#141B28` | `oklch(0.222 0.028 262.4)` | `--background` |
| Foreground | `#E6EBF3` | `oklch(0.939 0.012 259.8)` | `--foreground` |
| Card / Popover | `#1B2433` | `oklch(0.259 0.031 260.4)` | `--card` / `--popover` |
| **Primary (soft blue)** | `#8AA0F0` | `oklch(0.721 0.119 271.4)` | `--primary` |
| On Primary | `#0E1424` | `oklch(0.190 0.035 264)` | `--primary-foreground` |
| Secondary | `#222C42` | `oklch(0.295 0.044 266)` | `--secondary` |
| On Secondary | `#C7D2F6` | `oklch(0.864 0.060 268)` | `--secondary-foreground` |
| **Accent (sage green)** | `#74C2A6` | `oklch(0.756 0.088 168.9)` | `--accent` |
| On Accent | `#0E1F1A` | `oklch(0.231 0.034 168)` | `--accent-foreground` |
| Muted | `#232E40` | `oklch(0.300 0.036 260.1)` | `--muted` |
| Muted Foreground | `#97A2B5` | `oklch(0.710 0.030 261.4)` | `--muted-foreground` |
| Border / Input | `#2C3850` | `oklch(0.341 0.045 263.7)` | `--border` / `--input` |
| Ring | `#8AA0F0` | `oklch(0.721 0.119 271.4)` | `--ring` |
| Destructive (soft) | `#E08A8A` | `oklch(0.736 0.103 22)` | `--destructive` |
| On Destructive | `#2A1010` | `oklch(0.205 0.045 25)` | `--destructive-foreground` |

**Charts (dark):** `#8AA0F0` · `#74C2A6` · `#A6B4F4` · `#88C2D2` · `#E8C495`.

### Green usage rule
Sage `#4FAE8B` is a **fill / large-element** green (pair with dark `--accent-foreground`).
For green **text, icons, or hairlines on light**, use the accessible **`#347A63`**
`oklch(0.528 0.080 168.9)` (4.8:1 on white). Success surface: `#E7F6EF` bg + `#1B5E47` text.

### Aurora tints (decorative only, low opacity)
Soft sky `#DCE6FB` · mint `#DDF1E8` · lavender `#E8E4FB` · sand `#FCEEE2`. Use as slow,
low-opacity gradient meshes behind hero/empty states — never as solid fills or text.

### Verified contrast (WCAG AA)
fg/bg 13.3 · white/primary 5.3 · muted-fg/bg 4.7 · secondary-fg/secondary 8.0 ·
accent-fg/accent ~6.4 · white/destructive 4.8 — all pass; dark mode all ≥6.7.

---

## Typography

- **Heading + Body:** **Geist Sans** (`--font-geist-sans`) · **Mono:** **Geist Mono**
- **Scale:** 12 · 14 · 16 · 18 · 24 · 32 · 40 (base 16px; line-height 1.55 body / 1.2 headings)
- **Weight hierarchy:** headings 600 (calm, not 800), labels 500, body 400 · tabular figures for data
- Light, airy headings — favor size + spacing over heavy weight for the peaceful feel.

---

## Spacing & Radius

| Token | Value | | Token | Value |
|-------|-------|---|-------|-------|
| `--space-xs` | 4px | | `--space-xl` | 32px |
| `--space-sm` | 8px | | `--space-2xl` | 48px |
| `--space-md` | 16px | | `--space-3xl` | 64px |
| `--space-lg` | 24px | | `--space-4xl` | 96px (airy sections) |

**Radius:** lean to the **larger** end of the project's `--radius` scale for a soft,
weightless feel — cards `--radius-xl`/`2xl` (14–18px), buttons/inputs `--radius-lg`.

## Elevation (soft glass — diffuse, cool, low-opacity)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgb(34 44 61 / 0.04)` | inputs, rows |
| `--shadow-md` | `0 8px 24px rgb(34 44 61 / 0.06)` | cards, popovers |
| `--shadow-lg` | `0 20px 48px rgb(34 44 61 / 0.08)` | modals, sheets |

Large blur radius, very low opacity, cool slate tint — never hard/black shadows or glow.

---

## Component Specs (illustrative — implement via shadcn + tokens)

```css
/* Primary — calm periwinkle blue */
.btn-primary {
  background: var(--primary);                 /* #4763D4 */
  color: var(--primary-foreground);
  padding: 10px 18px;
  border-radius: var(--radius-lg);
  font-weight: 500;
  transition: background-color 220ms ease, box-shadow 220ms ease;
}
.btn-primary:hover { background: color-mix(in oklch, var(--primary) 92%, black); }
.btn-primary:focus-visible {                  /* soft ring, NOT a glow */
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 30%, transparent);
}

/* Soft-glass surface (frosted, peaceful depth) */
.glass-card {
  background: color-mix(in oklch, var(--card) 70%, transparent);
  backdrop-filter: blur(20px) saturate(115%);
  border: 1px solid color-mix(in oklch, var(--border) 80%, transparent);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
}

/* Accent / success — sage (fill + dark text; #347A63 for text/icons) */
.btn-accent { background: var(--accent); color: var(--accent-foreground); }

/* Input — soft border, gentle focus ring */
.input { border: 1px solid var(--input); border-radius: var(--radius-lg); }
.input:focus-visible {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 22%, transparent);
}

/* Optional calm aurora backdrop (decorative, low opacity, slow/no motion) */
.aurora-bg {
  background:
    radial-gradient(60% 60% at 20% 10%, #DCE6FB 0%, transparent 60%),
    radial-gradient(50% 50% at 85% 20%, #DDF1E8 0%, transparent 55%),
    radial-gradient(55% 55% at 60% 90%, #E8E4FB 0%, transparent 60%);
  opacity: 0.5;
}
```

---

## Style Guidelines

**Style:** Soft glass / spatial calm (visionOS · Linear-calm inspired)

**Keywords:** peaceful, airy, weightless, soft, spatial, frosted glass, gentle depth,
muted blue+sage, generous whitespace, slow calm motion, content-first

**Key Effects:** frosted translucency (backdrop-blur), diffuse cool shadows, large radii,
low-opacity aurora gradients, 220–320ms ease motion, soft focus rings — no glow, no neon

---

## Anti-Patterns (Do NOT Use)

- ❌ **Neon / electric / glowing accents** (text-shadow glow, saturated rim light)
- ❌ **Cyberpunk** — scanlines, glitch, HUD/wireframe, terminal-green, matrix
- ❌ **Dark-by-default void** (#000) backgrounds — peaceful means light-first, soft dark
- ❌ **Purple/violet AI gradients** & vibrant high-chroma fills
- ❌ Harsh/black drop-shadows · gradient text on headings
- ❌ Green as hairline/body text on white (use `#347A63`, not `#4FAE8B`)
- ❌ Emojis as icons (use Lucide) · invisible focus states · instant 0ms state changes
- ❌ Fast/bouncy motion — keep it slow and gentle (respect `prefers-reduced-motion`)

---

## Pre-Delivery Checklist

- [ ] Tokens pulled from `globals.css` (no raw hex in components)
- [ ] Calm, airy spacing; larger radii; soft diffuse shadows (no glow/neon)
- [ ] Primary blue for the one main CTA per screen; sage reserved for success/accent
- [ ] Text contrast ≥ 4.5:1 (verified above) in **both** light and dark
- [ ] Green text/icons use `#347A63`, not `#4FAE8B`
- [ ] Soft focus rings (`--ring` at low alpha); hover via color-mix (no layout shift)
- [ ] Glass surfaces stay legible — keep enough card opacity for text contrast
- [ ] Icons from one set (Lucide), consistent stroke/size; no emojis
- [ ] Motion 220–320ms, gentle; `prefers-reduced-motion` respected
- [ ] Responsive at 375 / 768 / 1024 / 1440; no horizontal scroll on mobile
- [ ] Dark mode checked independently (soft slate, not void black)
