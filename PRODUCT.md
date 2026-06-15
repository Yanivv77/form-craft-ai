# Product

## Register

product

## Users

People who need a form fast and don't want to build one by hand: a teammate
collecting RSVPs, a teacher running a quiz, a small business taking intake. They
describe what they want in plain language, get a working draft, adjust it, and
share a link. Many are not designers or developers. A second audience is the
respondents who open the shared link and fill the form, often on a phone, often
in Hebrew or English.

## Product Purpose

Form Craft AI turns a sentence into a working form. You type an idea, the AI
drafts the questions, you edit anything, then save and share. Owners collect
responses and export them as CSV. Success is the gap between "I need a form" and
"here's the link" measured in under a minute, with output the owner trusts
enough to send without cleanup.

## Brand Personality

Calm, considered, quiet. A serious tool that stays friendly. The interface
should feel like a clean sheet of paper with one confident mark of ink, not a
busy SaaS dashboard. Voice is plain and direct: short labels, no marketing
adjectives, no exclamation. The product earns trust by getting out of the way.

## Anti-references

- Loud SaaS landing pages: gradient hero, glow, big-number metric template.
- Glassmorphism and frosted-glass surfaces used for decoration.
- Generic Material/Bootstrap admin panels with heavy shadows and dense chrome.
- Typeform-style full-screen one-question-at-a-time theatrics. This is a quiet
  builder, not a presentation.
- Dark "developer tool" aesthetic. This product is light, warm, and plain.

## Design Principles

1. **One mark of ink.** Near-monochrome paper canvas, a single cobalt accent
   reserved for the decision points (primary action, active link, brand mark).
   A second accent color breaks the identity.
2. **Flat, not floating.** Depth comes from surface color shifts and hairline
   borders, never from shadows or blur. The accent fill is the only elevation.
3. **The form is the hero.** No marketing page. The first thing a visitor sees
   is the input that does the work.
4. **Edit, don't accept.** AI output is a draft the user shapes. Every generated
   field stays editable, reorderable, and removable.
5. **Bilingual by construction.** English and Hebrew, LTR and RTL, are first
   class. Layout uses logical properties so direction is a setting, not a
   rewrite. A shared form renders in its own language for every viewer.

## Accessibility & Inclusion

- Target WCAG 2.1 AA. Body text holds at least 4.5:1 against its surface,
  including muted helper text and placeholders on the warm paper background.
- Full keyboard operation with a visible cobalt focus ring on every control.
- RTL (Hebrew) is supported throughout; the public form follows the form's own
  stored direction regardless of the viewer's UI locale.
- Motion is minimal and respects `prefers-reduced-motion`.

## Visual system

The committed visual system is **Pastel**, documented in
`design-system/form-craft-ai/MASTER.md` (tokens in `tokens.json`,
`variables.css`, `theme.css`). It serves as this project's DESIGN.md: paper-stone
canvas, ink-black text, ice-line hairline borders, one cobalt accent, flat
no-shadow surfaces, the signature 8.8px corner radius, and Figtree type.
