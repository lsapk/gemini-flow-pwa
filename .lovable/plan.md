

# Plan: Fix Vercel penguin + Refonte Apple des pages Focus, Journal et Réflexion

## 1. Fix penguin sur Vercel

**Problème** : Les imports d'assets via `import penguinScarf from "@/assets/penguin-scarf.png"` fonctionnent en dev mais peuvent échouer en production si Vite ne déduplique pas correctement React (contexte framer-motion perdu) ou si les assets ne sont pas correctement bundlés.

**Solution** : Ajouter `resolve.dedupe` dans `vite.config.ts` pour forcer une seule instance de React :
```ts
resolve: {
  alias: { "@": ... },
  dedupe: ["react", "react-dom", "react/jsx-runtime", "framer-motion"],
}
```

## 2. Focus — Timer immersif Apple

**Actuel** : Layout grid 3 colonnes, stats cards basiques, timer en texte brut.

**Nouveau** :
- **Header compact** : titre + 4 stat pills en `grid-cols-2 sm:grid-cols-4` avec glassmorphism (`bg-card/80 backdrop-blur-sm border-border/40 rounded-2xl`)
- **Timer central** : Grand cercle SVG (anneau de progression animé) au centre, temps en `text-6xl font-mono` à l'intérieur, session title au dessus
- **Contrôles** : Boutons `rounded-2xl` avec `active:scale-[0.95]`, icônes centrées
- **Setup form** : Inputs `bg-secondary/50 border-0 rounded-xl` style Apple filled
- **Side panel** : Tabs Apple segmented control, historique en cards glassmorphism
- **Transitions** : `AnimatePresence` entre état setup / timer actif, spring animations sur le cercle

## 3. Journal — Cards élégantes

**Actuel** : Cards avec `border-2 border-muted/50`, hover basique.

**Nouveau** :
- **JournalEntryCard** : `bg-card/80 backdrop-blur-sm border-border/30 rounded-2xl`, hover `bg-card/90`, `active:scale-[0.98]`
- **Mood badge** : `rounded-full` avec fond subtil semi-transparent adapté au thème dark
- **Form** : Modal-like card avec inputs filled Apple, textarea avec `min-h-[180px] rounded-xl bg-secondary/50 border-0`
- **Mood selector** : Grid de pills clickables au lieu d'un select dropdown (plus visuel et tactile)
- **Header** : Compteur d'entrées avec mini badge, symétrie titre/bouton
- **Loading** : Skeletons `rounded-2xl` avec shimmer

## 4. Réflexion — Interface contemplative

**Actuel** : Card basique avec textarea, historique en liste simple.

**Nouveau** :
- **Question card** : Grande card centrée, question en `text-xl font-medium` sur fond `bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl`
- **Textarea** : Style filled `bg-secondary/50 border-0 rounded-xl`, placeholder inspirant
- **Historique** : Cards glassmorphism avec date badge `rounded-full`, question en highlight subtil
- **Toggle** : Remplacer bouton Historique par tabs Apple segmented (Réflexion | Historique)
- **Compteur** : Badge avec nombre de réflexions en haut

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `vite.config.ts` | Ajouter `resolve.dedupe` |
| `src/pages/Focus.tsx` | Réécrire — Timer SVG circulaire, glassmorphism, transitions |
| `src/pages/Journal.tsx` | Améliorer — Header, form, mood grid, loading |
| `src/components/JournalEntryCard.tsx` | Glassmorphism, mood badge, micro-interactions |
| `src/pages/Reflection.tsx` | Réécrire — Tabs, question card gradient, glassmorphism historique |

