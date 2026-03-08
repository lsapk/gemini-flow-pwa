

# Plan: Refonte Apple Liquid Glass des pages Tâches, Habitudes et Objectifs

## Constat
Les 3 pages fonctionnent bien mais manquent de polish visuel. Les composants sont solides (ItemCard, CheckCircle, ProgressRing, DnD) mais le styling est générique. Il faut appliquer le design system Apple Liquid Glass de manière cohérente : transparence, bords arrondis `rounded-2xl`, transitions spring fluides, symétrie et espacement 8px.

## Changements prévus

### 1. Pages (`Tasks.tsx`, `Habits.tsx`, `Goals.tsx`)
- Header unifié : titre + bouton action alignés avec espacement symétrique
- **Tabs Apple segmented control** : `rounded-2xl`, `backdrop-blur-xl bg-white/10 dark:bg-white/5`, bordures ultra-fines `border-white/10`, indicateur actif avec `bg-background/80 shadow-sm`
- Compteur de progression compact en haut (ex: "3/7 complétées" avec mini progress bar)
- Animation `AnimatePresence` sur le contenu des tabs pour transitions douces
- Loading skeletons avec `rounded-2xl` et shimmer effect

### 2. `ItemCard.tsx` — Glassmorphism + micro-interactions
- Card : `backdrop-blur-sm bg-card/80 border-white/10 rounded-2xl` au lieu de bordure opaque
- Hover : `bg-white/5` avec transition douce, légère élévation (`shadow-lg shadow-black/5`)
- `active:scale-[0.98]` pour feedback tactile au clic
- Priority border-left remplacé par un **dot indicator** coloré plus subtil dans le coin
- Espacement interne : padding `p-4` uniforme (grille 8px)

### 3. `CheckCircle.tsx` — Animation spring améliorée
- Transition plus douce : `stiffness: 400, damping: 25`
- Taille légèrement augmentée pour les cibles tactiles 44px
- Effet de glow subtil quand coché (`box-shadow: 0 0 12px rgba(34,197,94,0.3)`)

### 4. `FilterBar.tsx` — Style Apple search
- Input : `bg-secondary/50 border-0 rounded-xl backdrop-blur-sm` (style filled Apple)
- Priority pills : `rounded-full` avec transitions `scale` au clic
- Espacement symétrique `gap-3`

### 5. `ItemCardBadges.tsx` — Badges raffinés
- Tous les badges : `rounded-full` au lieu de `rounded-md`, padding plus généreux
- Couleurs plus subtiles avec opacité réduite
- Taille minimum tactile respectée

### 6. `ProgressRing.tsx` — Glow effect
- Ajouter un filtre SVG `drop-shadow` coloré selon la progression
- Animation d'entrée plus fluide

### 7. Tabs component (`tabs.tsx`)
- `TabsList` : `rounded-2xl bg-muted/50 backdrop-blur-xl p-1.5`
- `TabsTrigger` : `rounded-xl` avec transition `all 200ms`, `data-[state=active]:bg-background/90 data-[state=active]:shadow-sm`

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/components/ui/tabs.tsx` | Apple segmented control style |
| `src/components/shared/ItemCard.tsx` | Glassmorphism, micro-interactions |
| `src/components/shared/CheckCircle.tsx` | Glow + spring améliorés |
| `src/components/shared/FilterBar.tsx` | Style Apple filled input |
| `src/components/shared/ItemCardBadges.tsx` | Badges rounded-full raffinés |
| `src/components/shared/ProgressRing.tsx` | Glow SVG drop-shadow |
| `src/pages/Tasks.tsx` | Header unifié, AnimatePresence tabs, compteur |
| `src/pages/Habits.tsx` | Header unifié, AnimatePresence tabs, compteur |
| `src/pages/Goals.tsx` | Header unifié, AnimatePresence tabs, compteur |

