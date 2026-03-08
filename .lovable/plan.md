

# Plan: Refonte complète de la page "Mon Pingouin"

## Analyse de l'existant
La page actuelle fonctionne mais souffre de plusieurs problèmes:
- Layout 3 colonnes complexe qui se désorganise sur mobile
- Animations sprite non fonctionnelles (chemins d'images incorrects)
- Composants éparpillés (IslandView, KingPenguin, SpriteAnimation) mal intégrés
- UX incohérente entre les sections (Expéditions, Perles, Boutique)
- Assets disponibles: `penguin-king.png`, `penguin-sprites.png`, `penguin-wave-sprites.png`, `penguin-mascot.png`

## Nouvelle architecture simplifiée

### Structure de la page (single scroll, mobile-first)
```text
┌─────────────────────────────────────────────┐
│  HERO: Penguin Avatar + Stats compactes     │
│  (Avatar animé CSS steps(8) + progression)  │
├─────────────────────────────────────────────┤
│  RESOURCES: 4 badges horizontaux scrollables│
├─────────────────────────────────────────────┤
│  ISLAND: Vue immersive (aspect-video)       │
│  - Zones interactives avec pulse           │
│  - Penguin central (framer-motion bounce)  │
├─────────────────────────────────────────────┤
│  TABS: Expéditions | Perles | Boutique     │
│  (Apple segmented control style)           │
└─────────────────────────────────────────────┘
```

## Implémentation technique

### 1. Composant `AnimatedPenguin` (nouveau)
- CSS sprite animation avec `background-position` et `steps(8)`
- Hover: déclenche animation wave via classe CSS
- Auto-play breathing avec framer-motion `animate={{ scale: [1, 1.03, 1] }}`
- Import correct des assets via `import sprite from "@/assets/penguin-wave-sprites.png"`

### 2. Réécriture `Gamification.tsx`
- Suppression du layout 3 colonnes complexe
- Single column mobile-first avec `max-w-2xl mx-auto`
- Header hero compact avec avatar + barre progression gradient
- Section ressources en `grid grid-cols-4 gap-2`
- Island view pleine largeur avec `aspect-video rounded-3xl`
- Tabs Apple-style pour le contenu inférieur

### 3. Amélioration `IslandView.tsx`
- Fix des zones cliquables (positionnement relatif)
- Penguin central avec sprite animation (wave on hover)
- Aurora borealis animation plus fluide
- Particules flottantes avec stagger delay

### 4. Animation CSS sprite (index.css)
```css
@keyframes penguin-wave {
  from { background-position: 0 0; }
  to { background-position: -800px 0; } /* 8 frames × 100px */
}
.penguin-sprite {
  width: 100px;
  height: 100px;
  background: url(...) no-repeat;
  animation: penguin-wave 0.6s steps(8) infinite;
}
```

### 5. Framer-motion interactions
- `whileHover={{ scale: 1.1, y: -12 }}` avec spring
- `whileTap={{ scale: 0.95 }}`
- Stagger animations sur les cartes expéditions
- AnimatePresence sur les tabs

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/pages/Gamification.tsx` | **Réécrire** — Layout simplifié, hero compact |
| `src/components/penguin/IslandView.tsx` | **Améliorer** — Fix sprite paths, animation fluide |
| `src/components/penguin/AnimatedPenguin.tsx` | **Créer** — Composant sprite dédié |
| `src/components/penguin/ExpeditionBoard.tsx` | **Améliorer** — Glassmorphism cohérent |
| `src/components/penguin/AccessoryShop.tsx` | **Améliorer** — Grid responsive |
| `src/components/penguin/PearlsPanel.tsx` | **Améliorer** — Dark mode styling |
| `src/index.css` | **Ajouter** — @keyframes penguin-wave |

## Couleurs et tokens
- Background: `#0B0E14` (dark premium)
- Card surface: `#1A1F26` avec `border-white/5`
- Accent sky: `sky-400` (#38BDF8)
- Accent amber: `amber-400` (#FBBF24)
- Glassmorphism: `backdrop-blur-xl bg-white/5`

