

# Plan: Apple HIG "Liquid Glass" Design System Integration

## What needs to change

The app already has a good Apple foundation (SF font stack, clean cards, minimal scrollbars). The gaps vs the HIG spec are:

1. **Liquid Glass** — Missing `backdrop-filter: blur(20px) saturate(180%)` on overlays (sidebar, mobile header, dialogs, dropdowns, sheets). Currently using basic `backdrop-blur-2xl` without saturation.
2. **Spring animations** — Using `cubic-bezier(0.25, 0.1, 0.25, 1)` everywhere. Need iOS spring curves and framer-motion `type: "spring"` for interactive elements.
3. **Button feedback** — `active:scale-[0.97]` is too subtle. Apple uses `0.95` with spring bounce-back.
4. **Touch targets** — Button `sm` size is `h-9` (36px), below the 44px minimum. Input height `h-10` (40px) also below.
5. **8px spacing grid** — Inconsistent padding (p-5 = 20px, p-2.5 = 10px). Need strict 8px multiples.
6. **Concentric border-radius** — Inner elements don't follow proportional radius rule. Cards use `rounded-lg` while buttons use `rounded-xl`.
7. **Deference** — Cards still have `shadow-sm` in base component. Dialog overlay is `bg-black/80` (too opaque, should be ~60% with blur).
8. **Adaptive tinting** — Dark mode cards should slightly absorb primary color tint.
9. **Progressive disclosure** — No page transition animations between routes.

---

## Files to modify

### 1. `src/index.css` — Liquid Glass foundation + spring transitions

- Replace transition timing with iOS spring: `cubic-bezier(0.2, 0.8, 0.2, 1)` (underdamped spring feel)
- Add `.liquid-glass` utility: `backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);`
- Update `.glass-nav`, `.glass-morphism` to include `saturate(180%)`
- Reduce dialog overlay to `bg-black/60` with blur
- Add dark mode adaptive tint: cards get `hsl(211 100% 50% / 0.02)` overlay
- Enforce 44px min touch targets on interactive elements
- Update all spacing to 8px grid (p-4=16px, p-6=24px, p-8=32px — already correct, fix p-5→p-4 or p-6, p-2.5→p-2 or p-3)

### 2. `src/components/ui/card.tsx` — Apple card styling

- Change from `rounded-lg shadow-sm` to `rounded-2xl shadow-none` (deference)
- Add `transition-colors duration-200` for hover states

### 3. `src/components/ui/button.tsx` — Spring feedback + 44px targets

- Change `active:scale-[0.97]` to `active:scale-[0.95]`
- Add `transition-transform` with spring curve
- Increase `sm` size from `h-9` to `h-11` (44px)
- Increase `icon` from `h-10 w-10` to `h-11 w-11` (44px)
- Consistent `rounded-xl` for all sizes (remove `rounded-md` on sm/lg)

### 4. `src/components/ui/input.tsx` — Apple input style

- Change from `h-10` to `h-11` (44px touch target)
- Replace `border border-input` with `border-0 bg-secondary` (filled style like iOS)
- Add `focus-visible:bg-background focus-visible:ring-1` (subtle focus, not ring-2)
- Use `rounded-xl` consistently

### 5. `src/components/ui/dialog.tsx` — Liquid Glass modal

- Overlay: `bg-black/60 backdrop-blur-sm` (lighter, with blur)
- Content: `rounded-2xl shadow-2xl` with Liquid Glass background
- Spring animation via existing radix animate classes

### 6. `src/components/layout/Sidebar.tsx` — 8px grid + Liquid Glass

- Fix spacing: `p-2.5` → `p-3`, `space-y-0.5` → `space-y-1`
- Nav items: `h-11` (44px touch target), `px-3` → `px-4`
- Active item: keep `bg-primary/10` but add subtle spring transition
- Logo section: `p-5` → `p-4`

### 7. `src/components/layout/MobileHeader.tsx` — iOS status bar feel

- Add `saturate(180%)` to backdrop-filter
- Increase height from `h-14` → `h-12` (iOS standard 48px)
- Add `env(safe-area-inset-top)` padding

### 8. `src/components/layout/AppLayout.tsx` — Page transitions

- Wrap `<Outlet />` in framer-motion `AnimatePresence` with fade transition
- Mobile sheet: add Liquid Glass to sheet content
- Fix spacing: `py-5` → `py-6`, `p-5` → `p-6`

### 9. `src/components/shared/ItemCard.tsx` — Spring motion + concentric radius

- Change framer-motion transition to `type: "spring", stiffness: 400, damping: 30`
- Card hover: `hover:shadow-md` → `hover:bg-muted/40` (deference — no shadow elevation)
- Ensure inner badge radius < card radius (already fine)

### 10. `tailwind.config.ts` — Spring keyframes

- Update all animation curves to `cubic-bezier(0.2, 0.8, 0.2, 1)` (spring)
- Add `spring-bounce` keyframe for button press feedback
- Add `page-enter` / `page-exit` keyframes for route transitions

### 11. `src/components/ui/sheet.tsx` — Liquid Glass mobile menu

- Add Liquid Glass backdrop to sheet overlay
- Sheet content: add `backdrop-filter: blur(20px) saturate(180%)`

### 12. `src/components/ui/textarea.tsx` — Match input style

- Same filled style as input: `border-0 bg-secondary rounded-xl`
- Min height 44px

---

## Summary of Apple HIG principles applied

| Principle | Implementation |
|-----------|---------------|
| Clarity | SF font stack, tight letter-spacing, 4.5:1 contrast |
| Deference | Remove shadows from cards, lighter overlays, content-first |
| Depth | Liquid Glass (blur+saturate) on all floating layers |
| Spring motion | `cubic-bezier(0.2, 0.8, 0.2, 1)` + framer spring |
| 44px targets | All buttons, inputs, nav items minimum h-11 |
| 8px grid | Spacing in multiples of 8px only |
| Concentric radius | Outer=rounded-2xl, inner=rounded-xl |
| Feedback | `active:scale-[0.95]` with spring bounce-back |

