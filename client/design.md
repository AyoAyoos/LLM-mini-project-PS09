# Frontend design — Story Studio

This document explains how the React frontend applies the repository's root [`DESIGN.md`](../../DESIGN.md). The root file is the single source of truth for visual styling; this file only maps those rules onto the app's components and states. It does not introduce a second design system.

## Design intent

The recruiting-dashboard shell from the root design is reused as a **bedtime story studio**:

| Dashboard element | Story Studio equivalent |
| --- | --- |
| Workspace switcher "Bretford" | Workspace switcher "Bedtime" |
| Breadcrumb `Library › Product designer` | `Library › Story Generator` |
| Sub-header "Overview" | "Overview" with Clear form / Tips |
| Detail panel "Product designer" | "Story settings" (age band, characters, moral, voice) |
| Data card "Member / Candidate" | "Story composer", story, loading, error and tips cards |
| Info pill "Bedtime mode" | Info pill "Bedtime mode" |
| Purple parent avatar | Purple parent avatar "P" |

The product copy is warmer, but the visual grammar stays quiet and neutral: white cards, hairline borders, small type, one dark primary action.

## Token mapping

All values below are copied from the root design and declared once in `src/styles.css` under `:root`.

| Token | Value | Frontend usage |
| --- | --- | --- |
| `--bg-app` | `#F3F3F1` | Outer frame behind the rounded app panel. |
| `--bg-sidebar` | `#F6F6F5` | Left navigation rail. |
| `--bg-surface` | `#FFFFFF` | App panel, cards, inputs, top bar. |
| `--bg-subtle` | `#F5F5F5` | Read-only inputs and subtle fills. |
| `--bg-active` | `#E8E8E8` | Active sidebar item. |
| `--border` | `#E8E8E8` | Card, input and divider borders. |
| `--border-strong` | `#DADADA` | Stronger hover borders. |
| `--text-primary` | `#1A1A1A` | Titles, story text, names. |
| `--text-secondary` | `#6B6B6B` | Secondary copy, nav items. |
| `--text-tertiary` | `#9A9A9A` | Hints, placeholders, group labels. |
| `--primary` / `--primary-fg` | `#1C1C1E` / `#FFFFFF` | The single dark primary button. |
| `--blue-500` | `#3B82F6` | Icon tiles, slider accent, focus ring. |
| `--blue-50` / `--blue-700` | `#E8F2FF` / `#2B6FD6` | Info pills and toast text. |
| `--toast-bg` / `--toast-border` | `#EAF3FF` / `#A9CCF5` | Bottom-right toast. |
| `--chip-gray-bg` / `--chip-gray-fg` | `#EDEDED` / `#555555` | Neutral chips. |
| `--avatar-purple-bg` / `--avatar-purple-fg` | `#F1E7FB` / `#9B5DE5` | Parent avatar. |
| `--radius-panel` | `20px` | Main white app panel. |
| `--radius-card` | `16px` | All cards. |
| `--radius-input` | `10px` | Inputs and read-only fields. |
| `--radius-button` | `8px` | Buttons and icon buttons. |
| `--radius-chip` | `6px` | Chips and section icon tiles. |
| `--font-sans` | Inter → system stack | Body font. |

Body copy is `13px / 20px`; headings are `14px / 20px` at weight 600; card and nav labels are `13px / 18px`; hints, chips and group labels are `11px / 14px`. No weight above 600 is used.

Elevation follows the root rules: cards have no shadow; the app panel uses `0 8px 30px rgba(0,0,0,0.06)`; the toast uses `0 4px 12px rgba(0,0,0,0.06)`. Transitions are `120ms ease-out`.

## Layout

At **≥ 1200px**:

```
┌───────────────┬──────────────────────────────────────────────────┐
│ Sidebar 210px │ Topbar, 60px (breadcrumb + actions)              │
│ light gray    ├──────────────────────────────────────────────────┤
│               │ Sub-header (Overview + secondary actions)       │
│               ├───────────────────┬──────────────────────────────┤
│               │ Detail panel 255px│ Fluid cards, 16px gap       │
└───────────────┴───────────────────┴──────────────────────────────┘
```

