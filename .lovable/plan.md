

# Plan: Interface "Mon Pingouin" — Renforcer le côté jeu

## Constat
La page actuelle est propre mais ressemble à un dashboard, pas à un jeu. Il manque : un système de niveau visuel (XP bar avec level), des récompenses visuelles (animations de collecte), des micro-interactions ludiques, et un sentiment de progression tangible.

## Améliorations prévues

### 1. Header Hero — Style RPG
- Remplacer la simple barre de progression par un **système de niveau** visible : cercle XP autour de l'avatar (anneau SVG animé), numéro de niveau affiché
- Ajouter un **titre dynamique** sous le pingouin qui change selon le stade ("Poussin Aventurier", "Explorateur Polaire", "Empereur des Glaces")
- Les 4 badges ressources deviennent des **compteurs animés** style jeu (icône + nombre avec effet de rebond quand ça change)
- Ajouter des **étoiles/particules** autour de l'avatar qui brillent

### 2. Island View — Monde interactif
- Agrandir l'île (aspect `4/3` au lieu de `video`)
- Ajouter des **éléments de décor animés** : flocons qui tombent (CSS), vagues en bas, étoiles scintillantes dans le ciel
- Les 3 zones cliquables reçoivent des **mini-icônes animées** (rotation lente, glow pulsé) + un label toujours visible (pas seulement au hover)
- Ajouter une **zone "Cabane"** qui apparaît quand `has_library` est true (décor évolutif)
- Le pingouin central a un **dialogue bulle** aléatoire qui apparaît toutes les 10s ("Brrr... il fait froid!", "J'ai faim!", "Allons explorer!")

### 3. Expéditions — Style quêtes de jeu
- Chaque expédition reçoit une **icône de rareté** (commune ⚪, rare 🔵, épique 🟣, légendaire 🟡)
- Barre de progression avec **gradient animé** et effet de brillance (shimmer)
- Ajouter un **timer visuel** plus game-like (cercle countdown au lieu de texte)
- Carte d'expédition complétée : effet de **confetti/sparkle** au premier rendu

### 4. Boutique — Style inventaire de jeu
- Ajouter un **header avec solde** de saumons bien visible en haut
- Les items obtenu ont un **checkmark animé** (scale bounce)
- Les items verrouillés ont un **effet de flou** + cadenas
- Hover sur un item non-acheté : **preview tooltip** avec description et stats

### 5. Nouveaux éléments ludiques
- **Streak counter** visible dans le hero : "🔥 12 jours consécutifs"
- **Daily login bonus** : petit badge "Bonus du jour : +5 🦐" qui apparaît en haut
- **Dialogue du pingouin** : bulle de texte aléatoire avec messages contextuels

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/pages/Gamification.tsx` | **Réécrire** — Hero RPG, streak, dialogue |
| `src/components/penguin/IslandView.tsx` | **Améliorer** — Décors animés, bulles dialogue, zone cabane |
| `src/components/penguin/AnimatedPenguin.tsx` | **Améliorer** — Anneau XP SVG, particules |
| `src/components/penguin/ExpeditionBoard.tsx` | **Améliorer** — Rareté, shimmer, timer visuel |
| `src/components/penguin/AccessoryShop.tsx` | **Améliorer** — Header solde, blur locked, preview |
| `src/components/penguin/PearlsPanel.tsx` | **Améliorer** — Style cohérent |

