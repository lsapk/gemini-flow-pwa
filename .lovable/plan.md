
# Plan: Refonte complète de "Mon Pingouin" — Interface immersive avec animations sprite

## Vue d'ensemble

Créer une page gamification premium dark mode (#0B0E14) avec glassmorphism, île interactive centrale, et animations via sprite sheets. Le design s'inspire directement du mockup fourni.

## 1. Nouveaux Assets — Sprite Sheets

Copier les 2 sprite sheets uploadés vers `src/assets/`:
- `Gemini_Generated_Image_g96pw8g96pw8g96p_1.png` → `penguin-sprites.png` (contient: walk cycle, wave cycle, king penguin, radio, cabin)
- `Gemini_Generated_Image_wzlozlwzlozlwzlo_1.png` → `penguin-wave-sprites.png` (wave animation 8 frames)

## 2. Nouveau composant: `SpriteAnimation.tsx`

Composant réutilisable pour animer les sprite sheets:
- Props: `src`, `frameWidth`, `frameHeight`, `totalFrames`, `fps`, `direction` (horizontal/vertical)
- Technique: CSS `background-position` avec `steps(8)` ou framer-motion
- Variantes: `walk`, `wave`, `breathe`, `radio`, `cabin-smoke`

## 3. Refonte complète `Gamification.tsx`

### Structure de la page (3 colonnes sur desktop)

```text
┌───────────────────────────────────────────────────────────────┐
│  Header: Avatar + Progress Bar + Resource Badges              │
├──────────────┬────────────────────────┬───────────────────────┤
│              │                        │                       │
│  Resource    │   ISLAND VIEW          │   Accessory Shop      │
│  Panel       │   (Central immersive)  │   + Penguin Avatar    │
│  + Food Grid │   - King on throne     │                       │
│              │   - Clickable zones    │                       │
│              │   - Mini-map           │                       │
├──────────────┴────────────────────────┴───────────────────────┤
│  Expeditions Section (horizontal scrollable cards)            │
└───────────────────────────────────────────────────────────────┘
```

### Design Tokens Dark Mode Premium
- Background: `#0B0E14`
- Card surface: `#1A1F26` with `border-white/5`
- Glassmorphism: `backdrop-blur-xl bg-white/5 border-white/10`
- Arctic accent: `sky-400` (#38BDF8)

### Header de Progression
- Avatar circulaire avec animation breathing (subtle scale pulse)
- Barre large "Évolution → Maître" avec gradient sky-500→purple-500
- 4 badges ressources en row: Dîners (🍽️ rouge), Saumons (🐟 bleu), Dorés (✨ ambre), Icebergs (🧊 cyan)

### Zone Centrale — L'Île
- Conteneur 100% largeur avec aspect-ratio 16:9 sur desktop
- Background: dégradé polaire (aurora borealis subtile animée)
- Centre: Trône du Roi Pingouin avec animation sprite `king_penguin_cycle`
- 3 zones cliquables autour:
  - "La Crique de la Productivité" (lien Tasks) — cabane animée
  - "La Clairière des Habitudes" (lien Habits) — cottage avec fumée
  - "Le Sommet du Focus" (lien Focus) — torche animée
- Mini-carte en coin haut-gauche (overview des îles)

### Animations Sprite
| Élément | Frames | Animation | Trigger |
|---------|--------|-----------|---------|
| King Penguin | 8 | Respiration/sway | Auto loop |
| Radio | 8 | Notes musicales | Hover |
| Cabin | 8 | Fumée cheminée | Auto loop |
| Mascot Penguin | 8 | Wave | Hover (saute) |

### Sections Inférieures
- **Expéditions**: Scroll horizontal de cartes avec progress bars, style glassmorphism
- **Boutique**: Grille 3 colonnes, prix en saumons, badge "Obtenu" vert

## 4. Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `src/assets/penguin-sprites.png` | Copier sprite sheet principal |
| `src/assets/penguin-wave-sprites.png` | Copier sprite wave |
| `src/components/penguin/SpriteAnimation.tsx` | **Créer** — Composant animation sprite |
| `src/components/penguin/IslandView.tsx` | **Créer** — Vue île immersive |
| `src/components/penguin/KingPenguin.tsx` | **Créer** — Roi avec sprite animation |
| `src/pages/Gamification.tsx` | **Réécrire** — Layout 3 colonnes, dark mode |
| `src/components/penguin/IcebergView.tsx` | **Supprimer** — Remplacé par IslandView |
| `src/components/penguin/PenguinAvatar.tsx` | **Modifier** — Ajouter hover jump + sprite option |
| `src/components/penguin/ExpeditionBoard.tsx` | **Modifier** — Style glassmorphism horizontal |
| `src/components/penguin/AccessoryShop.tsx` | **Modifier** — Style glassmorphism |

## 5. CSS Animations (à ajouter dans index.css)

```css
@keyframes sprite-walk { to { background-position: -800px 0; } }
@keyframes penguin-jump { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
```

## 6. Responsive
- Desktop: 3 colonnes (Resources | Island | Shop)
- Tablet: 2 colonnes (Island + Shop stacked | Resources side)
- Mobile: Single column, Island full-width, tabs pour Expeditions/Shop