The whole panel floats in a 12px light-gray frame and has a 20px radius. The sidebar has no right border; the white panel edge separates it. The detail panel is divided from the content column by a 1px border.

## Components

| Component | Root design pattern |
| --- | --- |
| `Sidebar.tsx` | 40px white workspace switcher, 36px search, 32px nav items, group labels, indented collection children, pinned footer items. |
| `Topbar.tsx` | 60px white bar, breadcrumb, info pill, bordered icon buttons, purple initial avatar. |
| `SubHeader.tsx` | Bottom-bordered bar with section header and secondary buttons. |
| `DetailPanel.tsx` | Header with emoji/title/ghost button, divided sections, read-only inputs, neutral chips, copy button. |
| `StoryForm.tsx` | Card with blue icon tile, labelled fields and one primary submit button. |
| `TagInput.tsx` | Neutral removable chips inside a focusable input; Enter and comma add, Backspace removes, Escape clears. |
| `MoralChips.tsx` | Selectable chips (`aria-pressed`) plus a custom text field and character counter. |
| `LoadingCard.tsx` | Card with icon tile, small spinner and `role="status"`. |
| `StoryView.tsx` | Card with title, plain-text paragraphs, visible `Moral:` line and action row. |
| `ErrorCard.tsx` | Card with alert tile, friendly message, primary retry and secondary change-details. |
| `TipsCard.tsx` | Card with a stacked list of icon + title + description rows. |
| `Toast.tsx` | Bottom-right blue toast, 12px/16px padding, dismiss button, auto-dismiss after 4s. |

Icons are locally defined inline SVGs in `icons.tsx` using the root 16px line-icon style with a 1.5px stroke. Icon-only buttons always have an `aria-label`.

## UI states

1. **Form** — age slider with info pill and age-band hint, character tag input, seven moral presets plus custom field. The only dark button is **Tell me a story**.
2. **Loading** — the form remains visible with its controls disabled; `LoadingCard` shows the spinner and a friendly message. The primary button reads **Making your story…** and is disabled.
3. **Story** — title, paragraphs split on blank lines, a visible **Moral:** line, then **Read aloud / Pause / Resume** as the single dark primary button, a bordered stop icon button, and secondary **New story** / **Regenerate** buttons. A polite live status announces player state and fallback use.
4. **Error** — alert card with the server's friendly message, **Try again** as the primary action and **Change details** as secondary.

Toasts announce story readiness, voice copying, fallback use and other lightweight outcomes without changing the current state.

## Interaction and accessibility

- Hover/active/focus treatments match the root table: nav `/rgba(0,0,0,0.04)`, primary `#2A2A2C` → `#000000`, secondary `#FAFAFA` → `#F3F3F3`, inputs get a `--blue-500` border with a 3px ring at 15%.
- Every input has a visible `<label>` or a screen-reader-only label (`Search preset morals`).
- The age slider exposes `aria-valuetext`; moral chips expose `aria-pressed`; form errors use `role="alert"`; loading and player status use `aria-live="polite"`.
- Focus is visible via `:focus-visible` with a 2px blue ring and 2px offset.
- All actions are real buttons with keyboard support; the tag input handles Enter, comma, Backspace and Escape.
- `prefers-reduced-motion` reduces all animation and transition durations to `0.01ms`.

## Responsive behavior

- **900–1199px:** the detail panel becomes a `<details>` accordion above the content column.
- **< 900px:** the sidebar slides in as a drawer with an overlay and menu button; top-bar secondary action and some actions collapse; cards use tighter padding; the toast spans the available width.
- Slider, tag input, chips and buttons wrap naturally so the whole flow is usable on a phone at bedtime.

## Design rules followed

- Hairline borders and white cards on a gray frame; no gradients or heavy card shadows.
- Exactly one saturated accent (blue) for status/focus and one dark primary action per state.
- Text weights never exceed 600; tertiary text is reserved for non-essential hints.
- Consistent radii within each component and generous 4/8/12/16/20/24/32px spacing.
