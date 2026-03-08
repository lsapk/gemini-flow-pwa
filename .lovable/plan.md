

# Plan: Apple-only design + UI polish + double-click fix + transitions

## 1. Fix double-click on subtasks/subobjectives

**Root cause**: The expand toggle buttons in `SortableTaskCard` (TaskList.tsx line 106) and `SortableGoalCard` (GoalList.tsx line 125-126) lack `e.stopPropagation()`. The framer-motion `layout` prop on the parent causes a re-render that fights with the state change, requiring two clicks.

**Fix**:
- Add `e.stopPropagation()` + `e.preventDefault()` to both expand toggle buttons
- Remove the `layout` prop from the parent `motion.div` in ItemCard (line 102-103) which causes layout animation conflicts with the expand/collapse
- In `SubobjectiveList.tsx`, default `isExpanded` to `true` when subobjectives exist, to match the parent's expand state

## 2. Remove futuristic design mode, keep only Apple

**Changes**:
- `DesignModeContext.tsx`: Remove the dual-mode system entirely. Always apply `design-apple` class. Export a no-op hook for backward compat.
- `index.css`: Remove all `.design-futuristic` rules. Move `.design-apple` styles to be the default. Remove futuristic gradients, glow effects, shimmer animations.
- `Settings.tsx`: Remove the "Style de design" selector section entirely.
- `AppLayout.tsx`: Remove the animated gradient background overlay (the pulsing gradient div).
- `Sidebar.tsx`: Remove `glow-effect` class from active items, remove gradient backgrounds, use clean Apple styling.
- `MobileHeader.tsx`: Remove gradient text on logo, use solid color.
- `tailwind.config.ts`: Remove `glow-pulse` animation, `primary-glow` color (keep for backward compat but simplify).

## 3. Global Apple-quality transitions

Add to `index.css`:
```css
/* Global smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Page transitions */
main { transition: opacity 0.2s ease; }

/* All interactive elements get micro-transitions */
button, a, input, textarea, select, [role="button"] {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Apply across components:
- Cards: `transition-all duration-200` with subtle `hover:bg-muted/50` instead of scale effects
- Sidebar items: clean `transition-colors duration-150` 
- Buttons: `active:scale-[0.97]` for tactile feel
- Checkboxes: `transition-transform duration-150`

## 4. Apple-quality interface refinements

**Sidebar**: Clean flat design, no gradients, no glow. Active item = subtle bg fill + left accent bar. System font throughout.

**Cards**: No backdrop-blur, no glassmorphism. Clean white/dark bg, 1px border, subtle shadow on hover only.

**Typography**: `-apple-system` font stack everywhere. Tighter letter-spacing on headings (-0.025em). 

**Inputs**: Subtle background fill, no visible border by default, border on focus.

**Mobile header**: Clean blur bar like iOS, no gradient text.

**Button refinements**: `active:scale-[0.97]` micro-interaction. Rounded-xl consistently.

## 5. Files to modify

| File | Changes |
|------|---------|
| `src/contexts/DesignModeContext.tsx` | Simplify to always-apple, no toggle |
| `src/index.css` | Remove futuristic, make apple defaults, add global transitions |
| `src/components/layout/AppLayout.tsx` | Remove gradient overlay |
| `src/components/layout/Sidebar.tsx` | Clean Apple sidebar |
| `src/components/layout/MobileHeader.tsx` | Clean Apple mobile header |
| `src/components/shared/ItemCard.tsx` | Remove `layout` prop conflict, cleaner card |
| `src/components/TaskList.tsx` | Fix stopPropagation on expand toggle |
| `src/components/GoalList.tsx` | Fix stopPropagation on expand toggle |
| `src/components/SubobjectiveList.tsx` | Default expanded when parent expands |
| `src/pages/Settings.tsx` | Remove design mode selector |
| `src/components/ui/button.tsx` | Add active:scale micro-interaction |
| `tailwind.config.ts` | Clean up unused futuristic animations |

