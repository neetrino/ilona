# Home landing — responsive & scroll contract

Persistent requirements for `/home/{locale}` and future marketing sections.  
Cursor rule: `Rules/.cursor/rules/10-home-marketing-responsive.mdc` (`alwaysApply: true`).

## 1. One scroll for the whole page

- Users scroll **the document once**, not individual sections.
- Do **not** use `height: 100vh` + `overflow-y: auto` on sections (or similar) on the marketing home page.
- Prefer:
  - `.home-page` on the page root with `overflow-x: clip`, `overflow-y: visible`
  - `html:has(.home-page), body` → `height: auto`, `overflow-y: auto`
- Sections and `main` → `height: auto`, `max-height: none`, `overflow: visible`.

When content grows on small screens, the **page** gets taller; nothing is trapped in a nested scroller.

## 2. Header + section alignment

- **`HomeShell`** (`apps/web/src/features/home/components/home-shell.tsx`):
  - Outer: `px-2 sm:px-3 md:px-4 lg:px-4`
  - Container: `max-w-[1600px] mx-auto`
  - Inner content: `HOME_SHELL_INNER_X_CLASS` (`px-3` … `lg:px-6`) — same as nav row
- Header floats over hero: `<HomeNavigation overlay />` inside a `relative` wrapper with `<HeroSection />` below in the tree but visually under the nav.

## 3. Breakpoints (reference)

Implemented in `apps/web/src/features/home/styles/home.css`:

| Viewport | CSS | Hero layout |
|----------|-----|-------------|
| Phone | `max-width: 639px` | Stack: title → text → buttons → illustration |
| Tablet portrait | `640px – 767px` | Stack, larger scale; buttons side-by-side with wrap |
| Tablet landscape | `768px – 1023px` | Two columns: copy left, visual right |
| Desktop | `min-width: 1024px` | Figma-like split (~51% / ~41%) |

New sections should follow the same breakpoints and `HomeShell`.

## 4. Hero visual (flags + character)

- Positions use **percentage** inside `.home-hero-stage`, not page-level absolute px from Figma.
- **Phone / tablet / desktop** each have their own `left` / `top` in the correct `@media` block.
- Desktop flag rules must live only under `@media (min-width: 1024px)` so they do not override mobile/tablet.

## 5. Fluid sizing

- Typography: `clamp()` for titles and spacing.
- Stage: `aspect-ratio` on small screens; `min-height` + `height: auto` on desktop.
- Images: `next/image` with responsive `sizes`.

## 6. Files (current)

| File | Role |
|------|------|
| `apps/web/src/app/home/[locale]/page.tsx` | `.home-page` wrapper, `HomeNavigation` + `HeroSection` |
| `apps/web/src/features/home/components/HeroSection.tsx` | Hero markup |
| `apps/web/src/features/home/styles/home.css` | Hero + scroll + breakpoints |
| `apps/web/src/features/home/components/home-shell.tsx` | Shared container |

## 7. Checklist before PR

- [ ] Only one vertical scrollbar on the page (viewport)
- [ ] No clipped hero title under overlay header on phone
- [ ] Tablet 768px+: two columns without horizontal overflow
- [ ] Desktop unchanged unless intentionally updated
- [ ] Flag tweaks tested at &lt;640, ~700, ~900, ≥1024 widths
